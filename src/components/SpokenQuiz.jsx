import { useState, useMemo } from "react";
import { spokenWords } from "../data/spokenWords";

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function buildQuestions() {
  return shuffle(spokenWords).slice(0, 10).map((w) => {
    const wrong = shuffle(spokenWords.filter((x) => x.bn !== w.bn))
      .slice(0, 3)
      .map((x) => x.bn);
    return { ...w, options: shuffle([w.bn, ...wrong]) };
  });
}

export default function SpokenQuiz() {
  const [questions, setQuestions] = useState(buildQuestions);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);

  const q = questions[index];
  const finished = index >= questions.length;

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

  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  if (finished) {
    return (
      <div style={styles.card}>
        <h3 style={{ margin: 0 }}>স্কোর: {score}/{questions.length}</h3>
        <p style={{ color: "#6b7280" }}>
          {score >= 8 ? "দারুণ! 🎉" : score >= 5 ? "ভালো, আরেকবার চেষ্টা করুন 💪" : "আবার প্র্যাকটিস করুন 🙂"}
        </p>
        <button style={styles.primary} onClick={restart}>আবার খেলুন</button>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={{ color: "#6b7280", fontSize: 14 }}>
        প্রশ্ন {index + 1}/{questions.length} • স্কোর {score}
      </div>

      <div style={styles.word}>
        {q.en}
        <button style={styles.speaker} onClick={() => speak(q.en)} aria-label="Pronounce">🔊</button>
      </div>

      {q.options.map((opt) => {
        let bg = "#fff", border = "#e5e7eb";
        if (picked) {
          if (opt === q.bn) { bg = "#dcfce7"; border = "#22c55e"; }
          else if (opt === picked) { bg = "#fee2e2"; border = "#ef4444"; }
        }
        return (
          <button
            key={opt}
            onClick={() => choose(opt)}
            style={{ ...styles.option, background: bg, borderColor: border }}
          >
            {opt}
          </button>
        );
      })}

      {picked && (
        <button style={styles.primary} onClick={next}>
          {index + 1 === questions.length ? "রেজাল্ট দেখুন" : "পরের প্রশ্ন"}
        </button>
      )}
    </div>
  );
}

const styles = {
  card: { background: "#fff", borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12, border: "1px solid #e5e7eb" },
  word: { fontSize: 32, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 10 },
  speaker: { border: "none", background: "transparent", fontSize: 22, cursor: "pointer" },
  option: { padding: "14px 16px", borderRadius: 14, border: "1.5px solid", fontSize: 16, textAlign: "left", cursor: "pointer" },
  primary: { padding: "14px", borderRadius: 14, border: "none", background: "#1d4ed8", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" },
};