import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faLock, faPlay, faClock, faTrophy, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { TOPICS } from '../data/gameTopics';
import { useGame, levelStatus, passMark, gameConfig, passedCount, GAME_MINUTES, TOTAL_LEVELS } from '../lib/game';
import { hasGeminiKey } from '../lib/apiKey';

const STATUS = {
  passed: { icon: faCheck, box: 'bg-emerald-500 text-white' },
  open: { icon: faPlay, box: 'bg-blue-600 text-white' },
  tomorrow: { icon: faClock, box: 'bg-amber-100 text-amber-600' },
  locked: { icon: faLock, box: 'bg-gray-100 text-gray-400' },
};

export default function Game() {
  const navigate = useNavigate();
  const game = useGame();
  const [openId, setOpenId] = useState(null);
  const done = passedCount(game);
  const nextLevel = Math.min(done + 1, TOTAL_LEVELS);

  const start = (level) => {
    if (!hasGeminiKey()) { navigate('/settings'); return; }
    navigate('/practice', { state: gameConfig(level) });
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Topic Challenge</h1>
      <p className="mt-1 text-sm text-gray-500">Talk about each topic with the AI. Score the pass mark to unlock the next level.</p>

      <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <FontAwesomeIcon icon={faTrophy} className="text-2xl text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">{done} of {TOTAL_LEVELS} levels passed</p>
            <p className="text-xs text-gray-500">
              {done >= TOTAL_LEVELS ? 'All levels completed.' : `Next: Level ${nextLevel}, pass mark ${passMark(nextLevel)}%, ${GAME_MINUTES} minutes`}
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(done / TOTAL_LEVELS) * 100}%` }} />
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {TOPICS.map((t) => {
          const status = levelStatus(game, t.id);
          const s = STATUS[status];
          const expanded = openId === t.id && status !== 'locked';
          const best = game.best[t.id];
          return (
            <li key={t.id} className={`rounded-2xl border bg-white shadow-sm ${status === 'open' ? 'border-blue-200' : 'border-gray-100'}`}>
              <button
                onClick={() => status !== 'locked' && setOpenId(expanded ? null : t.id)}
                disabled={status === 'locked'}
                className="flex w-full items-center gap-3 p-3.5 text-left disabled:cursor-not-allowed"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.box}`}>
                  <FontAwesomeIcon icon={s.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-bold ${status === 'locked' ? 'text-gray-400' : 'text-gray-900'}`}>
                    {t.id}. {t.title}
                  </span>
                  <span className="block text-xs text-gray-500">
                    Pass mark {passMark(t.id)}%{best != null ? ` · Best ${best}%` : ''}
                  </span>
                </span>
              </button>

              {expanded && (
                <div className="border-t border-gray-100 p-4">
                  {t.description && <p className="mb-3 text-sm leading-relaxed text-gray-600">{t.description}</p>}
                  {status === 'open' && (
                    <button onClick={() => start(t.id)} className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700">
                      <FontAwesomeIcon icon={faPlay} className="text-sm" /> Start Level {t.id}
                    </button>
                  )}
                  {status === 'passed' && (
                    <button onClick={() => start(t.id)} className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 py-3 font-bold text-gray-700 hover:bg-gray-50">
                      <FontAwesomeIcon icon={faRotateRight} className="text-sm" /> Replay (progress will not change)
                    </button>
                  )}
                  {status === 'tomorrow' && (
                    <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-center text-sm font-semibold text-amber-800">You passed a level today. This one opens tomorrow.</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}