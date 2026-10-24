import { useEffect, useState } from 'react';
import { fetchSiteStats } from '../lib/visits';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGear, faLanguage, faMicrophoneLines, faToolbox, faBook, faShieldHalved,
  faFileContract, faChevronRight, faCircleInfo, faCircleQuestion, faCompass,
} from '@fortawesome/free-solid-svg-icons';

const SERVICES = [
  { icon: faMicrophoneLines, label: 'Mock Interviews', sub: 'Practice with an AI interviewer', to: '/warmup' },
  { icon: faLanguage, label: 'English/Bengali Learning', sub: 'English Grammar', to: '/info/learning' },
  { icon: faGear, label: 'Settings', sub: 'API key, prompts', to: '/settings' },
];
const LEGAL = [
  { icon: faCompass, label: 'App Guide', sub: 'A quick tour of every page', to: '/onboarding' },
  { icon: faBook, label: 'User Manual', to: '/info/manual' },
  { icon: faCircleQuestion, label: 'Help & Support', to: '/info/help' },
  { icon: faShieldHalved, label: 'Privacy Policy', to: '/info/privacy' },
  { icon: faFileContract, label: 'Terms & Conditions', to: '/info/terms' },
  { icon: faCircleInfo, label: 'About App', to: '/info/about' },
];

const STATS = [
  ['Unique Visitors Today', 'unique_today'],
  ['Total Visits Today', 'visits_today'],
  ['Visits, Last 30 Days', 'visits_30d'],
  ['Registered Users', 'users'],
];

function SiteStats() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let on = true;
    fetchSiteStats().then((d) => on && setData(d)).catch(() => on && setFailed(true));
    return () => { on = false; };
  }, []);
  if (failed) return null;
  return (
    <>
      <Title>Platform Statistics</Title>
      <div className="grid grid-cols-2 gap-3">
        {STATS.map(([label, key]) => (
          <div key={key} className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{data ? Number(data[key] ?? 0).toLocaleString() : '—'}</p>
            <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function Row({ item, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-gray-50">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <FontAwesomeIcon icon={item.icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-gray-900">{item.label}</span>
        {item.sub && <span className="block truncate text-xs text-gray-500">{item.sub}</span>}
      </span>
      <FontAwesomeIcon icon={faChevronRight} className="text-xs text-gray-300" />
    </button>
  );
}

const Title = ({ children }) => <h2 className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</h2>;
const Card = ({ children }) => <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">{children}</div>;

export default function More() {
  const navigate = useNavigate();
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">More</h1>

      <Title>Services</Title>
      <Card>{SERVICES.map((i) => <Row key={i.label} item={i} onClick={() => navigate(i.to)} />)}</Card>

      <Title>Tools</Title>
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-gray-400">
        <FontAwesomeIcon icon={faToolbox} className="text-3xl" />
        <p className="mt-3 text-sm">More tools will be added here soon.</p>
      </div>

      <Title>Help & Legal</Title>
      <Card>{LEGAL.map((i) => <Row key={i.label} item={i} onClick={() => navigate(i.to)} />)}</Card>
      <SiteStats />
    </main>
  );
}