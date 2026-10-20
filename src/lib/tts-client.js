/**
 * tts-client.js
 * Framework-agnostic client for the Natural TTS API (works in React, Vue, plain JS).
 *
 * Usage:
 *   import { createTTS } from "./tts-client.js";
 *   const tts = createTTS({ baseUrl: "https://YOUR-APP.vercel.app" });
 *   await tts.speak("Hello, how are you?", { voice: "en-US-EricNeural" });
 *   tts.stop();
 *
 * Call speak() from a user gesture (e.g. a click handler) so the browser
 * allows audio playback.
 */

export const DEFAULTS = {
  voice: "bn-BD-NabanitaNeural",
  rate: -10,     // speed, -50..50 (%)
  pause: 30,     // pause length, 0..200 (% of the natural pause)
  variety: 60,   // random variation in pace and pitch, 0..100
  question: 40,  // emphasis on questions, 0..100
};

export function createTTS(options = {}) {
  const {
    baseUrl = "",
    maxParallel = 3,   // how many chunks are downloaded at the same time
    onState = null,    // optional callback: "idle" | "loading" | "speaking"
    ...initial
  } = options;

  const settings = { ...DEFAULTS, ...initial };
  const base = baseUrl.replace(/\/$/, "");

  let runId = 0;        // incremented on every speak()/stop() to cancel older runs
  let current = null;   // audio element that is playing right now
  let abortPlay = null; // resolves the pending "wait for audio end" promise

  const setState = (s) => { if (onState) onState(s); };

  async function request(path, init) {
    const res = await fetch(base + path, init);
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json()).detail; } catch (_) { /* ignore */ }
      throw new Error(`API error ${res.status}${detail ? ": " + detail : ""}`);
    }
    return res;
  }

  /** Wake up the serverless function (call once on page load). */
  function warmUp() {
    return request("/api/health").catch(() => {});
  }

  /** List available voices: [{ name, locale, gender }] */
  async function getVoices() {
    return (await request("/api/voices")).json();
  }

  /** Download one chunk and return an Audio element that is ready to play. */
  async function loadAudio(chunk) {
    const res = await request(chunk.url);
    const blob = await res.blob();
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = URL.createObjectURL(blob);
    await new Promise((resolve, reject) => {
      audio.oncanplaythrough = resolve;
      audio.onloadeddata = resolve;
      audio.onerror = () => reject(new Error("Audio decode failed"));
      audio.load();
    });
    return audio;
  }

  /** Sleep that can be cancelled by stop(). */
  async function wait(ms, id) {
    const end = Date.now() + ms;
    while (id === runId && Date.now() < end) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  /** Stop playback and cancel any pending downloads. */
  function stop() {
    runId++;
    if (current) current.pause();
    if (abortPlay) abortPlay();
    setState("idle");
  }

  /**
   * Speak text. Resolves with "finished" or "stopped".
   * Per-call overrides: { voice, rate, pause, variety, question }
   */
  async function speak(text, overrides = {}) {
    stop();
    const id = runId;
    const opts = { ...settings, ...overrides };

    setState("loading");
    let chunks;
    try {
      const res = await request("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: opts.voice,
          rate: opts.rate,
          pause: opts.pause,
          variety: opts.variety,
          question: opts.question,
        }),
      });
      chunks = (await res.json()).chunks;
    } catch (err) {
      if (id === runId) setState("idle");
      throw err;
    }
    if (id !== runId) return "stopped";

    // Start downloading right away; keep up to maxParallel requests running
    // while earlier chunks are playing.
    const jobs = new Array(chunks.length);
    let next = 0;
    let running = 0;
    const pump = () => {
      while (running < maxParallel && next < chunks.length && id === runId) {
        const i = next++;
        running++;
        jobs[i] = loadAudio(chunks[i]).finally(() => {
          running--;
          pump();
        });
        jobs[i].catch(() => {}); // errors are handled when the chunk is awaited
      }
    };
    pump();

    try {
      for (let i = 0; i < chunks.length; i++) {
        if (id !== runId) return "stopped";
        const audio = await jobs[i];
        if (id !== runId) return "stopped";

        current = audio;
        setState("speaking");
        await new Promise((resolve, reject) => {
          abortPlay = resolve;
          audio.onended = resolve;
          audio.onerror = () => reject(new Error("Audio playback failed"));
          audio.play().catch(reject);
        });
        URL.revokeObjectURL(audio.src);
        abortPlay = null;

        if (id !== runId) return "stopped";
        if (chunks[i].pause_ms > 0) await wait(chunks[i].pause_ms, id);
      }
      if (id === runId) setState("idle");
      return id === runId ? "finished" : "stopped";
    } catch (err) {
      if (id === runId) setState("idle");
      throw err;
    }
  }

  return { speak, stop, getVoices, warmUp, settings };
}