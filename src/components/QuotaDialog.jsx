import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faArrowUpRightFromSquare, faGear } from '@fortawesome/free-solid-svg-icons';

const SNOOZE_MS = 60000;   // after closing, do not show it again for a minute

const TEXT = {
  daily: {
    title: 'Gemini API quota finished',
    body: 'The free quota of your Gemini API key has run out. Create a new free API key with another Gmail account in Google AI Studio, then paste it in Settings. The quota also resets by itself after a day.',
  },
  rate: {
    title: 'Too many requests',
    body: 'Your Gemini API key is receiving too many requests right now. Wait a minute and try again, or use a key from another Gmail account.',
  },
};

export default function QuotaDialog() {
  const navigate = useNavigate();
  const [kind, setKind] = useState(null);
  const closedAt = useRef(0);

  useEffect(() => {
    const onQuota = (e) => {
      if (Date.now() - closedAt.current < SNOOZE_MS) return;
      setKind(e.detail?.kind === 'rate' ? 'rate' : 'daily');
    };
    window.addEventListener('dn:quota', onQuota);
    return () => window.removeEventListener('dn:quota', onQuota);
  }, []);

  if (!kind) return null;

  const close = () => { closedAt.current = Date.now(); setKind(null); };
  const t = TEXT[kind];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </span>
          <h2 className="font-bold text-gray-900">{t.title}</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">{t.body}</p>

        <div className="mt-5 flex flex-col gap-2">
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
            Get a free API key <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs" />
          </a>
          <button onClick={() => { close(); navigate('/settings'); }}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <FontAwesomeIcon icon={faGear} className="text-xs" /> Open Settings
          </button>
          <button onClick={close} className="rounded-xl py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
}