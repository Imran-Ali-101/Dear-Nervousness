import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCircleCheck, faCircleXmark, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useGame, gameConfig, MIN_TURNS } from '../lib/game';
import { TOPICS } from '../data/gameTopics';

const LABELS = { relevance: 'Relevance', argument: 'Argument', vocabulary: 'Vocabulary', grammar: 'Grammar', fluency: 'Fluency' };

export default function GameResult() {
  const { startedAt } = useParams();
  const navigate = useNavigate();
  const game = useGame();
  const r = game.last && String(game.last.startedAt) === startedAt ? game.last : null;
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 90000);
    return () => clearTimeout(id);
  }, []);

  const retry = () => navigate('/practice', { state: gameConfig(r.level) });
  const back = () => navigate('/game');

  let body;
  if (!r) {
    body = (
      <>
        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-blue-600" />
        <p className="mt-4 font-bold text-gray-900">Scoring your conversation...</p>
        <p className="mt-1 text-sm text-gray-500">{slow ? 'This is taking longer than usual.' : 'This takes a few seconds.'}</p>
        {slow && <button onClick={back} className="mt-5 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">Back to Levels</button>}
      </>
    );
  } else if (r.failed || r.tooShort) {
    body = (
      <>
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-4xl text-amber-500" />
        <p className="mt-4 font-bold text-gray-900">{r.tooShort ? 'Not enough speech to score' : 'Scoring failed'}</p>
        <p className="mt-1 text-sm text-gray-500">
          {r.tooShort ? `You gave ${r.spoken} answer${r.spoken === 1 ? '' : 's'}. At least ${MIN_TURNS} are needed.` : 'Please try again.'}
        </p>
        <div className="mt-5 flex gap-2">
          <button onClick={retry} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Try Again</button>
          <button onClick={back} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">Back to Levels</button>
        </div>
      </>
    );
  } else {
    body = (
      <>
        <FontAwesomeIcon icon={r.passed ? faCircleCheck : faCircleXmark} className={`text-5xl ${r.passed ? 'text-emerald-500' : 'text-red-500'}`} />
        <p className="mt-3 text-5xl font-bold text-gray-900">{r.score}%</p>
        <p className="mt-1 text-sm text-gray-500">Level {r.level}: {TOPICS[r.level - 1]?.title}</p>
        <p className={`mt-3 rounded-lg px-3 py-1.5 text-sm font-bold ${r.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {r.passed
            ? (r.counted ? 'Level passed. The next level opens tomorrow.' : 'Passed (progress unchanged).')
            : `You need ${r.need}% to pass. Try again.`}
        </p>

        <div className="mt-6 w-full space-y-3 text-left">
          {Object.entries(LABELS).map(([k, label]) => (
            <div key={k}>
              <div className="mb-1 flex justify-between text-xs font-semibold text-gray-600"><span>{label}</span><span>{r.breakdown[k]}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${r.breakdown[k]}%` }} />
              </div>
            </div>
          ))}
        </div>

        {r.feedback && <p className="mt-5 text-sm leading-relaxed text-gray-600">{r.feedback}</p>}

        <div className="mt-6 flex w-full gap-2">
          {!r.passed && <button onClick={retry} className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700">Try Again</button>}
          <button onClick={back} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">Back to Levels</button>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-blue-50 via-[#f6f8fc] to-indigo-50 p-4">
      <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-xl md:p-8">
        {body}
      </div>
    </div>
  );
}