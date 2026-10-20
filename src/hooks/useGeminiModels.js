import { useEffect, useState } from 'react';
import { getGeminiKey } from '../lib/apiKey';

const ENV_MODEL = import.meta.env.VITE_GEMINI_MODEL || '';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';
const CACHE_KEY = 'dn_gemini_models';
const SAVED_KEY = 'dn_model';
const CACHE_MS = 60 * 60 * 1000; // cache the model list for 1 hour

// Keep only Flash / Flash-Lite / Pro text models; skip image, tts, live, embedding, etc.
const EXCLUDE = /image|tts|live|embedding|veo|imagen|audio|robotics|computer|gemma|learnlm|aqa|deep-research|-\d{3}$/;

const pickDefault = (list) => {
  const ids = list.map((m) => m.value);
  return (
    ids.find((id) => id === ENV_MODEL) ||
    ids.find((id) => /3\.1.*flash-lite/.test(id) && !/preview/.test(id)) ||
    ids.find((id) => /3\.1.*flash-lite/.test(id)) ||
    ids.find((id) => /flash-lite/.test(id)) ||
    ids[0] ||
    ''
  );
};

async function fetchModels(apiKey) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.t < CACHE_MS) return cached.list;
  } catch { /* ignore cache errors */ }

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${encodeURIComponent(apiKey)}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const list = (data.models || [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => ({ value: m.name.replace('models/', ''), label: m.displayName || m.name }))
    .filter((m) => /^gemini-/.test(m.value) && /flash|pro/.test(m.value) && !EXCLUDE.test(m.value))
    .sort((a, b) => b.value.localeCompare(a.value, undefined, { numeric: true }));

  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), list })); } catch { /* ignore */ }
  return list;
}

export default function useGeminiModels() {
  const [models, setModels] = useState([]);
  const [model, setModelState] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const apply = (list) => {
      if (cancelled) return;
      const finalList = list.length
        ? list
        : [{ value: ENV_MODEL || FALLBACK_MODEL, label: ENV_MODEL || FALLBACK_MODEL }];
      let saved = '';
      try { saved = localStorage.getItem(SAVED_KEY) || ''; } catch { /* ignore */ }
      setModels(finalList);
      setModelState(finalList.some((m) => m.value === saved) ? saved : pickDefault(finalList));
      setLoading(false);
    };

    const apiKey = getGeminiKey();
    if (!apiKey) apply([]);
    else fetchModels(apiKey).then(apply).catch(() => apply([]));

    return () => { cancelled = true; };
  }, []);

  const setModel = (value) => {
    setModelState(value);
    try { localStorage.setItem(SAVED_KEY, value); } catch { /* ignore */ }
  };

  return { models, model, setModel, loading };
}