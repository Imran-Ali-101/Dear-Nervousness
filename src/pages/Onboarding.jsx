import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHand, faMicrophoneLines, faPhone, faTrophy, faBookOpen, faClockRotateLeft,
  faKey, faArrowUpRightFromSquare, faChevronLeft, faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { markOnboarded } from '../lib/onboarding';
import { hasGeminiKey } from '../lib/apiKey';

export const KEY_VIDEO_URL = 'https://www.google.com/search?q=How+to+get+a+free+google+ai+studio+api+key+video';

const SLIDES = [
  { icon: faHand, color: 'bg-blue-50 text-blue-600', title: 'Welcome to Dear Nervousness',
    text: 'Practice speaking out loud with an AI coach in English or Bengali, and watch your confidence grow.' },
  { icon: faMicrophoneLines, color: 'bg-indigo-50 text-indigo-600', title: 'Practice from Home',
    text: 'Choose a language, a practice type and a level, then start talking. When you finish, you get a report on confidence, pace and filler words.' },
  { icon: faPhone, color: 'bg-amber-50 text-amber-600', title: 'Daily News Special',
    text: 'Tap the call button on any story to discuss it with the AI. Stories you have finished show Completed. Pick your country, sources and topics in the news settings.' },
  { icon: faTrophy, color: 'bg-emerald-50 text-emerald-600', title: 'Game',
    text: 'Topic challenges that make you speak on a random subject. A fun way to practice under a little pressure.' },
  { icon: faBookOpen, color: 'bg-purple-50 text-purple-600', title: 'Learning',
    text: 'Study grammar and take the spoken quiz to build the words and sentences you will use when you speak.' },
  { icon: faClockRotateLeft, color: 'bg-sky-50 text-sky-600', title: 'History and reports',
    text: 'Every session is saved with its conversation and tips such as better ways to say things and stronger words. Open it any time from History.' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const touchX = useRef(null);
  const last = SLIDES.length; // the extra final slide is the API key step
  const total = SLIDES.length + 1;

  useEffect(() => { markOnboarded(); }, []);

  const go = (n) => setI(Math.max(0, Math.min(total - 1, n)));
  const finish = (to) => navigate(to, { replace: true });

  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
  };

  const hasKey = hasGeminiKey();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="flex items-center justify-between px-5 pt-5">
        <img src="/logo.svg" alt="" className="h-9 w-9" />
        {i < last && (
          <button onClick={() => finish('/dashboard')} className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-white/70">Skip</button>
        )}
      </div>

      <div
        className="flex flex-1 items-center overflow-hidden"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex w-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
          {SLIDES.map((s) => (
            <section key={s.title} className="flex w-full shrink-0 flex-col items-center px-8 text-center">
              <span className={`flex h-24 w-24 items-center justify-center rounded-3xl text-4xl ${s.color}`}>
                <FontAwesomeIcon icon={s.icon} />
              </span>
              <h1 className="mt-8 text-2xl font-bold text-gray-900">{s.title}</h1>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-gray-600">{s.text}</p>
            </section>
          ))}

          <section className="flex w-full shrink-0 flex-col items-center px-8 text-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-rose-50 text-4xl text-rose-600">
              <FontAwesomeIcon icon={faKey} />
            </span>
            <h1 className="mt-8 text-2xl font-bold text-gray-900">{hasKey ? 'You are ready' : 'One last step'}</h1>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-gray-600">
              {hasKey
                ? 'Your Gemini API key is already saved. Start your first practice.'
                : 'Practice and the news discussion need a free Google Gemini API key. It stays only in your browser and goes straight to Google.'}
            </p>
            {!hasKey && (
              <a href={KEY_VIDEO_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
                Watch how to get a free key <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs" />
              </a>
            )}
            <div className="mt-7 flex w-full max-w-xs flex-col gap-2">
              <button
                onClick={() => finish(hasKey ? '/dashboard' : '/settings')}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700"
              >
                {hasKey ? 'Start practicing' : 'Add my API key'}
              </button>
              {!hasKey && (
                <button onClick={() => finish('/dashboard')} className="rounded-xl px-5 py-3 text-sm font-semibold text-gray-500 hover:bg-white/70">Maybe later</button>
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 pb-8 pt-4">
        <button onClick={() => go(i - 1)} aria-label="Previous" className={`flex h-11 w-11 items-center justify-center rounded-full text-gray-500 hover:bg-white ${i === 0 ? 'invisible' : ''}`}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: total }, (_, n) => (
            <button key={n} onClick={() => go(n)} aria-label={`Slide ${n + 1}`} className={`h-2 rounded-full transition-all ${n === i ? 'w-6 bg-blue-600' : 'w-2 bg-gray-300'}`} />
          ))}
        </div>
        <button onClick={() => go(i + 1)} aria-label="Next" className={`flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 ${i === total - 1 ? 'invisible' : ''}`}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );
}