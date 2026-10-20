import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck } from '@fortawesome/free-solid-svg-icons';

const twisters = [
  "I scream, you scream, we all scream for ice cream",
  "Nine nice night nurses nursing nicely",
  "Four fine fresh fish for you",
];
const REPEATS = 3;

export default function TongueTwister() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [count, setCount] = useState(0);

  // Pass the dashboard setup on to the practice session
  const goPractice = () => navigate('/practice', { state });

  const handleNext = () => {
    if (count < REPEATS - 1) {
      setCount(count + 1); // repeat counter for the current twister
    } else if (currentIndex < twisters.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCount(0);
    } else {
      goPractice(); // all done, continue to the practice session
    }
  };

  const isLastRepeat = count === REPEATS - 1;
  const isLastTwister = currentIndex === twisters.length - 1;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-[#f6f8fc] to-indigo-50 p-4 text-[#1b1f24] md:p-6">
      <div className="w-full max-w-xl rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-xl md:p-10">
        <img src="/logo.svg" alt="" className="mx-auto mb-3 h-12 w-12 object-contain" />
        <h2 className="text-2xl font-bold text-gray-900">Vocal Warm-up</h2>
        <p className="mb-6 mt-1 text-sm text-gray-500 md:text-base">Say this out loud to loosen up your voice</p>

        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 md:p-7">
          <p className="text-lg font-semibold leading-relaxed text-blue-900 md:text-2xl">“{twisters[currentIndex]}”</p>
        </div>

        <div className="mb-6 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-gray-500">Twister {currentIndex + 1} of {twisters.length}</span>
          <div className="flex gap-1.5" aria-label={`Repeat ${count + 1} of ${REPEATS}`}>
            {Array.from({ length: REPEATS }, (_, i) => (
              <div key={i} className={`h-2 w-8 rounded-full transition-colors ${i <= count ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={handleNext} className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.99]">
            {isLastRepeat ? (
              <>{isLastTwister ? 'Finish Warm-up' : 'Next Twister'} <FontAwesomeIcon icon={faArrowRight} className="text-sm" /></>
            ) : (
              <><FontAwesomeIcon icon={faCheck} className="text-sm" /> I said it</>
            )}
          </button>
          <button onClick={goPractice} className="w-full py-2.5 font-medium text-gray-500 transition hover:text-gray-800">Skip Warm-up</button>
        </div>
      </div>
    </div>
  );
}