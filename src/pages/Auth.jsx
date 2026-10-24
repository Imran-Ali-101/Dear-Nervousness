import { useCallback, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Splash } from '../components/RequireAuth';
import GoogleButton from '../components/GoogleButton';

const OTHER_PROVIDERS = [
  { id: 'github', label: 'GitHub', icon: faGithub },
];

// Turn raw auth errors into short messages the user can understand
const friendlyError = (msg = '') => {
  const m = msg.toLowerCase();
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a while and try again.';
  if (m.includes('provider is not enabled')) return 'This sign-in method is not available right now.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Network problem. Please check your connection.';
  if (m.includes('access_denied') || m.includes('cancel')) return 'Sign-in was cancelled. Please try again.';
  return 'Something went wrong. Please try again later.';
};

export default function Auth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const onGoogleError = useCallback((m) => setError(friendlyError(m)), []);

  if (loading) return <Splash />;
  if (session) return <Navigate to={location.state?.from || '/dashboard'} replace />;

  const oauth = async (provider) => {
    setError('');
    setBusyId(provider);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (err) { setError(friendlyError(err.message)); setBusyId(''); }
      // On success the browser redirects away, so the busy state stays on
    } catch {
      setError('Network problem. Please check your connection.');
      setBusyId('');
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2.5">
          <img src="/logo.svg" alt="" className="h-9 w-9 object-contain" />
          <span className="text-xl font-bold text-gray-900">Dear <span className="text-blue-600">Nervousness</span></span>
        </Link>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Welcome</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to start practicing with confidence.</p>

          <div className="mt-5 space-y-2">
            <GoogleButton
              text="continue_with"
              onError={onGoogleError}
              fallback={
                <button type="button" onClick={() => oauth('google')} disabled={!!busyId}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60">
                  <FontAwesomeIcon icon={busyId === 'google' ? faSpinner : faGoogle} spin={busyId === 'google'} /> Continue with Google
                </button>
              }
            />
            <div className="grid grid-cols-1 gap-2">
              {OTHER_PROVIDERS.map((p) => (
                <button key={p.id} type="button" onClick={() => oauth(p.id)} disabled={!!busyId}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60">
                  <FontAwesomeIcon icon={busyId === p.id ? faSpinner : p.icon} spin={busyId === p.id} /> {p.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}

          <p className="mt-5 text-center text-xs text-gray-400">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="font-semibold text-blue-600 hover:underline">Terms</Link> and{' '}
            <Link to="/privacy" className="font-semibold text-blue-600 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}