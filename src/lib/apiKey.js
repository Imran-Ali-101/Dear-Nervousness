const KEY = 'dn_gemini_key';
const MODELS_CACHE = 'dn_gemini_models';

// The key lives only in this browser (localStorage) and is sent only to Google
export const getGeminiKey = () => {
  try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
};

export const hasGeminiKey = () => getGeminiKey().length > 0;

export const setGeminiKey = (key) => {
  try {
    localStorage.setItem(KEY, key.trim());
    sessionStorage.removeItem(MODELS_CACHE); // the model list depends on the key
  } catch { /* ignore */ }
};

export const clearGeminiKey = () => {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(MODELS_CACHE);
  } catch { /* ignore */ }
};