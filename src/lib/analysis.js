import { callGemini, parseJson } from './gemini';

// Keep AI output safe: only short strings, limited count (bad shapes become empty)
const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const cleanImprovements = (list) => (Array.isArray(list) ? list : [])
  .map((x) => ({ original: str(x?.original), better: str(x?.better), why: str(x?.why, 160) }))
  .filter((x) => x.original && x.better && x.original.toLowerCase() !== x.better.toLowerCase())
  .slice(0, 3);
const cleanVocab = (list) => (Array.isArray(list) ? list : [])
  .map((x) => ({ weak: str(x?.weak, 40), better: (Array.isArray(x?.better) ? x.better : []).map((b) => str(b, 40)).filter(Boolean).slice(0, 3) }))
  .filter((x) => x.weak && x.better.length)
  .slice(0, 3);

const score = (v) => (Number.isFinite(+v) ? Math.max(0, Math.min(100, Math.round(+v))) : null);

export async function analyzeSession({ model, language, turns }) {
  const spoken = turns.filter((t) => t.userText);
  if (!spoken.length) return null;

  // Numbers we calculate ourselves (no AI needed)
  const words = spoken.reduce((s, t) => s + t.words, 0);
  const sec = spoken.reduce((s, t) => s + t.speechSec, 0);
  const fillerCount = spoken.reduce((s, t) => s + t.fillers.length, 0);
  // Pauses (old sessions have no pause numbers, so "|| 0")
  const shortPauses = spoken.reduce((s, t) => s + (t.shortPauses || 0), 0);
  const longPauses = spoken.reduce((s, t) => s + (t.longPauses || 0), 0);
  const pauseSec = spoken.reduce((s, t) => s + (t.pauseSec || 0), 0);
  const longestPauseSec = Math.max(0, ...spoken.map((t) => t.longestPauseSec || 0));
  const result = {
    shortPauses,
    longPauses,
    longestPauseSec,
    pausesPerMin: sec > 3 ? Math.round(((shortPauses + longPauses) / (sec / 60)) * 10) / 10 : null,
    pausePercent: sec > 3 ? Math.min(100, Math.round((pauseSec / sec) * 100)) : null,
    words,
    fillerCount,
    wpm: sec > 3 ? Math.round(words / (sec / 60)) : null,
    fillersPerMin: sec > 3 ? Math.round((fillerCount / (sec / 60)) * 10) / 10 : null,
    confidence: null, clarity: null, grammar: null, summary: '', tips: [], improvements: [], vocab: [],
  };

  // Scores and tips: one call per session
  const lang = language === 'bn' ? 'Bengali' : 'English';
  const convo = spoken.map((t) => `User: ${t.userText}\nCoach: ${t.aiText}`).join('\n');
  const prompt = `You are a speaking coach. Evaluate ONLY the User's lines in this ${lang} practice conversation.
Return ONLY JSON: {"confidence":0-100,"clarity":0-100,"grammar":0-100,"summary":"2 short sentences","tips":["tip","tip","tip"],"improvements":[{"original":"exact phrase the User said","better":"a clearer, more professional, more concise version","why":"very short reason"}],"vocab":[{"weak":"a weak or repeated word the User used","better":["stronger word","stronger word"]}]}
Rules: "improvements" has at most 3 items, each "original" must be copied exactly from a User line. "vocab" has at most 3 items. If there is nothing worth improving, return empty arrays. Write summary, tips and "why" in ${lang}. Write "better" in ${lang}.

${convo}`;

  try {
    const raw = await callGemini(model, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    const a = parseJson(raw);
    result.confidence = score(a.confidence);
    result.clarity = score(a.clarity);
    result.grammar = score(a.grammar);
    result.summary = a.summary || '';
    result.tips = Array.isArray(a.tips) ? a.tips.slice(0, 3) : [];
    result.improvements = cleanImprovements(a.improvements);
    result.vocab = cleanVocab(a.vocab);
  } catch (err) {
    console.error('Session analysis failed:', err);
  }
  return result;
}