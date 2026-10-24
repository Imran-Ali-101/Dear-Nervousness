import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { seenOnboarding } from '../lib/onboarding';

export function Splash() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f8fc]">
      <img src="/logo.svg" alt="" className="h-12 w-12 animate-pulse" />
    </div>
  );
}

// Logged-out visitors are sent to /auth; they come back to the page they wanted after login
export default function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!session) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  // First visit to the dashboard on this device: show the quick guide once
  if (location.pathname === '/dashboard' && !seenOnboarding()) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}