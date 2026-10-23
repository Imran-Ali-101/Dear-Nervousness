import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNewspaper, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useNewsPrefs, COUNTRIES, SOURCES, NEWS_TOPICS } from '../lib/news';

const chip = (on) =>
  `rounded-full border px-3 py-1.5 text-sm font-semibold transition ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`;

export default function NewsSettings() {
  const [prefs, update] = useNewsPrefs();
  const [text, setText] = useState('');

  const toggle = (key, v) =>
    update({ [key]: prefs[key].includes(v) ? prefs[key].filter((x) => x !== v) : [...prefs[key], v] });

  const addCustom = () => {
    const t = text.trim().slice(0, 40);
    if (!t || prefs.custom.length >= 10 || prefs.custom.some((c) => c.toLowerCase() === t.toLowerCase())) return;
    update({ custom: [...prefs.custom, t] });
    setText('');
  };

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <FontAwesomeIcon icon={faNewspaper} />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold text-gray-900">Daily News</h2>
          <p className="text-xs text-gray-500">Choose your country, sources and favourite topics</p>
        </div>
      </div>

      <p className="mb-2 mt-5 text-sm font-semibold text-gray-700">Country</p>
      <select
        value={prefs.country}
        onChange={(e) => update({ country: e.target.value })}
        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        {COUNTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>

      <p className="mb-2 mt-5 text-sm font-semibold text-gray-700">Sources</p>
      <div className="flex flex-wrap gap-2">
        {SOURCES.map(([v, l]) => (
          <button key={v} onClick={() => toggle('sources', v)} className={chip(prefs.sources.includes(v))}>{l}</button>
        ))}
      </div>

      <p className="mb-2 mt-5 text-sm font-semibold text-gray-700">Favourite topics</p>
      <div className="flex flex-wrap gap-2">
        {NEWS_TOPICS.map(([v, l]) => (
          <button key={v} onClick={() => toggle('topics', v)} className={chip(prefs.topics.includes(v))}>{l}</button>
        ))}
      </div>

      <p className="mb-2 mt-5 text-sm font-semibold text-gray-700">Custom topics</p>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          maxLength={40}
          placeholder="e.g. Cricket, Space, Crypto"
          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button onClick={addCustom} aria-label="Add topic" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
      {prefs.custom.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {prefs.custom.map((c) => (
            <span key={c} className="flex items-center gap-2 rounded-full bg-blue-50 py-1.5 pl-3 pr-2 text-sm font-semibold text-blue-700">
              {c}
              <button onClick={() => update({ custom: prefs.custom.filter((x) => x !== c) })} aria-label={`Remove ${c}`}>
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}