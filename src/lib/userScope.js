// Per-account storage on a shared browser: keys become "dn_sessions:<user id>"
let scope = 'anon';
const LEGACY = ['dn_sessions', 'dn_general_prompt'];

// Called by AuthProvider whenever the logged-in user changes
export const setUserScope = (id) => {
  scope = id || 'anon';
  if (!id) return;
  try {
    // One-time move of data saved before accounts existed (first account to log in gets it)
    for (const k of LEGACY) {
      const old = localStorage.getItem(k);
      if (old === null) continue;
      if (localStorage.getItem(`${k}:${id}`) === null) localStorage.setItem(`${k}:${id}`, old);
      localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
};

export const scoped = (key) => `${key}:${scope}`;