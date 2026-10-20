import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Avatar from './Avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse, faBullseye, faLanguage, faClockRotateLeft, faEllipsis, faSeedling,
  faGear, faCircleQuestion, faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';

const TABS = [
  { to: '/dashboard', label: 'Home', icon: faHouse, end: true },
  { to: '/warmup', label: 'Practice', icon: faBullseye },
  { to: '/info/learning', label: 'Learning', icon: faLanguage },
  { to: '/history', label: 'History', icon: faClockRotateLeft },
  { to: '/more', label: 'More', icon: faEllipsis },
];

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

function ProfileMenu() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const items = [
    { icon: faGear, label: 'Settings', run: () => navigate('/settings') },
    { icon: faCircleQuestion, label: 'Help', run: () => navigate('/info/help') },
    { icon: faRightFromBracket, label: 'Logout', run: async () => { await signOut(); navigate('/', { replace: true }); }, danger: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile menu"
        aria-expanded={open}
        className="rounded-full transition hover:opacity-80"
      >
        <Avatar user={user} size={36} />
      </button>

      {open && (
        <div className="anim-pop absolute right-0 top-full mt-2 w-48 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => { setOpen(false); it.run(); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                it.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={it.icon} fixedWidth /> {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppShell() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-[100dvh] bg-[#f6f8fc] text-[#1b1f24]">
      {/* PC: vertical tabs on the left */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="p-5"><Logo /></div>
        <nav className="flex flex-col gap-1 px-3">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <FontAwesomeIcon icon={t.icon} fixedWidth className="text-base" /> {t.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-emerald-800">
            <FontAwesomeIcon icon={faSeedling} className="text-lg" />
            Small steps every day create big changes.
          </div>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="lg:hidden"><Logo /></div>
          <div className="ml-auto"><ProfileMenu /></div>
        </header>

        {/* Page content; the key replays the enter animation on each tab change */}
        <div key={pathname} className="anim-page pb-24 lg:pb-0">
          <Outlet />
        </div>
      </div>

      {/* Mobile: tabs at the bottom */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="mx-auto flex max-w-xl">
          {TABS.map((t) => (
            <li key={t.to} className="flex-1">
              <NavLink
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  }`
                }
              >
                <FontAwesomeIcon icon={t.icon} className="text-lg" /> {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}