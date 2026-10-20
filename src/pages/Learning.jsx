import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeHigh, faSpinner, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useTTS } from '../hooks/useTTS';
import { spokenWords } from '../data/spokenWords';
import { grammarParts } from '../data/grammar';

const EN_VOICE = 'en-US-EricNeural';
const QUIZ_SIZE = 10;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions() {
  return shuffle(spokenWords).slice(0, QUIZ_SIZE).map((w) => {
    const wrong = shuffle(spokenWords.filter((x) => x.bn !== w.bn)).slice(0, 3).map((x) => x.bn);
    return { ...w, options: shuffle([w.bn, ...wrong]) };
  });
}

function SpokenQuiz() {
  const { speak, state } = useTTS({ voice: EN_VOICE, variety: 0, pause: 0, question: 0 });
  const [questions, setQuestions] = useState(buildQuestions);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);

  const q = questions[index];

  const play = () => speak(q.en).catch(() => {});

  const choose = (opt) => {
    if (picked) return;
    setPicked(opt);
    if (opt === q.bn) setScore((s) => s + 1);
  };

  const next = () => {
    setPicked(null);
    setIndex((i) => i + 1);
  };

  const restart = () => {
    setQuestions(buildQuestions());
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  if (index >= questions.length) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
        <div className="text-3xl font-bold text-gray-900">{score}/{questions.length}</div>
        <p className="mt-2 text-sm text-gray-500">
          {score >= 8 ? 'দারুণ! 🎉' : score >= 5 ? 'ভালো, আরেকবার চেষ্টা করুন 💪' : 'আবার প্র্যাকটিস করুন 🙂'}
        </p>
        <button onClick={restart} className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white">
          আবার খেলুন
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="text-xs text-gray-400">প্রশ্ন {index + 1}/{questions.length} • স্কোর {score}</div>

      <div className="my-4 flex items-center gap-3">
        <span className="text-3xl font-bold text-gray-900">{q.en}</span>
        <button
          onClick={play}
          aria-label="Listen"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600"
        >
          <FontAwesomeIcon icon={state === 'loading' ? faSpinner : faVolumeHigh} spin={state === 'loading'} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {q.options.map((opt) => {
          let cls = 'border-gray-200 bg-white text-gray-800';
          if (picked) {
            if (opt === q.bn) cls = 'border-green-500 bg-green-50 text-green-800';
            else if (opt === picked) cls = 'border-red-500 bg-red-50 text-red-800';
          }
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              className={`rounded-xl border-[1.5px] px-4 py-3 text-left text-sm font-medium transition ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {picked && (
        <button onClick={next} className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white">
          {index + 1 === questions.length ? 'রেজাল্ট দেখুন' : 'পরের প্রশ্ন'}
        </button>
      )}
    </div>
  );
}

function Line({ text, onSay, arrow }) {
  return (
    <div className="flex items-start gap-2">
      {arrow && <span className="mt-0.5 text-blue-500">→</span>}
      <span className="flex-1 text-sm font-medium text-gray-900">{text}</span>
      <button
        onClick={() => onSay(text)}
        aria-label="Listen"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs text-blue-600"
      >
        <FontAwesomeIcon icon={faVolumeHigh} />
      </button>
    </div>
  );
}

function Item({ it, onSay }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      {it.h && <div className="text-sm font-bold text-gray-900">{it.h}</div>}
      {it.rule && (
        <div className="mt-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{it.rule}</div>
      )}
      {it.note && <div className="mt-1 text-xs text-gray-600">{it.note}</div>}
      {it.en && <div className="mt-2"><Line text={it.en} onSay={onSay} /></div>}
      {it.to && <div className="mt-1.5"><Line text={it.to} onSay={onSay} arrow /></div>}
      {it.bn && <div className="mt-1.5 text-xs text-gray-500">{it.bn}</div>}
    </div>
  );
}

function Grammar() {
  const [open, setOpen] = useState(null);
  const { speak } = useTTS({ voice: EN_VOICE, variety: 0, pause: 0, question: 0 });
  const say = (t) => speak(t.replace(/\s*\((Noun|Verb|Adjective|Adverb|Preposition|Conjunction)\)$/, '')).catch(() => {});

  return (
    <div className="flex flex-col gap-3">
      {grammarParts.map((p) => {
        const isOpen = open === p.id;
        return (
          <div key={p.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <button onClick={() => setOpen(isOpen ? null : p.id)} className="w-full p-4 text-left">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-900">{p.title}</span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`text-xs text-gray-300 transition ${isOpen ? 'rotate-180' : ''}`}
                />
              </div>
              <div className="mt-0.5 text-xs text-gray-500">{p.desc}</div>
            </button>

            {isOpen && (
              <div className="flex flex-col gap-5 px-4 pb-4">
                {p.sections.map((s) => (
                  <section key={s.title}>
                    <h3 className="text-sm font-bold text-blue-600">{s.title}</h3>
                    {s.text && <p className="mt-1 text-xs leading-relaxed text-gray-600">{s.text}</p>}
                    <div className="mt-2 flex flex-col gap-2">
                      {s.items.map((it, i) => <Item key={i} it={it} onSay={say} />)}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Learning() {
  const [tab, setTab] = useState('grammar');
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">English/Bengali Learning</h1>

      <div className="mt-5 mb-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
        {[['grammar', 'Grammar'], ['quiz', 'Spoken Quiz']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-lg py-2.5 text-sm font-semibold transition ${
              tab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'grammar' ? <Grammar /> : <SpokenQuiz />}
    </main>
  );
}