import { scoped } from './userScope';

const KEY = 'dn_onboarded';

// Saved per account on this device; clearing it shows the guide again
export const seenOnboarding = () => {
  try { return localStorage.getItem(scoped(KEY)) === '1'; } catch { return true; }
};

export const markOnboarded = () => {
  try { localStorage.setItem(scoped(KEY), '1'); } catch { /* ignore */ }
};