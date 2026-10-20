import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faKey, faEye, faEyeSlash, faCircleCheck, faTriangleExclamation,
  faTrash, faShieldHalved, faArrowUpRightFromSquare, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { getGeminiKey, setGeminiKey, clearGeminiKey } from '../lib/apiKey';

// Cheap request that fails if the key is invalid
async function verifyKey(key) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${encodeURIComponent(key)}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
}

export default function Settings() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(getGeminiKey());
  const [input, setInput] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok: boolean, text: string }

  const save = async () => {
    const key = input.trim();
    if (!key) return;
    setBusy(true);
    setMsg(null);
    try {
      await verifyKey(key);
      setGeminiKey(key);
      setSaved(key);
      setInput('');
      setMsg({ ok: true, text: 'API key verified and saved on this device.' });
    } catch (err) {
      setMsg({ ok: false, text: `Could not verify the key: ${err.message}` });
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    clearGeminiKey();
    setSaved('');
    setMsg({ ok: true, text: 'API key removed from this device.' });
  };

  return (
    <div className="min-h-[100dvh] bg-[#f6f8fc] text-[#1b1f24]">
      <header className="border-b border-gray-200 bg-white px-3 py-3 md:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button onClick={() => navigate('/')} aria-label="Back to dashboard" className="rounded-lg px-2.5 py-2 text-gray-700 hover:bg-gray-100">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 py-6 md:px-6 md:py-8">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FontAwesomeIcon icon={faKey} />
            </span>
            <div>
              <h2 className="font-bold text-gray-900">Gemini API Key</h2>
              <p className="text-xs text-gray-500">Required to practice. Each user uses their own key.</p>
            </div>
          </div>

          {saved && (
            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <span className="flex items-center gap-2.5 text-sm font-semibold text-emerald-800">
                <FontAwesomeIcon icon={faCircleCheck} /> Key saved: <span className="font-mono">••••••••{saved.slice(-4)}</span>
              </span>
              <button onClick={remove} aria-label="Remove key" className="rounded-lg px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50">
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          )}

          <p className="mb-2 mt-5 text-sm font-semibold text-gray-700">{saved ? 'Replace key' : 'Paste your key'}</p>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                type={show ? 'text' : 'password'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="AIza..."
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-3.5 pr-11 font-mono text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide key' : 'Show key'} className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-2 text-gray-400 hover:text-gray-700">
                <FontAwesomeIcon icon={show ? faEyeSlash : faEye} />
              </button>
            </div>
            <button
              onClick={save}
              disabled={busy || !input.trim()}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy && <FontAwesomeIcon icon={faSpinner} spin />} Verify & Save
            </button>
          </div>

          {msg && (
            <p className={`mt-3 flex items-start gap-2 text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>
              <FontAwesomeIcon icon={msg.ok ? faCircleCheck : faTriangleExclamation} className="mt-0.5" />
              <span className="min-w-0 break-words">{msg.text}</span>
            </p>
          )}

          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
            Get a free key from Google AI Studio <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs" />
          </a>

          <div className="mt-5 flex items-start gap-3 rounded-xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-500">
            <FontAwesomeIcon icon={faShieldHalved} className="mt-0.5 text-gray-400" />
            <p>Your key is stored only in this browser and is sent directly to Google. It is never sent to our servers. Remove it any time, and do not use this feature on a shared computer.</p>
          </div>
        </section>
      </main>
    </div>
  );
}