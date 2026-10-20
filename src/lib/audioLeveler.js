// Evens out the loudness of every Audio element (and of our own PCM playback)
// by routing it through a compressor and a limiter.
const LEVEL_GAIN = 1.8;   // raise or lower this to make everything louder or quieter

let ctx = null;
let input = null;
const wired = new WeakSet();

export function getLevelerContext() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -40;
  comp.knee.value = 30;
  comp.ratio.value = 10;
  comp.attack.value = 0.003;
  comp.release.value = 0.25;

  const gain = ctx.createGain();
  gain.gain.value = LEVEL_GAIN;

  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.1;

  comp.connect(gain);
  gain.connect(limiter);
  limiter.connect(ctx.destination);
  input = comp;
  return ctx;
}

export const getLevelerInput = () => { getLevelerContext(); return input; };

// Call once at startup
export function installLeveler() {
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function patchedPlay(...args) {
    const el = this;
    if (!(el instanceof HTMLAudioElement) || wired.has(el)) return originalPlay.apply(el, args);

    const c = getLevelerContext();
    const ready = c.state === 'running' ? Promise.resolve() : c.resume().catch(() => {});
    return ready.then(() => {
      // Only wire it if the context really runs; otherwise play normally (never silent)
      if (c.state === 'running') {
        try {
          c.createMediaElementSource(el).connect(input);
          wired.add(el);
        } catch { /* play normally */ }
      }
      return originalPlay.apply(el, args);
    });
  };
}