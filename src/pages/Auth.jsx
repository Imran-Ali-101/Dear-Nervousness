import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faLock, faUser, faArrowRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Splash } from '../components/RequireAuth';
import GoogleButton from '../components/GoogleButton';

const OTHER_PROVIDERS = [
  { id: 'github', label: 'GitHub', icon: faGithub },
  { id: 'linkedin_oidc', label: 'LinkedIn', icon: faLinkedinIn },
];
const INPUT = 'w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 text-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';

export default function Auth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState(location.state?.mode === 'signup' ? 'signup' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (loading) return <Splash />;
  if (session) return <Navigate to={location.state?.from || '/dashboard'} replace />;

  const oauth = async (provider) => {
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (err) setError(err.message);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
    } else {
      const { data, error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (err) setError(err.message);
      else if (!data.session) setNotice('Check your email to confirm your account, then log in.');
    }
    setBusy(false);
  };

  const isLogin = mode === 'login';
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2.5">
          <img src="/logo.svg" alt="" className="h-9 w-9 object-contain" />
          <span className="text-xl font-bold text-gray-900">Dear <span className="text-blue-600">Nervousness</span></span>
        </Link>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-1 text-sm text-gray-500">{isLogin ? 'Log in to continue your practice.' : 'Start practicing with confidence.'}</p>

          <div className="mt-5 space-y-2">
            <GoogleButton
              text={isLogin ? 'signin_with' : 'signup_with'}
              onError={setError}
              fallback={
                <button type="button" onClick={() => oauth('google')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                <FontAwesomeIcon icon={faGoogle} /> Continue with Google
                </button>
              }
            />
            <div className="grid grid-cols-2 gap-2">
              {OTHER_PROVIDERS.map((p) => (
                <button key={p.id} type="button" onClick={() => oauth(p.id)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                  <FontAwesomeIcon icon={p.icon} /> {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
            <span className="h-px flex-1 bg-gray-200" /> or with email <span className="h-px flex-1 bg-gray-200" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {!isLogin && (
              <label className="relative block">
                <FontAwesomeIcon icon={faUser} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className={INPUT} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
            )}
            <label className="relative block">
              <FontAwesomeIcon icon={faEnvelope} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className={INPUT} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="relative block">
              <FontAwesomeIcon icon={faLock} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className={INPUT} type="password" placeholder="Password (min 6 characters)" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}
            {notice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{notice}</p>}

            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
              {busy ? <FontAwesomeIcon icon={faSpinner} spin /> : <>{isLogin ? 'Log in' : 'Sign up'} <FontAwesomeIcon icon={faArrowRight} /></>}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" onClick={() => { setMode(isLogin ? 'signup' : 'login'); setError(''); setNotice(''); }} className="font-bold text-blue-600 hover:underline">
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}