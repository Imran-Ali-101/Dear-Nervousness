import { callGemini, parseJson } from './gemini';

const score = (v) => (Number.isFinite(+v) ? Math.max(0, Math.min(100, Math.round(+v))) : null);

export async function analyzeSession({ model, language, turns }) {
  const spoken = turns.filter((t) => t.userText);
  if (!spoken.length) return null;

  // Numbers we calculate ourselves (no AI needed)
  const words = spoken.reduce((s, t) => s + t.words, 0);
  const sec = spoken.reduce((s, t) => s + t.speechSec, 0);
  const fillerCount = spoken.reduce((s, t) => s + t.fillers.length, 0);
  const result = {
    words,
    fillerCount,
    wpm: sec > 3 ? Math.round(words / (sec / 60)) : null,
    fillersPerMin: sec > 3 ? Math.round((fillerCount / (sec / 60)) * 10) / 10 : null,
    confidence: null, clarity: null, grammar: null, summary: '', tips: [],
  };

  // Scores and tips: one call per session
  const lang = language === 'bn' ? 'Bengali' : 'English';
  const convo = spoken.map((t) => `User: ${t.userText}\nCoach: ${t.aiText}`).join('\n');
  const prompt = `You are a speaking coach. Evaluate ONLY the User's lines in this ${lang} practice conversation.
Return ONLY JSON: {"confidence":0-100,"clarity":0-100,"grammar":0-100,"summary":"2 short sentences","tips":["tip","tip","tip"]}
Write summary and tips in ${lang}.

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
  } catch (err) {
    console.error('Session analysis failed:', err);
  }
  return result;
}