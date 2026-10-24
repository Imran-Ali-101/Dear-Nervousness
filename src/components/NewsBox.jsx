import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNewspaper, faArrowUpRightFromSquare, faPhone, faCircleCheck, faGear, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { useSessions } from '../lib/sessions';
import { useNewsPrefs, fetchNews, newsConfig } from '../lib/news';
import { hasGeminiKey } from '../lib/apiKey';

export default function NewsBox() {
  const navigate = useNavigate();
  const [prefs] = useNewsPrefs();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  const done = new Set(useSessions().map((s) => s.news?.id).filter(Boolean));
  const key = JSON.stringify([prefs.country, prefs.sources, prefs.topics, prefs.custom]);

  useEffect(() => {
    const ctrl = new AbortController();
    setItems(null);
    setError(false);
    fetchNews(prefs, ctrl.signal)
      .then(setItems)
      .catch((e) => { if (e.name !== 'AbortError') setError(true); });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  const start = (item) => {
    if (!hasGeminiKey()) { navigate('/settings'); return; }
    navigate('/practice', { state: newsConfig(item) });
  };

  return (
    <section className="mt-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <FontAwesomeIcon icon={faNewspaper} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold text-gray-900">Daily News Special</h2>
          <p className="truncate text-xs text-gray-500">Read a story, then debate it with the AI</p>
        </div>
        <button onClick={() => navigate('/settings')} aria-label="News settings" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <FontAwesomeIcon icon={faGear} />
        </button>
      </div>

      {items === null && !error && (
        <ul className="divide-y divide-gray-100">
          {[0, 1, 2].map((i) => (
            <li key={i} className="p-3"><div className="h-3 w-24 animate-pulse rounded bg-gray-100" /><div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-100" /></li>
          ))}
        </ul>
      )}

      {error && (
        <div className="p-4 text-center text-sm text-gray-500">
          Could not load the news.{' '}
          <button onClick={() => setTick((t) => t + 1)} className="font-semibold text-blue-600">
            <FontAwesomeIcon icon={faRotateRight} className="mr-1" />Retry
          </button>
        </div>
      )}

      {items && items.length === 0 && (
        <p className="p-4 text-center text-sm text-gray-500">No news found. Try other sources or topics in Settings.</p>
      )}

      {items && items.length > 0 && (
        <ul className="max-h-[22rem] divide-y divide-gray-100 overflow-y-auto">
          {items.map((n) => (
            <li key={n.id} className="flex items-start gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                  {n.source}{n.topic ? ` · ${n.topic}` : ''}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-gray-900">{n.title}</p>
                <div className="mt-1 flex items-center gap-3">
                      <a href={n.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600">
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[10px]" /> Read
                      </a>
                      {done.has(n.id) && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <FontAwesomeIcon icon={faCircleCheck} className="text-[10px]" /> Completed
                        </span>
                      )}
                </div>
              </div>
              <button
                onClick={() => start(n)}
                aria-label="Discuss this news with AI"
                title="Discuss with AI"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/25 hover:bg-blue-700"
              >
                <FontAwesomeIcon icon={faPhone} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}