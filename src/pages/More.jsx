import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGear, faLanguage, faMicrophoneLines, faToolbox, faBook, faShieldHalved,
  faFileContract, faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

const SERVICES = [
  { icon: faMicrophoneLines, label: 'Mock Interviews', sub: 'Practice with an AI interviewer', to: '/warmup' },
  { icon: faLanguage, label: 'English/Bengali Learning', sub: 'Coming soon', to: '/info/learning' },
  { icon: faGear, label: 'Settings', sub: 'API key, prompts', to: '/settings' },
];
const LEGAL = [
  { icon: faBook, label: 'User Manual', to: '/info/manual' },
  { icon: faShieldHalved, label: 'Privacy Policy', to: '/info/privacy' },
  { icon: faFileContract, label: 'Terms & Conditions', to: '/info/terms' },
];

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
    </main>
  );
}