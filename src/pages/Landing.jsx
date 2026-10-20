import { Link, Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight, faMicrophoneLines, faGaugeHigh, faCommentDots, faChartLine, faLanguage, faBrain, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../hooks/useAuth';
import { Splash } from '../components/RequireAuth';

const FEATURES = [
  { icon: faMicrophoneLines, title: 'Voice mock interviews', text: 'Practice HR and technical interviews with an AI interviewer that talks back in Bengali or English.' },
  { icon: faCommentDots, title: 'Filler word detection', text: 'See every "um", "ah" and "মানে" you say, with a per-minute count and a trend over time.' },
  { icon: faGaugeHigh, title: 'Pacing and pauses', text: 'Track your words per minute and pauses so you sound calm, clear and natural.' },
  { icon: faChartLine, title: 'Progress analytics', text: 'Confidence score, session history and daily performance charts to see real improvement.' },
  { icon: faLanguage, title: 'Bengali and English', text: 'Built for Bangla speakers: switch language and practice in the one you need.' },
  { icon: faBrain, title: 'Smart feedback', text: 'A post-session report with rephrasing suggestions and follow-up questions, like a real coach.' },
];
const STEPS = [
  { n: 1, title: 'Setup', text: 'Choose language, practice type, persona and time limit.' },
  { n: 2, title: 'Track', text: 'Speak naturally while we measure confidence, pacing and filler words.' },
  { n: 3, title: 'Analyze', text: 'Review your report and compare with past sessions.' },
];

export default function Landing() {
  const { session, loading } = useAuth();
  if (loading) return <Splash />;
  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="anim-page min-h-[100dvh] bg-white text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold">Dear <span className="text-blue-600">Nervousness</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Log in</Link>
            <Link to="/auth" state={{ mode: 'signup' }} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700">Get started</Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
          <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
            Better communication.<br /><span className="text-blue-600">Greater confidence.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600 md:text-lg">
            Practice interviews and speaking with an AI coach, get instant feedback on your filler words, pacing and confidence, and watch yourself improve every day.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth" className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700">
              Start practicing free <FontAwesomeIcon icon={faArrowRight} />
            </Link>
            <a href="#features" className="rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50">See features</a>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold md:text-3xl">Everything you need to speak with confidence</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FontAwesomeIcon icon={f.icon} /></span>
              <h3 className="mt-3 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold md:text-3xl">How it works</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">{s.n}</span>
                <h3 className="mt-3 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold md:text-3xl">Ready to calm the nerves?</h2>
        <ul className="mx-auto mt-5 inline-flex flex-col gap-2 text-left text-sm text-gray-600">
          {['No setup, practice in your browser', 'Works in Bengali and English', 'Your progress is saved to your account'].map((t) => (
            <li key={t} className="flex items-center gap-2"><FontAwesomeIcon icon={faCheck} className="text-emerald-500" /> {t}</li>
          ))}
        </ul>
        <div className="mt-8">
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700">
            Create free account <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        Dear Nervousness. Small steps every day create big changes.
      </footer>
    </div>
  );
}