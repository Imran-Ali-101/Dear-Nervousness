import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse, faBullseye, faLanguage, faMicrophoneLines, faChartLine, faGear, faBars, faUser,
  faPlay, faArrowRight, faBrain, faGaugeHigh, faCommentDots, faClockRotateLeft, faFolderOpen,
  faTrophy, faSeedling, faKey, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import Dropdown from '../components/Dropdown';
import { LANGUAGES, TYPES, PERSONAS, LEVELS, LIMITS } from '../lib/practiceOptions';
import { hasGeminiKey } from '../lib/apiKey';
import { getSessions, getStreak, practicedToday } from '../lib/sessions';

const NAV = [
  { icon: faHouse, label: 'Overview', to: '/' },
  { icon: faBullseye, label: 'Practice', sub: 'Interactive step-by-step', to: '/warmup' },
  { icon: faLanguage, label: 'English/Bengali Learning', soon: true },
  { icon: faMicrophoneLines, label: 'Mock Interviews', to: '/warmup' },
  { icon: faChartLine, label: 'Past Progress & History', to: '/history' },
  { icon: faGear, label: 'Settings', sub: 'API key & account', to: '/settings' },
];

const TONES = {
  green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  purple: 'border-purple-100 bg-purple-50 text-purple-700',
  sky: 'border-sky-100 bg-sky-50 text-sky-700',
};

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.svg" alt="" className="h-8 w-8 object-contain" />
      <span className="text-lg font-bold text-gray-900">
        Dear <span className="text-blue-600">Nervousness</span>
      </span>
    </div>
  );
}

function Sidebar({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-5"><Logo /></div>
      <nav className="flex flex-col gap-1 px-3">
        {NAV.map((item, i) => (
          <button
            key={item.label}
            disabled={item.soon}
            onClick={() => onNavigate(item.to)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
              i === 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <FontAwesomeIcon icon={item.icon} fixedWidth className="text-base" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{item.label}</span>
              {item.sub && <span className="block truncate text-xs text-gray-400">{item.sub}</span>}
            </span>
            {item.soon && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Soon</span>}
          </button>
        ))}
      </nav>
      <div className="mt-auto p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-emerald-800">
          <FontAwesomeIcon icon={faSeedling} className="text-lg" />
          Small steps every day create big changes.
        </div>
      </div>
    </div>
  );
}

function Panel({ n, color, title, subtitle, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
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

function Stat({ icon, label, unit, tone }) {
  return (
    <div className={`flex flex-col items-center rounded-xl border p-3 text-center ${TONES[tone]}`}>
      <FontAwesomeIcon icon={icon} className="text-lg" />
      <p className="mt-1.5 text-[11px] font-medium text-gray-500">{label}</p>
      <p className="text-xl font-bold">— <span className="text-xs font-semibold">{unit}</span></p>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState('confidence');
  const [setup, setSetup] = useState({ language: 'bn', type: 'interview', persona: 'software', level: 'medium', minutes: 10 });
  // Real progress data (read once per visit)
  const [hasKey] = useState(hasGeminiKey);
  const [sessions] = useState(getSessions);
  const streak = getStreak(sessions);
  const today = practicedToday(sessions);

  const steps = [
    { title: 'Interview & Speaking', sub: hasKey ? 'Setup complete' : 'Add your API key', done: hasKey },
    { title: 'Speaking & Tracking', sub: sessions.length ? `${sessions.length} session${sessions.length > 1 ? 's' : ''} done` : 'Finish your first session', done: sessions.length >= 1 },
    { title: 'Analytics', sub: `${Math.min(sessions.length, 3)}/3 sessions to unlock`, done: sessions.length >= 3 },
  ];
  const currentStep = steps.findIndex((s) => !s.done);
  const fmtDur = (sec) => `${Math.floor(sec / 60)}m ${sec % 60}s`;

  const set = (key) => (value) => setSetup((s) => ({ ...s, [key]: value }));
  const go = (to) => { if (to) { navigate(to); setMenuOpen(false); } };
  const start = () => navigate('/warmup', { state: setup });

  return (
    <div className="min-h-[100dvh] bg-[#f6f8fc] text-[#1b1f24]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-gray-200 bg-white lg:block">
        <Sidebar onNavigate={go} />
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="anim-fade absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="anim-slide-left absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-xl">
            <Sidebar onNavigate={go} />
          </div>
        </div>
      )}

      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-lg text-gray-700 hover:bg-gray-100 lg:hidden">
              <FontAwesomeIcon icon={faBars} />
            </button>
            <div className="lg:hidden"><Logo /></div>
          </div>
          <div className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <FontAwesomeIcon icon={faUser} />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500 md:text-base">Better communication. Greater confidence. A brighter you.</p>

          {/* Stepper: reflects real progress */}
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
              <button onClick={() => go('/settings')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Open Settings</button>
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

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">Difficulty</p>
                  <Dropdown value={setup.level} options={LEVELS} onChange={set('level')} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">Time Limit</p>
                  <Dropdown value={setup.minutes} options={LIMITS} onChange={set('minutes')} />
                </div>
              </div>

              <button onClick={start} className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.99]">
                <FontAwesomeIcon icon={faPlay} className="text-sm" /> Start Practice <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
              </button>
            </Panel>

            {/* 2. Tracking */}
            <Panel n="2" color="bg-teal-500" title="Speaking & Tracking" subtitle="Track your improvement">
              <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm font-semibold">
                {[['confidence', 'Confidence Score'], ['filler', 'Filler Words']].map(([k, l]) => (
                  <button key={k} onClick={() => setTab(k)} className={`rounded-lg py-2 transition ${tab === k ? 'bg-blue-600 text-white shadow' : 'text-gray-500'}`}>{l}</button>
                ))}
              </div>
              <div className="mt-4">
                <EmptyState
                  icon={faChartLine}
                  text={`${tab === 'confidence' ? 'Your confidence trend' : 'Your filler word trend'} will appear after your first session.`}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 md:gap-3">
                <Stat icon={faBrain} label="Confidence" unit="%" tone="green" />
                <Stat icon={faGaugeHigh} label="Pacing" unit="WPM" tone="purple" />
                <Stat icon={faCommentDots} label="Fillers" unit="/min" tone="sky" />
              </div>
            </Panel>

              
            <Panel n="3" color="bg-purple-600" title="Analytics & Comparison" subtitle="Progress and growth">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <FontAwesomeIcon icon={faClockRotateLeft} className="text-gray-500" /> Past Sessions
                </h3>
                <button onClick={() => go('/history')} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline">
                  View All <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                </button>
              </div>

              <div className="mt-3">
                {sessions.length === 0 ? (
                  <EmptyState icon={faFolderOpen} text="No sessions yet. Finish a practice to see it here." />
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                    {sessions.slice(0, 5).map((s) => (
                      <li key={s.startedAt} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-800">{TYPES.find((t) => t.value === s.type)?.title || 'Practice'}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(s.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {s.language === 'bn' ? 'Bengali' : 'English'}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{fmtDur(s.durationSec)}</span>
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
      </div>
    </div>
  );
}