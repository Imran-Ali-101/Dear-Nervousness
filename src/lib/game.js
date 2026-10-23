import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { scoped, currentUserId } from './userScope';
import { callGemini, parseJson } from './gemini';
import { TOPICS } from '../data/gameTopics';

const KEY = 'dn_game';
const EVENT = 'dn-game';

export const TOTAL_LEVELS = TOPICS.length;
export const PASS_START = 60;    // pass mark of level 1
export const PASS_END = 90;      // pass mark of the last level
export const MIN_TURNS = 4;      // spoken answers needed before a session can be scored
export const GAME_MINUTES = 5;

// Pass mark grows evenly from PASS_START to PASS_END
export const passMark = (level) =>
  Math.round(PASS_START + ((PASS_END - PASS_START) * (level - 1)) / Math.max(TOTAL_LEVELS - 1, 1));

// YYYY-MM-DD in the user's local time
export const todayKey = () => new Date().toLocaleDateString('en-CA');

const empty = () => ({ passed: {}, best: {}, lastPassDate: '', last: null });

const read = () => {
  try { return { ...empty(), ...JSON.parse(localStorage.getItem(scoped(KEY)) || '{}') }; }
  catch { return empty(); }
};

// ---- Supabase sync (localStorage stays as a fast cache) ----
const push = (data) => {
  const id = currentUserId();
  if (!id) return;
  supabase.from('game_progress')
    .upsert({ user_id: id, data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .then(({ error }) => { if (error) console.error('Game sync failed:', error.message); });
};

const write = (data) => {
  try { localStorage.setItem(scoped(KEY), JSON.stringify(data)); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVENT));
  push(data);
};

// Merge two copies (this device and the server): keep the best of both
const merge = (a, b) => {
  const passed = { ...a.passed };
  for (const [k, v] of Object.entries(b.passed || {})) {
    if (!passed[k] || v.score > passed[k].score) passed[k] = v;
  }
  const best = { ...a.best };
  for (const [k, v] of Object.entries(b.best || {})) best[k] = Math.max(best[k] || 0, v);
  const last = (a.last?.startedAt || 0) >= (b.last?.startedAt || 0) ? a.last : b.last;
  return { passed, best, last: last || null, lastPassDate: [a.lastPassDate, b.lastPassDate].sort().pop() || '' };
};

// Call this after login, next to syncSessions()
export const syncGame = async () => {
  if (!currentUserId()) return;
  const { data, error } = await supabase.from('game_progress').select('data').maybeSingle();
  if (error) { console.error('Game download failed:', error.message); return; }
  write(merge(read(), { ...empty(), ...(data?.data || {}) }));
};

// ---- Level logic ----
// Number of levels passed in a row from level 1
export const passedCount = (p) => {
  let n = 0;
  while (p.passed[n + 1]) n++;
  return n;
};

// 'passed' | 'open' | 'tomorrow' | 'locked'
// Missing a day changes nothing: the next unpassed level simply stays open.
export const levelStatus = (p, level) => {
  const done = passedCount(p);
  if (level <= done) return 'passed';
  if (level === done + 1) return p.lastPassDate === todayKey() ? 'tomorrow' : 'open';
  return 'locked';
};

// Setup passed to /practice (uses the existing custom persona and custom prompt)
export const gameConfig = (level) => {
  const topic = TOPICS[level - 1];
  const guide = topic.questions.length
    ? `Guide questions (ask one at a time, adapt to the answers): ${topic.questions.join(' | ')}`
    : 'Invent your own thought-provoking questions about the topic.';
  return {
    language: 'en',
    type: 'speaking',
    persona: 'custom',
    level: level <= 14 ? 'easy' : level <= 29 ? 'medium' : 'hard',
    minutes: GAME_MINUTES,
    customPersona: "A sharp but friendly discussion partner who runs a structured conversation on one topic and politely challenges the user's opinions.",
    customPrompt: `GAME MODE. Topic: "${topic.title}". ${topic.description} ${guide} Open by introducing the topic in one sentence and asking the first question. When an answer is short, ask the user to explain why or give an example. Sometimes offer a respectful counter-argument so the user has to defend their view. Never evaluate, score or correct the user.`,
    game: { level, topicId: topic.id },
  };
};

// ---- Scoring ----
const WEIGHTS = { relevance: 25, argument: 25, vocabulary: 20, grammar: 15, fluency: 15 };
const clamp = (v) => (Number.isFinite(+v) ? Math.max(0, Math.min(100, Math.round(+v))) : 0);

async function scoreGameSession({ model, topic, turns }) {
  const spoken = turns.filter((t) => t.userText);
  if (spoken.length < MIN_TURNS) return { tooShort: true, spoken: spoken.length, score: 0, breakdown: null, feedback: '' };

  const convo = spoken.map((t) => `AI: ${t.aiText}\nUser: ${t.userText}`).join('\n');
  const prompt = `You are a strict, consistent English speaking examiner. Score ONLY the User's lines in this discussion about "${topic.title}".
Return ONLY JSON: {"relevance":0-100,"argument":0-100,"vocabulary":0-100,"grammar":0-100,"fluency":0-100,"feedback":"2 short sentences in English"}
Scale: 50 = average intermediate speaker, 70 = good, 85 = very good advanced speaker, 95+ = near native and very persuasive. Be strict and consistent.
relevance = stays on topic and answers the questions. argument = gives reasons, examples and defends opinions. vocabulary = range and precision of words. grammar = correctness. fluency = smooth flow, few fillers and hesitations.

${convo}`;

  const raw = await callGemini(model, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0 },
  });
  const a = parseJson(raw);
  const breakdown = Object.fromEntries(Object.keys(WEIGHTS).map((k) => [k, clamp(a[k])]));
  const score = Math.round(Object.entries(WEIGHTS).reduce((s, [k, w]) => s + breakdown[k] * w, 0) / 100);
  return { score, breakdown, feedback: typeof a.feedback === 'string' ? a.feedback.slice(0, 300) : '' };
}

// Score a finished session and update the progress
export async function finishGame({ startedAt, game, model, turns }) {
  const topic = TOPICS.find((t) => t.id === game.topicId);
  let result;
  try {
    result = await scoreGameSession({ model, topic, turns });
  } catch (err) {
    console.error('Game scoring failed:', err);
    result = { failed: true, score: 0, breakdown: null, feedback: '' };
  }

  const p = read();
  const need = passMark(game.level);
  const status = levelStatus(p, game.level);
  const scored = !result.failed && !result.tooShort;
  const passed = scored && result.score >= need;
  const counted = passed && status === 'open';   // only the first pass of the next level moves progress

  const next = { ...p, last: { startedAt, level: game.level, need, passed, counted, replay: status === 'passed', ...result } };
  if (scored) next.best = { ...p.best, [game.level]: Math.max(p.best[game.level] || 0, result.score) };
  if (counted) {
    next.passed = { ...p.passed, [game.level]: { score: result.score, date: todayKey() } };
    next.lastPassDate = todayKey();
  }
  write(next);
  return next.last;
}

export const useGame = () => {
  const [state, setState] = useState(read);
  useEffect(() => {
    const refresh = () => setState(read());
    window.addEventListener(EVENT, refresh);
    return () => window.removeEventListener(EVENT, refresh);
  }, []);
  return state;
};