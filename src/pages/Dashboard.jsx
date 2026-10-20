import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faArrowRight, faBrain, faGaugeHigh, faCommentDots, faClockRotateLeft, faFolderOpen,
  faTrophy, faKey, faCheck, faChartLine, faChartColumn,
} from '@fortawesome/free-solid-svg-icons';
import Dropdown from '../components/Dropdown';
import { useAuth } from '../hooks/useAuth';
import { getDisplayName } from '../lib/profile';
import { TrendChart, PerformanceChart } from '../components/Charts';
import { LANGUAGES, TYPES, PERSONAS, LEVELS, LIMITS } from '../lib/practiceOptions';
import { hasGeminiKey } from '../lib/apiKey';
import { getStreak, practicedToday, useSessions } from '../lib/sessions';
import { buildStats } from '../lib/stats';
import { getDefaultLang } from '../lib/prefs';

const TONES = {
  green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  purple: 'border-purple-100 bg-purple-50 text-purple-700',
  sky: 'border-sky-100 bg-sky-50 text-sky-700',
};
const RANGES = [{ value: 7, label: 'Last 7 Days' }, { value: 30, label: 'Last 30 Days' }];
const TEXTAREA = 'mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';

function Panel({ n, color, title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-white ${color}`}>{n}</span>
        <div className="min-w-0">
          <h2 className="truncate font-bold text-gray-900">{title}</h2>
          <p className="truncate text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function Stat({ icon, label, value, unit, tone }) {
  return (
    <div className={`flex flex-col items-center rounded-xl border p-3 text-center ${TONES[tone]}`}>
      <FontAwesomeIcon icon={icon} className="text-lg" />
      <p className="mt-1.5 text-[11px] font-medium text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value ?? '—'} <span className="text-xs font-semibold">{unit}</span></p>
    </div>
  );
}

function Label({ children }) {
  return <p className="mb-2 mt-5 text-sm font-semibold text-gray-700">{children}</p>;
}

function EmptyState({ icon, text }) {
  return (
    <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center text-gray-400">
      <FontAwesomeIcon icon={icon} className="text-3xl" />
      <p className="mt-3 text-sm">{text}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = getDisplayName(user).split(' ')[0];
  // Wake the TTS server early so the first AI voice is not slow
  useEffect(() => { fetch(`${import.meta.env.VITE_TTS_URL || ''}/api/health`).catch(() => {}); }, []);
  const [tab, setTab] = useState('confidence');
  const [setup, setSetup] = useState({ language: getDefaultLang(), type: 'interview', persona: 'software', level: 'medium', minutes: 10, customMinutes: 20, customPersona: '', customPrompt: '' });
  const [hasKey] = useState(hasGeminiKey);
  const sessions = useSessions();
  const streak = getStreak(sessions);
  const today = practicedToday(sessions);

  // Statistics language + range: everything below follows these two dropdowns
  const [statLang, setStatLang] = useState(() => sessions[0]?.language || 'bn');
  const [range, setRange] = useState(7);
  const stats = useMemo(() => buildStats(sessions, statLang, range), [sessions, statLang, range]);
  const langName = statLang === 'bn' ? 'Bengali' : 'English';

  const steps = [
    { title: 'Interview & Speaking', sub: hasKey ? 'Setup complete' : 'Add your API key', done: hasKey },
    { title: 'Speaking & Tracking', sub: sessions.length ? `${sessions.length} session${sessions.length > 1 ? 's' : ''} done` : 'Finish your first session', done: sessions.length >= 1 },
    { title: 'Analytics', sub: `${Math.min(sessions.length, 3)}/3 sessions to unlock`, done: sessions.length >= 3 },
  ];
  const currentStep = steps.findIndex((s) => !s.done);
  const fmtDur = (sec) => `${Math.floor(sec / 60)}m ${sec % 60}s`;

  const set = (key) => (value) => setSetup((s) => ({ ...s, [key]: value }));
  const start = () => {
      // Custom time: keep it between 1 and 180 minutes
      const custom = Math.min(Math.max(parseInt(setup.customMinutes, 10) || 1, 1), 180);
      const minutes = setup.minutes === 'custom' ? custom : setup.minutes;
      navigate('/warmup', { state: { ...setup, minutes } });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Welcome back {firstName ? `, ${firstName}` : ''}</h1>
      <p className="mt-1 text-sm text-gray-500 md:text-base">Better communication. Greater confidence. A brighter you.</p>

      {/* Stepper */}
      <div className="mt-6 flex items-center rounded-2xl border border-gray-100 bg-white p-3 shadow-sm md:p-5">
        {steps.map((s, i) => {
          const st = s.done ? 'done' : i === currentStep ? 'current' : 'todo';
          return (
            <div key={s.title} className="flex flex-1 items-center gap-2 last:flex-none md:gap-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold md:h-10 md:w-10 ${
                st === 'done' ? 'bg-emerald-500 text-white' : st === 'current' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {st === 'done' ? <FontAwesomeIcon icon={faCheck} /> : i + 1}
              </span>
              <div className="hidden min-w-0 sm:block">
                <p className={`truncate text-sm font-bold ${st === 'done' ? 'text-emerald-700' : st === 'current' ? 'text-blue-700' : 'text-gray-500'}`}>{s.title}</p>
                <p className="truncate text-xs text-gray-400">{s.sub}</p>
              </div>
              {i < steps.length - 1 && <div className={`mx-2 h-px flex-1 md:mx-4 ${s.done ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
            </div>
          );
        })}
      </div>

      {!hasKey && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center">
          <FontAwesomeIcon icon={faKey} className="text-xl text-blue-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-blue-900">Add your Gemini API key to start practicing</p>
            <p className="text-xs text-blue-800/80">Each user uses their own free key. It stays on this device.</p>
          </div>
          <button onClick={() => navigate('/settings')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Open Settings</button>
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        {/* 1. Setup */}
        <Panel n="1" color="bg-blue-600" title="Interview & Speaking" subtitle="Choose language, type and settings">
          <p className="mb-2 text-sm font-semibold text-gray-700">Language</p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((l) => (
              <button key={l.value} onClick={() => set('language')(l.value)}
                className={`rounded-xl border py-2.5 text-sm font-semibold transition ${setup.language === l.value ? 'border-blue-600 bg-blue-600 text-white shadow' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                {l.label}
              </button>
            ))}
          </div>

          <Label>Practice Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button key={t.value} onClick={() => set('type')(t.value)}
                className={`rounded-xl border-2 p-3 text-center transition ${setup.type === t.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
                <FontAwesomeIcon icon={t.icon} className={`text-xl ${setup.type === t.value ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="mt-2 block text-sm font-bold text-gray-900">{t.title}</span>
                <span className="block text-[11px] text-gray-500">{t.hint}</span>
              </button>
            ))}
          </div>

          <Label>AI Persona / Topic</Label>
          <Dropdown value={setup.persona} options={PERSONAS} onChange={set('persona')} />
          {setup.persona === 'custom' && (
            <textarea rows={2} value={setup.customPersona} onChange={(e) => set('customPersona')(e.target.value)}
              placeholder="Who should the AI be? e.g. A bank manager interviewing me for a teller job" className={TEXTAREA} />
          )}

          <Label>Custom Prompt (optional)</Label>
          <textarea rows={2} value={setup.customPrompt} onChange={(e) => set('customPrompt')(e.target.value)}
            placeholder="Extra instructions for this session" className={`${TEXTAREA} !mt-0`} />

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Difficulty</p>
              <Dropdown value={setup.level} options={LEVELS} onChange={set('level')} />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Time Limit</p>
              <Dropdown value={setup.minutes} options={LIMITS} onChange={set('minutes')} />
              {setup.minutes === 'custom' && (
                <input type="number" inputMode="numeric" min="1" max="180" value={setup.customMinutes}
                  onChange={(e) => set('customMinutes')(e.target.value)} placeholder="Minutes (1-180)"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              )}
            </div>
          </div>

          <button onClick={start} className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.99]">
            <FontAwesomeIcon icon={faPlay} className="text-sm" /> Start Practice <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
          </button>
        </Panel>

        {/* 2. Tracking (follows the statistics language) */}
        <Panel n="2" color="bg-teal-500" title="Speaking & Tracking" subtitle={`Your ${langName} progress`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-gray-700">Statistics for</span>
            <Dropdown value={statLang} options={LANGUAGES} onChange={setStatLang} className="w-44" />
          </div>

          <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm font-semibold">
            {[['confidence', 'Confidence Score'], ['filler', 'Filler Words']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`rounded-lg py-2 transition ${tab === k ? 'bg-blue-600 text-white shadow' : 'text-gray-500'}`}>{l}</button>
            ))}
          </div>

          <div className="mt-4">
            {stats.summary.count === 0 ? (
              <EmptyState icon={faChartLine} text={`No ${langName} sessions with analysis yet. Finish a ${langName} practice to see your trend.`} />
            ) : tab === 'confidence' ? (
              <TrendChart labels={stats.labels} data={stats.confidence} label="Confidence" color="#2563eb" max={100} />
            ) : (
              <TrendChart labels={stats.labels} data={stats.fillers} label="Fillers per minute" color="#0284c7" />
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 md:gap-3">
            <Stat icon={faBrain} label="Confidence" value={stats.summary.confidence} unit="%" tone="green" />
            <Stat icon={faGaugeHigh} label="Pacing" value={stats.summary.wpm} unit="WPM" tone="purple" />
            <Stat icon={faCommentDots} label="Fillers" value={stats.summary.fillers} unit="/min" tone="sky" />
          </div>
        </Panel>

        {/* 3. Analytics */}
        <Panel n="3" color="bg-purple-600" title="Analytics & Comparison" subtitle={`${langName} progress and growth`}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <FontAwesomeIcon icon={faChartColumn} className="text-blue-600" /> Daily Performance
            </h3>
            <Dropdown value={range} options={RANGES} onChange={setRange} className="w-40" />
          </div>

          <div className="mt-3">
            {stats.summary.count === 0 ? (
              <EmptyState icon={faChartColumn} text={`Your ${langName} performance chart will appear after a session.`} />
            ) : (
              <PerformanceChart labels={stats.labels} confidence={stats.confidence} wpm={stats.wpm} />
            )}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <FontAwesomeIcon icon={faClockRotateLeft} className="text-gray-500" /> Past Sessions
            </h3>
            <button onClick={() => navigate('/history')} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline">
              View All <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
            </button>
          </div>

          <div className="mt-3">
            {stats.past.length === 0 ? (
              <EmptyState icon={faFolderOpen} text={`No ${langName} sessions yet.`} />
            ) : (
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                {stats.past.map((s) => (
                  <li key={s.startedAt} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">{TYPES.find((t) => t.value === s.type)?.title || 'Practice'}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(s.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {fmtDur(s.durationSec)}
                      </p>
                    </div>
                    {s.analysis?.confidence != null && (
                      <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{s.analysis.confidence}%</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {today ? (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <FontAwesomeIcon icon={faTrophy} className="text-2xl text-emerald-500" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-emerald-900">You practiced today</p>
                <p className="text-xs text-emerald-800/80">Current streak: {streak} day{streak > 1 ? 's' : ''}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 sm:flex-row sm:items-center">
              <FontAwesomeIcon icon={faTrophy} className="text-2xl text-amber-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-amber-900">You haven't practiced today</p>
                <p className="text-xs text-amber-800/80">{streak > 0 ? `Keep your ${streak}-day streak alive.` : 'Start a session now to begin your streak.'}</p>
              </div>
              <button onClick={start} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600">Practice Now</button>
            </div>
          )}
        </Panel>
      </div>
    </main>
  );
}