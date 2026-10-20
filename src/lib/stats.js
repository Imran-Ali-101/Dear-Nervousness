const avg = (arr) => {
  const v = arr.filter((x) => Number.isFinite(x));
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
};

// sessions: newest first. Only the chosen language is used.
export function buildStats(sessions, language, days) {
  const mine = sessions.filter((s) => s.language === language);
  const done = mine.filter((s) => s.analysis);

  const labels = [], confidence = [], wpm = [], fillers = [];
  let from = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    if (i === days - 1) from = d.getTime();

    const key = d.toDateString();
    const day = done.filter((s) => new Date(s.startedAt).toDateString() === key);
    labels.push(d.toLocaleDateString(undefined, days <= 7 ? { weekday: 'short' } : { month: 'short', day: 'numeric' }));
    confidence.push(avg(day.map((s) => s.analysis.confidence)));
    wpm.push(avg(day.map((s) => s.analysis.wpm)));
    fillers.push(avg(day.map((s) => s.analysis.fillersPerMin)));
  }

  const inRange = done.filter((s) => s.startedAt >= from);
  return {
    labels, confidence, wpm, fillers,
    summary: {
      count: inRange.length,
      confidence: avg(inRange.map((s) => s.analysis.confidence)),
      wpm: avg(inRange.map((s) => s.analysis.wpm)),
      fillers: avg(inRange.map((s) => s.analysis.fillersPerMin)),
    },
    past: mine.slice(0, 5),
  };
}