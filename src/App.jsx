import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import PracticeSession from './pages/PracticeSession';
import History from './pages/History';
import TongueTwister from './pages/TongueTwister';
import Settings from './pages/Settings';

function AnimatedRoutes() {
  const location = useLocation();
  // A new key remounts the wrapper, which replays the enter animation on every route change
  return (
    <div key={location.pathname} className="anim-page">
      <Routes location={location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/practice" element={<PracticeSession />} />
        <Route path="/history" element={<History />} />
        <Route path="/warmup" element={<TongueTwister />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;