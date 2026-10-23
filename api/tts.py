"""
Natural-speech TTS API built on Edge TTS.

Endpoints
  GET  /api/health   wake-up / health check
  GET  /api/voices   list of available voices (bn-BD, bn-IN, en-US, en-GB, en-IN)
  POST /api/plan     split text into natural chunks (pauses, pitch, rate, volume)
  GET  /api/speak    synthesize ONE chunk and return audio/mpeg
"""

import os
import random
import re
import tempfile
from typing import Optional
from urllib.parse import quote

import edge_tts
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import asyncio
import hashlib
import html as html_lib
import json
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DEFAULT_VOICE = "bn-BD-NabanitaNeural"

# Only these locales are exposed. Edge TTS has no en-BD voice, so English
# is limited to US, UK (en-GB) and India.
ALLOWED_LOCALES = ["bn-BD", "bn-IN", "en-US", "en-GB", "en-IN"]

MAX_SPEAK_CHARS = 600    # per /api/speak request (keeps the GET URL short)
MAX_PLAN_CHARS = 5000    # per /api/plan request

# Default natural-speech settings
DEFAULTS = {"rate": -10, "pause": 30, "variety": 60, "question": 40}

RATE_RE = re.compile(r"^[+-]\d{1,3}%$")
PITCH_RE = re.compile(r"^[+-]\d{1,3}Hz$")
VOLUME_RE = re.compile(r"^[+-]\d{1,3}%$")

app = FastAPI(title="Natural TTS API")

# Open CORS so any origin (localhost, other domains) can call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def clamp(x, lo, hi):
    return max(lo, min(hi, x))


def locale_of(voice: str) -> str:
    # "bn-BD-NabanitaNeural" -> "bn-BD"
    return "-".join(voice.split("-")[:2])


def check_voice(voice: str) -> None:
    if locale_of(voice) not in ALLOWED_LOCALES:
        raise HTTPException(
            status_code=400,
            detail=f"voice locale must be one of {ALLOWED_LOCALES}",
        )


_voices_cache: Optional[list] = None


async def get_voices() -> list:
    """Fetch the voice list once per warm instance and keep only allowed locales."""
    global _voices_cache
    if _voices_cache is None:
        try:
            all_voices = await edge_tts.list_voices()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"voices error: {e}")

        voices = [
            {
                "name": v["ShortName"],
                "locale": v["Locale"],
                "gender": v["Gender"],
            }
            for v in all_voices
            if v["Locale"] in ALLOWED_LOCALES
        ]
        voices.sort(
            key=lambda v: (ALLOWED_LOCALES.index(v["locale"]), v["gender"], v["name"])
        )
        _voices_cache = voices
    return _voices_cache


def split_sentences(text: str):
    """
    Split text into sentences. Returns a list of [sentence, ends_paragraph].
    Splits on the Bengali danda, ? ! and on a period followed by whitespace.
    Commas never split. A line break marks a paragraph end.
    """
    lines = [ln.strip() for ln in text.replace("\r", "").split("\n")]
    lines = [ln for ln in lines if ln]

    units = []
    for li, line in enumerate(lines):
        parts = re.split(r"(?<=[ред?!])(?![ред?!])\s*|(?<=\.)\s+", line)
        parts = [p.strip() for p in parts if p and p.strip()]
        for pi, p in enumerate(parts):
            ends_paragraph = pi == len(parts) - 1 and li < len(lines) - 1
            units.append([p, ends_paragraph])

    # Merge very short sentences into the next one so speech does not feel choppy
    sentences = []
    buf = ""
    for text_part, para in units:
        buf = (buf + " " + text_part).strip()
        flag = para
        if len(buf) >= 12:
            sentences.append([buf, flag])
            buf = ""
    if buf:
        if sentences:
            sentences[-1][0] += " " + buf
            sentences[-1][1] = flag
        else:
            sentences.append([buf, flag])
    return sentences


def split_long(sentence: str, limit: int = 300, target: int = 120):
    """Very long sentences are cut at commas (no pause between the pieces)."""
    if len(sentence) <= limit:
        return [sentence]
    pieces, cur = [], ""
    for seg in re.findall(r"[^,]+,?", sentence):
        cur += seg
        if len(cur) >= target:
            pieces.append(cur.strip())
            cur = ""
    if cur.strip():
        pieces.append(cur.strip())
    return pieces or [sentence]


def speak_url(text: str, voice: str, rate: int, pitch: int, volume: int) -> str:
    return (
        f"/api/speak?text={quote(text, safe='')}"
        f"&voice={quote(voice, safe='')}"
        f"&rate={quote(f'{rate:+d}%', safe='')}"
        f"&pitch={quote(f'{pitch:+d}Hz', safe='')}"
        f"&volume={quote(f'{volume:+d}%', safe='')}"
    )


def build_plan(text, voice, base_rate, pause, variety, question):
    v = variety / 100          # variety 0..1
    q = question / 100         # question emphasis 0..1
    pause_scale = pause / 100  # pause 0..2

    sentences = split_sentences(text)
    chunks = []

    for si, (sentence, para) in enumerate(sentences):
        is_last = si == len(sentences) - 1
        last_char = sentence[-1]
        is_question = "?" in sentence

        pitch = 0.0
        rate_adj = 0.0
        volume = 0

        # Base pause (ms) and prosody by sentence ending
        if para:
            pause_ms = random.uniform(600, 900)
        elif last_char in "ред.":
            pause_ms = random.uniform(200, 450)
            pitch = random.uniform(-3, 0)      # voice falls slightly at sentence end
            rate_adj = random.uniform(-8, 2)
        elif last_char == "?":
            pause_ms = random.uniform(300, 550)
            rate_adj = random.uniform(-6, 2)
        elif last_char == "!":
            pause_ms = random.uniform(300, 500)
            pitch = random.uniform(1, 4)
            rate_adj = random.uniform(-2, 6)
        else:
            pause_ms = random.uniform(200, 400)

        # Occasionally add a longer "thinking" pause
        if random.random() < 0.15 * v:
            pause_ms += random.uniform(200, 500)

        rate = clamp(round(base_rate + rate_adj * v * 1.5), -50, 50)
        pitch_hz = round(pitch * v * 1.5)

        # Questions: one consistent emphasis over the whole sentence
        if is_question and q > 0:
            pitch_hz = round(random.uniform(6, 10) * q)
            rate = clamp(rate - round(6 * q), -50, 50)
            volume = round(8 * q)

        pieces = split_long(sentence)
        for pi, piece in enumerate(pieces):
            is_end = pi == len(pieces) - 1
            piece_pause = 0 if (not is_end or is_last) else round(pause_ms * pause_scale)
            chunks.append(
                {
                    "index": len(chunks),
                    "text": piece,
                    "pause_ms": piece_pause,
                    "rate": rate,
                    "pitch": pitch_hz,
                    "volume": volume,
                    "url": speak_url(piece, voice, rate, pitch_hz, volume),
                }
            )
    return chunks


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


class PlanRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_PLAN_CHARS)
    voice: str = DEFAULT_VOICE
    rate: int = Field(DEFAULTS["rate"], ge=-50, le=50)
    pause: int = Field(DEFAULTS["pause"], ge=0, le=200)
    variety: int = Field(DEFAULTS["variety"], ge=0, le=100)
    question: int = Field(DEFAULTS["question"], ge=0, le=100)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/voices")
async def voices():
    return await get_voices()


@app.post("/api/plan")
async def plan(req: PlanRequest):
    check_voice(req.voice)
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is empty")

    chunks = build_plan(text, req.voice, req.rate, req.pause, req.variety, req.question)
    return {
        "voice": req.voice,
        "settings": {
            "rate": req.rate,
            "pause": req.pause,
            "variety": req.variety,
            "question": req.question,
        },
        "count": len(chunks),
        "chunks": chunks,
    }


@app.get("/api/speak")
async def speak(
    text: str,
    voice: str = DEFAULT_VOICE,
    rate: str = "-10%",
    pitch: str = "+0Hz",
    volume: str = "+0%",
):
    check_voice(voice)
    if not text.strip():
        raise HTTPException(status_code=400, detail="text is empty")
    if len(text) > MAX_SPEAK_CHARS:
        raise HTTPException(
            status_code=400, detail=f"text is limited to {MAX_SPEAK_CHARS} characters"
        )
    if not RATE_RE.match(rate):
        raise HTTPException(status_code=400, detail="rate must look like -10% or +5%")
    if not PITCH_RE.match(pitch):
        raise HTTPException(status_code=400, detail="pitch must look like +0Hz or -3Hz")
    if not VOLUME_RE.match(volume):
        raise HTTPException(status_code=400, detail="volume must look like +0% or +8%")

    temp_path = None
    try:
        communicate = edge_tts.Communicate(
            text, voice, rate=rate, pitch=pitch, volume=volume
        )

        # /tmp is the only writable directory on Vercel
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3", dir="/tmp") as fp:
            temp_path = fp.name

        await communicate.save(temp_path)

        with open(temp_path, "rb") as f:
            audio_data = f.read()
    except Exception as e:
        # HTTPException keeps the CORS headers on error responses
        raise HTTPException(status_code=502, detail=f"tts error: {e}")
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

    # Same parameters always give the same audio, so it is safe to cache
    return Response(
        content=audio_data,
        media_type="audio/mpeg",
        headers={"Cache-Control": "public, max-age=3600"},
    )


# ---------------------------------------------------------------------------
# News: live RSS, nothing is stored anywhere (Vercel edge caches the response)
# ---------------------------------------------------------------------------

NEWS_SOURCES = {"bbc", "aljazeera", "dailystar", "local"}
BBC_FEEDS = {
    "world": "https://feeds.bbci.co.uk/news/world/rss.xml",
    "sport": "https://feeds.bbci.co.uk/sport/rss.xml",
    "politics": "https://feeds.bbci.co.uk/news/politics/rss.xml",
    "business": "https://feeds.bbci.co.uk/news/business/rss.xml",
    "technology": "https://feeds.bbci.co.uk/news/technology/rss.xml",
    "health": "https://feeds.bbci.co.uk/news/health/rss.xml",
    "science": "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    "entertainment": "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
}
AJ_FEED = "https://www.aljazeera.com/xml/rss/all.xml"
CC_NAMES = {"BD": "Bangladesh", "US": "United States", "GB": "United Kingdom", "IN": "India", "PK": "Pakistan",
            "AU": "Australia", "CA": "Canada", "SA": "Saudi Arabia", "AE": "UAE", "MY": "Malaysia", "SG": "Singapore"}
LOCAL_RATIO = 4  # local stories per 1 international story
TAG_RE = re.compile(r"<[^>]+>")


def google_news(q: str, cc: str) -> str:
    return f"https://news.google.com/rss/search?q={quote(q + ' when:2d')}&hl=en&gl={cc}&ceid={cc}:en"


def news_jobs(sources, topics, cc):
    """(url, source label, topic, is_google) for every feed to read."""
    jobs = []
    for src in sources:
        if src == "bbc":
            for t in topics or ["world"]:
                url = BBC_FEEDS.get(t.lower())
                jobs.append((url or google_news(f"{t} site:bbc.com", cc), "BBC", t, not url))
        elif src == "aljazeera":
            jobs.append((AJ_FEED, "Al Jazeera", "", False))
            for t in topics:
                jobs.append((google_news(f"{t} site:aljazeera.com", cc), "Al Jazeera", t, True))
        elif src == "dailystar":
            for t in topics or [""]:
                jobs.append((google_news(f"{t} site:thedailystar.net".strip(), cc), "The Daily Star", t, True))
        elif src == "local":
            if topics:
                for t in topics:
                    jobs.append((google_news(f"{t} {CC_NAMES.get(cc, '')}".strip(), cc), "", t, True))
            else:
                jobs.append((f"https://news.google.com/rss?hl=en&gl={cc}&ceid={cc}:en", "", "", True))
    return jobs


def clean_text(text, limit):
    text = html_lib.unescape(TAG_RE.sub(" ", text or ""))
    return re.sub(r"\s+", " ", text).strip()[:limit]


def load_feed(url, label, topic, is_google):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (DearNervousness news)"})
        with urllib.request.urlopen(req, timeout=6) as r:
            root = ET.fromstring(r.read(2_000_000))
    except Exception:
        return []
    out = []
    for it in root.iter("item"):
        title = clean_text(it.findtext("title"), 200)
        link = (it.findtext("link") or "").strip()
        if not title or not link.startswith("http"):
            continue
        el = it.find("source")
        source = label or (el.text if el is not None and el.text else "News")
        if el is not None and el.text and title.endswith(" - " + el.text):
            title = title[: -len(el.text) - 3]
        try:
            ts = parsedate_to_datetime(it.findtext("pubDate")).timestamp()
        except Exception:
            ts = 0
        out.append({
            "id": hashlib.sha1(link.encode()).hexdigest()[:10],
            "title": title,
            # Google News descriptions only repeat the headline, so skip them
            "summary": "" if is_google else clean_text(it.findtext("description"), 400),
            "link": link, "source": source, "topic": topic, "ts": ts,
        })
    out.sort(key=lambda x: -x["ts"])
    return out


@app.get("/api/news")
async def news(country: str = "BD", sources: str = "", topics: str = "", limit: int = 40):
    cc = country.upper() if re.fullmatch(r"[A-Za-z]{2}", country) else "BD"
    src = [s for s in dict.fromkeys(x.strip() for x in sources.split(",")) if s in NEWS_SOURCES] or ["bbc", "aljazeera"]
    tops = [t[:40] for t in dict.fromkeys(x.strip() for x in topics.split(",")) if t][:6]
    limit = max(1, min(limit, 60))

    # Country news is always included; the chosen sources fill the international share
    local_src = ["local"] + (["dailystar"] if cc == "BD" and "dailystar" in src else [])
    intl_src = [x for x in src if x not in local_src]
    local_jobs, intl_jobs = news_jobs(local_src, tops, cc), news_jobs(intl_src, tops, cc)
    res = await asyncio.gather(*[asyncio.to_thread(load_feed, *j) for j in local_jobs + intl_jobs])
    local_lists, intl_lists = res[:len(local_jobs)], res[len(local_jobs):]

    seen_t, seen_l = [], set()

    def fresh(it):
        # Same link, or headline sharing >=60% of its words with one already taken = duplicate
        link = it["link"].split("?")[0]
        words = {w for w in re.findall(r"\w+", it["title"].lower()) if len(w) > 2}
        if link in seen_l:
            return False
        for w2 in seen_t:
            if len(words) >= 4 and len(words & w2) / max(1, len(words | w2)) >= 0.6:
                return False
        seen_l.add(link)
        seen_t.append(words)
        return True

    def mix(lists):
        # Round robin so one source does not fill the whole pool
        out = []
        for i in range(max((len(l) for l in lists), default=0)):
            for l in lists:
                if i < len(l) and fresh(l[i]):
                    out.append(l[i])
        return out

    local, intl = mix(local_lists), mix(intl_lists)
    items = []
    while (local or intl) and len(items) < limit:
        for _ in range(LOCAL_RATIO):
            if local:
                items.append(local.pop(0))
        if intl:
            items.append(intl.pop(0))
        elif not local:
            break
    items = items[:limit]

    return Response(
        content=json.dumps(items),
        media_type="application/json",
        headers={"Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600"},
    )