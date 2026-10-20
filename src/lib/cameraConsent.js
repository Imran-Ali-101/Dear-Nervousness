import { scoped } from './userScope';

const KEY = 'dn_camera_consent';

export const hasCameraConsent = () => {
  try { return localStorage.getItem(scoped(KEY)) === '1'; } catch { return false; }
};

export const giveCameraConsent = () => {
  try { localStorage.setItem(scoped(KEY), '1'); } catch { /* ignore */ }
};