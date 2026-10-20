import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import PracticeSession from './pages/PracticeSession';
import History from './pages/History';
import More from './pages/More';
import Info from './pages/Info';
import TongueTwister from './pages/TongueTwister';
import Settings from './pages/Settings';

// Full-screen pages (no tabs) replay the enter animation when they mount
const Page = ({ children }) => <div className="anim-page">{children}</div>;

function App() {
  return (
    <Router>
      <Routes>
        {/* Pages with the tab navigation */}
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/more" element={<More />} />
          <Route path="/info/:slug" element={<Info />} />
        </Route>

        {/* Full-screen pages */}
        <Route path="/auth" element={<Page><Auth /></Page>} />
        <Route path="/onboarding" element={<Page><Onboarding /></Page>} />
        <Route path="/warmup" element={<Page><TongueTwister /></Page>} />
        <Route path="/practice" element={<Page><PracticeSession /></Page>} />
        <Route path="/settings" element={<Page><Settings /></Page>} />
      </Routes>
    </Router>
  );
}

export default App;