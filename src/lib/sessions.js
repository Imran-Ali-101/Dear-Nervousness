const KEY = 'dn_sessions';
const MAX = 100;

const read = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

// Newest first
export const getSessions = () => read().sort((a, b) => b.startedAt - a.startedAt);

export const addSession = (session) => {
  try { localStorage.setItem(KEY, JSON.stringify([...read(), session].slice(-MAX))); } catch { /* ignore */ }
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