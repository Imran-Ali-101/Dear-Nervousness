import { useEffect, useRef, useState } from 'react';
import { createAggregator, readFrame } from '../lib/faceMetrics';

// Must equal the installed version (npm ls @mediapipe/tasks-vision)
const MP_VERSION = '1.1.1';
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const EST_WASM = 12.9e6;    // bytes (only used to draw the progress bar)
const EST_MODEL = 3.7e6;
const STALL_MS = 25000;     // no new data for this long = the download failed
const FRAME_MS = 100;       // about 10 analysed frames per second
// If the app gets stuck AFTER 100%, set this to false (then only the model shows progress)
const DOWNLOAD_WASM_MYSELF = true;
// Set to true while tuning: shows raw numbers on the camera view
const DEBUG = false;

// ---- download progress, shared by the whole app ----
let progressNow = 0;
const listeners = new Set();
const emit = (p) => { progressNow = p; listeners.forEach((f) => f(p)); };

const readChunk = (reader) => new Promise((resolve, reject) => {
  const id = setTimeout(() => reject(new Error('Download stalled')), STALL_MS);
  reader.read().then(
    (r) => { clearTimeout(id); resolve(r); },
    (e) => { clearTimeout(id); reject(e); },
  );
});

// Downloads a file and reports progress from 0 to 1
async function download(url, estimate, onFraction) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  // Content-Length can only be trusted when the file is not compressed on the way
  const header = res.headers.get('content-encoding') ? 0 : Number(res.headers.get('content-length'));
  const size = header || estimate;
  const reader = res.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await readChunk(reader);
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onFraction(Math.min(0.99, loaded / size));
  }
  onFraction(1);
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
  return bytes;
}

let landmarkerPromise = null;
const loadLandmarker = () => {
  if (!landmarkerPromise) {
    emit(0);
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(WASM);

      let wasmFrac = 0;
      let modelFrac = 0;
      const report = () => emit(Math.min(99, Math.round(
        ((wasmFrac * EST_WASM + modelFrac * EST_MODEL) / (EST_WASM + EST_MODEL)) * 100,
      )));

      // The big WASM file is downloaded here (not by MediaPipe) so we can show real progress
      const wasmJob = DOWNLOAD_WASM_MYSELF && typeof fileset.wasmBinaryPath === 'string'
        ? download(fileset.wasmBinaryPath, EST_WASM, (f) => { wasmFrac = f; report(); })
            .then((bytes) => {
              fileset.wasmBinaryPath = URL.createObjectURL(new Blob([bytes], { type: 'application/wasm' }));
            })
        : Promise.resolve();
      const modelJob = download(MODEL, EST_MODEL, (f) => { modelFrac = f; report(); });
      const [, modelBytes] = await Promise.all([wasmJob, modelJob]);

      const options = (delegate) => ({
        baseOptions: { modelAssetBuffer: modelBytes.slice(), delegate },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
      });
      let lm;
      try { lm = await FaceLandmarker.createFromOptions(fileset, options('GPU')); }
      catch { lm = await FaceLandmarker.createFromOptions(fileset, options('CPU')); }
      emit(100);
      return lm;
    })().catch((e) => { landmarkerPromise = null; throw e; });
  }
  return landmarkerPromise;
};

// load  = start downloading the model (camera starting or on)
// cameraOn / active = analyse frames only while the camera is on and a session runs
export default function useFaceAnalysis({ videoRef, cameraOn, load, active }) {
  const aggRef = useRef(createAggregator());
  const landmarkerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState(progressNow);
  const [live, setLive] = useState({ face: false, eye: false, raw: null });

  useEffect(() => {
    listeners.add(setProgress);
    return () => { listeners.delete(setProgress); };
  }, []);

  // 1) Download + start the model
  useEffect(() => {
    if (!load || landmarkerRef.current) return;
    loadLandmarker()
      .then((lm) => { landmarkerRef.current = lm; setReady(true); })
      .catch((e) => { console.error('Face model failed to load:', e); setError(true); });
  }, [load, attempt]);

  // 2) Analyse frames only while a session is running
  useEffect(() => {
    if (!active || !cameraOn || !ready) return;
    let timer;
    let lastVideoTime = -1;
    let lastLive = 0;

    const tick = () => {
      const video = videoRef.current;
      const lm = landmarkerRef.current;
      if (video && lm && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        try {
          const now = performance.now();
          const frame = readFrame(lm.detectForVideo(video, now));
          aggRef.current.add(frame, now);
          if (now - lastLive > 500) {
            lastLive = now;
            setLive({ face: !!frame, eye: !!frame?.eye, raw: frame?.raw || null });
          }
        } catch (e) {
          console.error('Face analysis frame failed:', e);
        }
      }
      timer = setTimeout(tick, FRAME_MS);
    };
    tick();
    return () => clearTimeout(timer);
  }, [active, cameraOn, ready, videoRef]);

  return {
    ready,
    error,
    progress,
    live,
    debug: DEBUG,
    retry: () => { setError(false); setAttempt((a) => a + 1); },
    reset: () => aggRef.current.reset(),
    getVisual: () => aggRef.current.summary(),
  };
}