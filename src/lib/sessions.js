import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { scoped, currentUserId } from './userScope';
import { analyzeSession } from './analysis';
import { hasGeminiKey } from './apiKey';

const KEY = 'dn_sessions';
const MAX = 100;
const KEEP_CHATS = 5; // only the newest 5 sessions keep their conversation
const EVENT = 'dn-sessions';

const read = () => {
  try {
    const list = JSON.parse(localStorage.getItem(scoped(KEY)) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const prune = (list) => {
  const keep = new Set([...list].sort((a, b) => b.startedAt - a.startedAt).slice(0, KEEP_CHATS).map((s) => s.startedAt));
  return list.map((s) => (keep.has(s.startedAt) || !s.turns ? s : { ...s, turns: undefined }));
};

// Save and tell every open page that the data changed
const write = (list) => {
  try { localStorage.setItem(scoped(KEY), JSON.stringify(prune(list))); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVENT));
};

// ---- Supabase sync (localStorage stays as a fast cache) ----
const COLS = 'started_at,duration_sec,language,type,persona,level,analysis,turns';

const toRow = (s) => ({
  user_id: currentUserId(),
  started_at: new Date(s.startedAt).toISOString(),
  duration_sec: s.durationSec ?? 0,
  language: s.language,
  type: s.type,
  persona: s.persona ?? null,
  level: s.level ?? null,
  analysis: s.analysis ?? null,
  turns: s.turns ?? null,
});

const fromRow = (r) => ({
  startedAt: new Date(r.started_at).getTime(),
  durationSec: r.duration_sec,
  language: r.language,
  type: r.type,
  persona: r.persona,
  level: r.level,
  ...(r.analysis ? { analysis: r.analysis } : {}),
  ...(r.turns ? { turns: r.turns } : {}),
});

// Save one session to the database (fire and forget; the local copy is already saved)
const push = (startedAt) => {
  if (!currentUserId()) return;
  const s = read().find((x) => x.startedAt === startedAt);
  if (!s) return;
  supabase.from('sessions').upsert(toRow(s), { onConflict: 'user_id,started_at' })
    .then(({ error }) => { if (error) console.error('Session sync failed:', error.message); });
};

// After login: download the user's sessions, upload any that exist only on this device
let inflight = null;
const doSync = async () => {
  if (!currentUserId()) return;
  const { data, error } = await supabase.from('sessions').select(COLS).order('started_at', { ascending: false }).limit(MAX);
  if (error) { console.error('Session download failed:', error.message); return; }

  const local = read();
  const localBy = new Map(local.map((s) => [s.startedAt, s]));
  const repaired = [];
  const remote = data.map(fromRow).map((r) => {
    const mine = localBy.get(r.startedAt);
    if (!r.analysis && mine?.analysis) {   // server lacks it: keep ours and send it up again
      const merged = { ...r, analysis: mine.analysis };
      repaired.push(merged);
      return merged;
    }
    return r;
  });
  const have = new Set(remote.map((s) => s.startedAt));
  const localOnly = local.filter((s) => !have.has(s.startedAt));
  const upload = [...localOnly, ...repaired];
  if (upload.length) {
    const { error: upErr } = await supabase.from('sessions').upsert(upload.map(toRow), { onConflict: 'user_id,started_at' });
    if (upErr) console.error('Session upload failed:', upErr.message);
  }
  write([...remote, ...localOnly]);
  analyzePending();   // finish any analysis that was cut off
};

export const syncSessions = () => {
  if (!inflight) inflight = doSync().finally(() => { inflight = null; });
  return inflight;
};

// Newest first
export const getSessions = () => read().sort((a, b) => b.startedAt - a.startedAt);

export const addSession = (session) => {
  write([...read(), session].slice(-MAX));
  push(session.startedAt);
};

// Attach turns / analysis to a saved session later
export const updateSession = (startedAt, patch) => {
  write(read().map((s) => (s.startedAt === startedAt ? { ...s, ...patch } : s)));
  push(startedAt);
};

// Last chats that have saved turns (old sessions stored only a number)
export const getRecentChats = (n = 5) =>
  getSessions().filter((s) => Array.isArray(s.turns) && s.turns.length).slice(0, n);

// React hook: the list refreshes by itself when a session is saved or updated
export const useSessions = () => {
  const [list, setList] = useState(getSessions);
  useEffect(() => {
    const refresh = () => setList(getSessions());
    window.addEventListener(EVENT, refresh);
    return () => window.removeEventListener(EVENT, refresh);
  }, []);
  return list;
};

const dayOf = (t) => new Date(t).toDateString();

export const practicedToday = (list = getSessions()) =>
  list.some((s) => dayOf(s.startedAt) === new Date().toDateString());

// Consecutive practice days, counting back from today (or yesterday)
export const getStreak = (list = getSessions()) => {
  const days = new Set(list.map((s) => dayOf(s.startedAt)));
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  let count = 0;
  while (days.has(d.toDateString())) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
};

// ---- Analysis that survives a refresh ----
const analyzing = new Set();   // each session is tried once per page load

const pickModel = () => {
  try { return localStorage.getItem('dn_model') || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.1-flash-lite'; }
  catch { return 'gemini-3.1-flash-lite'; }
};

export const runAnalysis = async (startedAt, { model, language, turns, visual }) => {
  if (analyzing.has(startedAt)) return;
  analyzing.add(startedAt);
  const analysis = await analyzeSession({ model, language, turns });
  if (analysis) updateSession(startedAt, { analysis: visual ? { ...analysis, visual } : analysis });
};

// Sessions of the last 24h that have a conversation but no finished analysis
export const analyzePending = async () => {
  if (!hasGeminiKey() || !currentUserId()) return;
  const todo = read().filter((s) =>
    !s.analysis?.summary &&
    Date.now() - s.startedAt < 864e5 &&
    Array.isArray(s.turns) && s.turns.some((t) => t.userText));
  for (const s of todo) await runAnalysis(s.startedAt, { model: pickModel(), language: s.language, turns: s.turns, visual: s.analysis?.visual });
};