// Speaking time (first to last voiced moment) of a base64 webm clip, in seconds
export async function measureSpeechSeconds(base64) {
  let ctx;
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = await ctx.decodeAudioData(bytes.buffer);
    const data = buf.getChannelData(0);
    const frame = Math.round(buf.sampleRate * 0.05); // 50 ms
    let first = -1, last = -1;
    for (let i = 0, n = 0; i + frame <= data.length; i += frame, n++) {
      let sum = 0;
      for (let j = i; j < i + frame; j++) sum += data[j] * data[j];
      if (Math.sqrt(sum / frame) > 0.015) {
        if (first < 0) first = n;
        last = n;
      }
    }
    return first < 0 ? 0 : (last - first + 1) * 0.05;
  } catch {
    return 0;
  } finally {
    ctx?.close();
  }
}