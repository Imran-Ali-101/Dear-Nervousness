import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faKey, faEye, faEyeSlash, faCircleCheck, faTriangleExclamation, faTrash,
  faShieldHalved, faArrowUpRightFromSquare, faSpinner, faUser, faBell, faMoon, faGlobe,
  faCircleQuestion, faCircleInfo, faWandMagicSparkles, faChevronRight, faRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
import { getGeminiKey, setGeminiKey, clearGeminiKey } from '../lib/apiKey';
import { getGeneralPrompt, setGeneralPrompt, DEFAULT_GENERAL_PROMPT } from '../lib/prompts';
import { getTheme, setTheme, getDefaultLang, setDefaultLang } from '../lib/prefs';
import { useAuth } from '../hooks/useAuth';
import { requestDeletion, cancelDeletion, getDeletionDate, DELETE_AFTER_DAYS } from '../lib/deletion';
import NewsSettings from '../components/NewsSettings';

// Cheap request that fails if the key is invalid
async function verifyKey(key) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${encodeURIComponent(key)}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
}

function Block({ icon, title, sub, children }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <FontAwesomeIcon icon={icon} />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Row({ icon, title, sub, onClick, soon, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={soon}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
        danger ? 'border-red-100 bg-red-50 hover:bg-red-100' : 'border-gray-100 bg-white hover:bg-gray-50'
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${danger ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
        <FontAwesomeIcon icon={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-semibold ${danger ? 'text-red-600' : 'text-gray-900'}`}>{title}</span>
        {sub && <span className={`block truncate text-xs ${danger ? 'text-red-400' : 'text-gray-500'}`}>{sub}</span>}
      </span>
      {soon
        ? <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Soon</span>
        : <FontAwesomeIcon icon={faChevronRight} className="text-xs text-gray-300" />}
    </button>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="mt-4 grid rounded-xl bg-gray-100 p-1 text-sm font-semibold" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)} className={`rounded-lg py-2 transition ${value === v ? 'bg-blue-600 text-white shadow' : 'text-gray-500'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();

  // Gemini key
  const [saved, setSaved] = useState(getGeminiKey());
  const [input, setInput] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  // General prompt, theme, default language
  const [prompt, setPrompt] = useState(getGeneralPrompt);
  const [promptMsg, setPromptMsg] = useState('');
  const [theme, setThemeState] = useState(getTheme);
  const [lang, setLang] = useState(getDefaultLang);

    // Account deletion (saved on the server, removed by a daily job)
  const { user } = useAuth();
  const deleteOn = getDeletionDate(user);
  const [confirmDel, setConfirmDel] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [delMsg, setDelMsg] = useState('');

  const runDeletion = async (action, done) => {
    setDelBusy(true);
    setDelMsg('');
    const { error } = await action();
    setDelBusy(false);
    setConfirmDel(false);
    setDelMsg(error ? `Something went wrong: ${error.message}` : done);
  };

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

  const savePrompt = () => {
    setGeneralPrompt(prompt);
    setPromptMsg('General prompt saved.');
    setTimeout(() => setPromptMsg(''), 2500);
  };

  const resetPrompt = () => {
    setGeneralPrompt('');
    setPrompt(DEFAULT_GENERAL_PROMPT);
    setPromptMsg('Reset to the default prompt.');
    setTimeout(() => setPromptMsg(''), 2500);
  };

  return (
    <div className="min-h-[100dvh] bg-[#f6f8fc] text-[#1b1f24]">
      <header className="border-b border-gray-200 bg-white px-3 py-3 md:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back" className="rounded-lg px-2.5 py-2 text-gray-700 hover:bg-gray-100">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Settings</h1>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-3 px-3 py-6 md:px-6 md:py-8">
        <Row icon={faUser} title="Account Settings" sub="Manage your profile and preferences" onClick={() => navigate('/settings/account')} />

        {/* Gemini API key */}
        <Block icon={faKey} title="Gemini API Key" sub="Required to practice. Each user uses their own key.">
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
        </Block>

        {/* General prompt */}
        <Block icon={faWandMagicSparkles} title="General Prompt" sub="Base instructions for every practice session">
          <textarea
            rows={8}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            spellCheck={false}
            className="mt-4 w-full resize-y rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm leading-relaxed focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-2 text-xs text-gray-500">
            The persona, difficulty and custom prompt are added after this text. Keep "plain text, no markdown" in it, because the reply is read aloud.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button onClick={savePrompt} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700">Save</button>
            <button onClick={resetPrompt} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Reset to default</button>
            {promptMsg && <span className="text-xs font-semibold text-emerald-700">{promptMsg}</span>}
          </div>
        </Block>

        <Row icon={faBell} title="Notifications" sub="Control your notifications" soon />

        <Block icon={faMoon} title="Appearance" sub="Light / Dark mode">
          <Segmented
            value={theme}
            options={[['light', 'Light'], ['dark', 'Dark'], ['system', 'System']]}
            onChange={(v) => { setThemeState(v); setTheme(v); }}
          />
        </Block>

        <Block icon={faGlobe} title="Language" sub="Default practice language">
          <Segmented
            value={lang}
            options={[['bn', 'Bengali'], ['en', 'English']]}
            onChange={(v) => { setLang(v); setDefaultLang(v); }}
          />
        </Block>

        <NewsSettings />

        <Row icon={faCircleQuestion} title="Help & Support" onClick={() => navigate('/info/help')} />
        <Row icon={faCircleInfo} title="About App" onClick={() => navigate('/info/about')} />

        {/* Always the last item */}
        {deleteOn ? (
          <Row icon={faRotateLeft} title="Cancel account deletion" sub={`Scheduled for ${deleteOn.toLocaleDateString()}`} danger onClick={() => runDeletion(cancelDeletion, 'Account deletion cancelled.')} />
        ) : (
          <Row icon={faTriangleExclamation} title="Request Account Deletion" sub={`Permanently deletes in ${DELETE_AFTER_DAYS} days`} danger onClick={() => setConfirmDel(true)} />
        )}
          
        {delMsg && <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">{delMsg}</p>}
      </main>

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setConfirmDel(false)}>
          <div className="anim-pop w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900">Request account deletion?</h3>
            <p className="mt-2 text-sm text-gray-600">Your account and all its data will be permanently deleted in {DELETE_AFTER_DAYS} days. You can cancel any time before that.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmDel(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => runDeletion(requestDeletion, `Your account will be deleted in ${DELETE_AFTER_DAYS} days. You can cancel from here before then.`)}
                disabled={delBusy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
                    {delBusy && <FontAwesomeIcon icon={faSpinner} spin />} Request deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}