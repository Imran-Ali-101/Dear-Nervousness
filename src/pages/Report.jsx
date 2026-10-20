import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useSessions } from '../lib/sessions';
import { TYPES } from '../lib/practiceOptions';

const WAIT_MS = 90000; // after this we stop saying "preparing"

const tone = (v) => (v == null ? 'text-gray-400' : v >= 75 ? 'text-emerald-600' : v >= 50 ? 'text-amber-600' : 'text-red-600');
const paceHint = (w) => (w == null ? '' : w < 110 ? 'A bit slow' : w > 170 ? 'A bit fast' : 'Good pace');
const fillerHint = (f) => (f == null ? '' : f <= 2 ? 'Very clean' : f <= 5 ? 'Okay' : 'Try to cut down');
const fmtDur = (d = 0) => `${Math.floor(d / 60)}m ${d % 60}s`;

function Score({ label, value }) {
  return (
    <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm">
      <p className={`text-3xl font-extrabold ${tone(value)}`}>
        {value ?? '—'}{value != null && <span className="text-base">%</span>}
      </p>
      <p className="mt-1 text-xs font-semibold text-gray-500">{label}</p>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function Report() {
  const { startedAt } = useParams();
  const navigate = useNavigate();
  const sessions = useSessions();
  const s = sessions.find((x) => x.startedAt === Number(startedAt));
  const a = s?.analysis;
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (a) return;
    const id = setTimeout(() => setTimedOut(true), WAIT_MS);
    return () => clearTimeout(id);
  }, [a]);

  const header = (
    <header className="border-b border-gray-200 bg-white px-3 py-3 md:px-6">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <button onClick={() => navigate('/dashboard')} aria-label="Back" className="rounded-lg px-2.5 py-2 text-gray-700 hover:bg-gray-100">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Session Report</h1>
      </div>
    </header>
  );

  const body = (() => {
    if (!s) return <p className="py-16 text-center text-sm text-gray-500">This report was not found.</p>;
    if (!a) {
      return timedOut ? (
        <p className="py-16 text-center text-sm text-gray-500">The report could not be prepared for this session.</p>
      ) : (
        <div className="flex flex-col items-center gap-3 py-20 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-blue-600" />
          <p className="text-sm">Preparing your report…</p>
        </div>
      );
    }

    const type = TYPES.find((t) => t.value === s.type)?.title || 'Practice';
    const focus = a.tips?.[0];

    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-lg font-bold text-gray-900">{type} · {s.language === 'bn' ? 'Bengali' : 'English'}</p>
          <p className="text-xs text-gray-400">
            {new Date(s.startedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {fmtDur(s.durationSec)}
          </p>
        </div>

        <div className="flex gap-3">
          <Score label="Confidence" value={a.confidence} />
          <Score label="Clarity" value={a.clarity} />
          <Score label="Grammar" value={a.grammar} />
        </div>

        {a.confidence == null && !a.summary && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">AI scoring was not available for this session, but your speaking numbers are below.</p>
        )}

        {focus && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Focus for next time</p>
            <p className="mt-1 text-sm font-semibold text-blue-900">{focus}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Speaking pace" value={a.wpm != null ? `${a.wpm} WPM` : null} hint={paceHint(a.wpm)} />
          <Stat label="Filler words" value={a.fillerCount} hint={a.fillersPerMin != null ? `${a.fillersPerMin}/min · ${fillerHint(a.fillersPerMin)}` : ''} />
          {a.pausesPerMin != null && (
            <Stat label="Pauses" value={`${a.shortPauses} natural`} hint={`${a.longPauses} long · ${a.pausePercent}% of speaking time`} />
          )}
          <Stat label="Words spoken" value={a.words} />
        </div>

        {a.summary && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm leading-relaxed text-gray-700 shadow-sm">{a.summary}</div>
        )}

        {a.tips?.length > 1 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-gray-900">More tips</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {a.tips.slice(1).map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}

        {a.improvements?.length > 0 && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm">
            <p className="font-bold text-amber-900">Say it better</p>
            <ul className="mt-2 space-y-3">
              {a.improvements.map((x, i) => (
                <li key={i}>
                  <p className="text-gray-500 line-through">{x.original}</p>
                  <p className="font-semibold text-emerald-700">{x.better}</p>
                  {x.why && <p className="text-xs text-amber-800/80">{x.why}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {a.vocab?.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
            <p className="font-bold text-gray-900">Stronger words</p>
            <ul className="mt-2 space-y-1">
              {a.vocab.map((v, i) => (
                <li key={i}><span className="text-gray-500 line-through">{v.weak}</span> → <span className="font-semibold text-emerald-700">{v.better.join(', ')}</span></li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate('/history')} className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">View conversation</button>
          <button onClick={() => navigate('/dashboard')} className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700">Practice again</button>
        </div>
      </div>
    );
  })();

  return (
    <div className="min-h-[100dvh] bg-[#f6f8fc] text-[#1b1f24]">
      {header}
      <main className="mx-auto max-w-3xl px-3 py-6 md:px-6 md:py-8">{body}</main>
    </div>
  );
}