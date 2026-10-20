// Wakes the Vercel function early so the first TTS request is not slow.
// Empty VITE_TTS_URL = same-origin "/api" (production), same as useTTS.
const BASE = (import.meta.env.VITE_TTS_URL || '').replace(/\/$/, '');
const KEEP_ALIVE_MS = 4 * 60 * 1000;
let last = 0;

export function warmUpServer(force = false) {
  const now = Date.now();
  if (!force && now - last < 60000) return;   // at most once a minute
  last = now;
  fetch(`${BASE}/api/health`, { cache: 'no-store' }).catch(() => {});
}

export function startWarmup() {
  warmUpServer(true);                          // app opened
  window.addEventListener('online', () => warmUpServer(true));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') warmUpServer();
  });
  // Keep it warm while the app is open and visible
  setInterval(() => {
    if (document.visibilityState === 'visible') warmUpServer(true);
  }, KEEP_ALIVE_MS);
}