import { useEffect, useState } from 'react';

const KEY = 'dn_sessions';
const MAX = 100;
const EVENT = 'dn-sessions';

const read = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

// Save and tell every open page that the data changed
const write = (list) => {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVENT));
};

// Newest first
export const getSessions = () => read().sort((a, b) => b.startedAt - a.startedAt);

export const addSession = (session) => write([...read(), session].slice(-MAX));

// Attach turns / analysis to a saved session later
export const updateSession = (startedAt, patch) =>
  write(read().map((s) => (s.startedAt === startedAt ? { ...s, ...patch } : s)));

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