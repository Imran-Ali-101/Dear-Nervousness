import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';

const LINES = [
  'We do not collect your video or photos.',
  'Your camera is used only to calculate your scores.',
  'Eye contact, smile, head steadiness and framing are measured right on your device.',
  'Only the final numbers are saved to your account.',
];

// Types one line letter by letter, waits, then moves to the next one
function Typewriter({ lines }) {
  const [line, setLine] = useState(0);
  const [chars, setChars] = useState(0);
  const text = lines[line];

  useEffect(() => {
    if (chars < text.length) {
      const id = setTimeout(() => setChars((c) => c + 1), 28);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setLine((l) => (l + 1) % lines.length);
      setChars(0);
    }, 1800);
    return () => clearTimeout(id);
  }, [chars, text, lines.length]);

  return (
    <p className="min-h-[4.5rem] text-sm leading-relaxed text-gray-600">
      {text.slice(0, chars)}
      <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-blue-600 align-middle">&nbsp;</span>
    </p>
  );
}

export default function FaceLoadingDialog({ open, progress, error, onHide, onRetry }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="anim-pop w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FontAwesomeIcon icon={faShieldHalved} />
          </span>
          <h3 className="font-bold text-gray-900">
            {error ? 'Could not load face analysis' : 'Getting face analysis ready'}
          </h3>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-gray-600">
            Please check your internet connection and try again. You can still practise without it.
          </p>
        ) : (
          <>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-3xl font-extrabold text-blue-600">{progress}%</p>
              <p className="text-xs text-gray-400">One-time download, about 16 MB</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-4"><Typewriter lines={LINES} /></div>
            <p className="text-xs text-gray-400">Next time it will open much faster.</p>
          </>
        )}

        <div className="mt-5 flex gap-2">
          <button onClick={onHide} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            {error ? 'Close' : 'Continue in background'}
          </button>
          {error && (
            <button onClick={onRetry} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Try again</button>
          )}
        </div>
      </div>
    </div>
  );
}