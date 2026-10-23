import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './hooks/useAuth';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import PracticeSession from './pages/PracticeSession';
import History from './pages/History';
import More from './pages/More';
import Info from './pages/Info';
import TongueTwister from './pages/TongueTwister';
import Settings from './pages/Settings';
import Account from './pages/Account';
import QuotaDialog from './components/QuotaDialog';
import Report from './pages/Report';
import Game from './pages/Game';
import GameResult from './pages/GameResult';


// Full-screen pages (no tabs) replay the enter animation when they mount
const Page = ({ children }) => <div className="anim-page">{children}</div>;

function App() {
  return (
      <Router>
          <AuthProvider>
            <Routes>
              {/* Public pages */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Page><Auth /></Page>} />
              <Route path="/privacy" element={<Page><Info slug="privacy" standalone /></Page>} />
              <Route path="/terms" element={<Page><Info slug="terms" standalone /></Page>} />
    
              {/* Logged-in pages only */}
              <Route element={<RequireAuth />}>
                {/* Pages with the tab navigation */}
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/game" element={<Game />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/more" element={<More />} />
                  <Route path="/info/:slug" element={<Info />} />
                </Route>
    
                {/* Full-screen pages */}
                <Route path="/onboarding" element={<Page><Onboarding /></Page>} />
                <Route path="/game/result/:startedAt" element={<Page><GameResult /></Page>} />
                <Route path="/warmup" element={<Page><TongueTwister /></Page>} />
                <Route path="/practice" element={<Page><PracticeSession /></Page>} />
                <Route path="/report/:startedAt" element={<Page><Report /></Page>} />
                <Route path="/settings" element={<Page><Settings /></Page>} />
                <Route path="/settings/account" element={<Page><Account /></Page>} />
              </Route>
            </Routes>
            <QuotaDialog />
          </AuthProvider>
      </Router>
  );
}

export default App;