const FRAME_SEC = 0.05;       // 50 ms analysis window
const VOICE_LEVEL = 0.015;    // loudness above this = speaking
const MIN_PAUSE_SEC = 0.35;   // shorter gaps are just breathing between words
const LONG_PAUSE_SEC = 1.0;   // this long or longer = awkward / too long

// Pure function (easy to test): looks at raw samples and measures speech + pauses
export function analyzeSamples(data, sampleRate) {
  const frame = Math.round(sampleRate * FRAME_SEC);
  const voiced = [];
  for (let i = 0; i + frame <= data.length; i += frame) {
    let sum = 0;
    for (let j = i; j < i + frame; j++) sum += data[j] * data[j];
    voiced.push(Math.sqrt(sum / frame) > VOICE_LEVEL);
  }

  const first = voiced.indexOf(true);
  const last = voiced.lastIndexOf(true);
  const empty = { speechSec: 0, shortPauses: 0, longPauses: 0, pauseSec: 0, longestPauseSec: 0 };
  if (first < 0) return empty;

  // Only gaps BETWEEN the first and last voiced frame count as pauses
  let shortPauses = 0, longPauses = 0, pauseSec = 0, longestPauseSec = 0, run = 0;
  const close = () => {
    const sec = run * FRAME_SEC;
    if (sec >= MIN_PAUSE_SEC) {
      if (sec >= LONG_PAUSE_SEC) longPauses++; else shortPauses++;
      pauseSec += sec;
      longestPauseSec = Math.max(longestPauseSec, sec);
    }
    run = 0;
  };
  for (let n = first; n <= last; n++) {
    if (voiced[n]) close(); else run++;
  }

  const r = (v) => Math.round(v * 100) / 100;
  return {
    speechSec: (last - first + 1) * FRAME_SEC,
    shortPauses, longPauses,
    pauseSec: r(pauseSec),
    longestPauseSec: r(longestPauseSec),
  };
}

// Speaking time + pauses of a base64 webm clip (decoded once)
export async function measureAudio(base64) {
  let ctx;
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = await ctx.decodeAudioData(bytes.buffer);
    return analyzeSamples(buf.getChannelData(0), buf.sampleRate);
  } catch {
    return { speechSec: 0, shortPauses: 0, longPauses: 0, pauseSec: 0, longestPauseSec: 0 };
  } finally {
    ctx?.close();
  }
}

// Kept so any old import keeps working
export const measureSpeechSeconds = async (base64) => (await measureAudio(base64)).speechSec;
