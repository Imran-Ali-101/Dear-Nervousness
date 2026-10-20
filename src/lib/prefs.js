const get = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

// Theme: 'light' | 'dark' | 'system'
export const getTheme = () => get('dn_theme', 'light');

export const applyTheme = (theme = getTheme()) => {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
};

export const setTheme = (theme) => { put('dn_theme', theme); applyTheme(theme); };

// Default practice language: 'bn' | 'en'
export const getDefaultLang = () => get('dn_lang', 'bn');
export const setDefaultLang = (lang) => put('dn_lang', lang);