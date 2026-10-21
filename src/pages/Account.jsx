import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSpinner, faCircleCheck, faTriangleExclamation, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/Avatar';
import { getDisplayName } from '../lib/profile';

const PROVIDER_INFO = {
  google: { label: 'Google', icon: faGoogle },
  github: { label: 'GitHub', icon: faGithub },
};
const INPUT = 'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500';

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
      <h2 className="font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function Msg({ msg }) {
  if (!msg) return null;
  return (
    <p className={`mt-3 flex items-start gap-2 text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>
      <FontAwesomeIcon icon={msg.ok ? faCircleCheck : faTriangleExclamation} className="mt-0.5" />
      <span className="min-w-0 break-words">{msg.text}</span>
    </p>
  );
}

export default function Account() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [name, setName] = useState(getDisplayName(user));
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState(null);

  // Only social providers exist now (Google and GitHub)
  const providers = user?.app_metadata?.providers || [];
  const joined = user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const saveName = async () => {
    setNameBusy(true); setNameMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ data: { display_name: name.trim() } });
      setNameMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Name updated.' });
    } catch {
      setNameMsg({ ok: false, text: 'Network problem. Please try again.' });
    } finally {
      setNameBusy(false);
    }
  };

  const logout = async () => { await signOut(); navigate('/', { replace: true }); };

  return (
    <div className="min-h-[100dvh] bg-[#f6f8fc] text-[#1b1f24]">
      <header className="border-b border-gray-200 bg-white px-3 py-3 md:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back" className="rounded-lg px-2.5 py-2 text-gray-700 hover:bg-gray-100">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Account Settings</h1>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-3 px-3 py-6 md:px-6 md:py-8">
        <Card title="Profile">
          <div className="mt-4 flex items-center gap-4">
            <Avatar user={user} size={64} />
            <div className="min-w-0">
              <p className="truncate font-bold text-gray-900">{getDisplayName(user)}</p>
              {user?.email && <p className="truncate text-sm text-gray-500">{user.email}</p>}
            </div>
          </div>
          <p className="mb-1.5 mt-5 text-sm font-semibold text-gray-700">Display name</p>
          <div className="flex gap-2">
            <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            <button onClick={saveName} disabled={nameBusy || !name.trim()} className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {nameBusy && <FontAwesomeIcon icon={faSpinner} spin />} Save
            </button>
          </div>
          <Msg msg={nameMsg} />
          <p className="mt-3 text-xs text-gray-500">Your photo comes from the account you signed in with.</p>
        </Card>

        <Card title="Sign-in details">
          <dl className="mt-4 divide-y divide-gray-100 text-sm">
            {user?.email && (
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-gray-500">Email</dt>
                <dd className="min-w-0 truncate font-semibold text-gray-900">{user.email}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3 py-2.5">
              <dt className="text-gray-500">Member since</dt>
              <dd className="font-semibold text-gray-900">{joined}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-gray-500">Sign-in method</dt>
              <dd className="flex flex-wrap justify-end gap-2">
                {providers.map((p) => {
                  // Unknown providers fall back to a generic check icon
                  const info = PROVIDER_INFO[p] || { label: p, icon: faCircleCheck };
                  return (
                    <span key={p} className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                      <FontAwesomeIcon icon={info.icon} /> {info.label}
                    </span>
                  );
                })}
              </dd>
            </div>
          </dl>
        </Card>

        <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50">
          <FontAwesomeIcon icon={faRightFromBracket} /> Log out
        </button>
      </main>
    </div>
  );
}