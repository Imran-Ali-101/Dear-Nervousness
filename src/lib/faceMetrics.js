// Turns MediaPipe face results into simple numbers and averages them over a session.
// Every threshold below is a FIRST ESTIMATE: tune it with real tests on your phone.
export const T = {
  EYE_H_MAX: 0.35,         // sideways eye movement allowed (0 = straight)
  EYE_V_MAX: 0.45,         // up/down eye movement allowed
  YAW_DEV_MAX: 0.12,       // how far the head may turn away from the camera
  SMILE_ON: 0.35,          // smile strength that counts as "smiling"
  FRAME_X: [0.3, 0.7],     // nose must stay in this part of the frame (left to right)
  FACE_W: [0.22, 0.7],     // face width as a share of the frame (not too far, not too close)
  STEADY_SPEED_MAX: 0.6,   // head speed (face-widths per second) that gives a 0 steadiness score
  MIN_FACE_FRAMES: 30,     // need about 3 seconds of face data to score at all
  MIN_VISIBLE: 0.4,        // face must be visible in at least 40% of the frames
};

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const pct = (v) => Math.round(clamp(v) * 100);
const n = (v) => v || 0;

// One video frame -> numbers (null when no face was found)
export function readFrame(result) {
  const lm = result?.faceLandmarks?.[0];
  const cats = result?.faceBlendshapes?.[0]?.categories;
  if (!lm || !cats) return null;

  const b = {};
  for (const c of cats) b[c.categoryName] = c.score;

  const nose = lm[1], a = lm[234], z = lm[454];
  if (!nose || !a || !z) return null;
  const minX = Math.min(a.x, z.x), maxX = Math.max(a.x, z.x);
  const width = maxX - minX;
  if (width <= 0) return null;

  const yawDev = Math.abs((nose.x - minX) / width - 0.5);
  const h = (n(b.eyeLookInLeft) + n(b.eyeLookOutLeft) + n(b.eyeLookInRight) + n(b.eyeLookOutRight)) / 2;
  const v = (n(b.eyeLookUpLeft) + n(b.eyeLookDownLeft) + n(b.eyeLookUpRight) + n(b.eyeLookDownRight)) / 2;
  const smile = (n(b.mouthSmileLeft) + n(b.mouthSmileRight)) / 2;

  return {
    eye: yawDev <= T.YAW_DEV_MAX && h <= T.EYE_H_MAX && v <= T.EYE_V_MAX,
    smile: smile >= T.SMILE_ON,
    framed: nose.x >= T.FRAME_X[0] && nose.x <= T.FRAME_X[1] && width >= T.FACE_W[0] && width <= T.FACE_W[1],
    pos: { x: nose.x, y: nose.y, w: width },
    raw: { yawDev, h, v, smile, width },
  };
}

export function createAggregator() {
  let s;
  const reset = () => { s = { frames: 0, face: 0, eye: 0, smile: 0, framed: 0, speedSum: 0, speedN: 0, last: null }; };
  reset();

  // t = time of the frame in milliseconds
  const add = (frame, t) => {
    s.frames++;
    if (!frame) { s.last = null; return; }
    s.face++;
    if (frame.eye) s.eye++;
    if (frame.smile) s.smile++;
    if (frame.framed) s.framed++;
    if (s.last) {
      const dt = (t - s.last.t) / 1000;
      if (dt > 0 && dt < 1) {
        const d = Math.hypot(frame.pos.x - s.last.pos.x, frame.pos.y - s.last.pos.y) / frame.pos.w;
        s.speedSum += d / dt;
        s.speedN++;
      }
    }
    s.last = { pos: frame.pos, t };
  };

  // null = camera was not analysed; { lowVisibility } = face seen too rarely to score
  const summary = () => {
    if (!s.frames) return null;
    const visible = s.face / s.frames;
    if (s.face < T.MIN_FACE_FRAMES || visible < T.MIN_VISIBLE) {
      return { lowVisibility: true, faceVisible: pct(visible) };
    }
    const eyeContact = s.eye / s.face;
    const smile = s.smile / s.face;
    const framing = s.framed / s.face;
    const steadiness = 1 - clamp((s.speedN ? s.speedSum / s.speedN : 0) / T.STEADY_SPEED_MAX);

    // Looking away to think is natural, and nobody smiles all the time:
    // 70% eye contact and 25% smile time already count as full marks.
    const presence = 0.4 * clamp(eyeContact / 0.7) + 0.2 * clamp(smile / 0.25) + 0.2 * steadiness + 0.2 * framing;

    return {
      presence: pct(presence),
      eyeContact: pct(eyeContact),
      smile: pct(smile),
      steadiness: pct(steadiness),
      framing: pct(framing),
      faceVisible: pct(visible),
    };
  };

  return { reset, add, summary };
}