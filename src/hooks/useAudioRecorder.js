import { useState, useRef } from 'react';

const SPEECH_RMS = 0.015;     // a level above this means the user is speaking
const SILENCE_MS = 1500;      // silence after speech that ends the turn
const MIN_SPEECH_MS = 400;    // less speech than this is treated as noise
const MAX_TURN_MS = 60000;    // hard limit for one recording

// onAudioReady(base64)  -> called when the user finished speaking
// onNoSpeech()          -> called when nothing was said (so listening can restart)
export default function useAudioRecorder(onAudioReady, onNoSpeech) {
    const [isRecording, setIsRecording] = useState(false);
    const currentRef = useRef(null);   // the active recording { recorder, manual }
    const busyRef = useRef(false);     // true while a recording is starting or running
    const genRef = useRef(0);          // bumped by stopRecording to cancel a pending start

    // Always call the latest callbacks, never a stale copy
    const readyRef = useRef(onAudioReady);
    const noSpeechRef = useRef(onNoSpeech);
    readyRef.current = onAudioReady;
    noSpeechRef.current = onNoSpeech;

    const startRecording = async () => {
        if (busyRef.current) return;   // never run two recordings at once
        busyRef.current = true;
        const gen = genRef.current;
        let stream = null;
        let ctx = null;

        const release = () => {
            if (stream) stream.getTracks().forEach((t) => t.stop());
            if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {});
            busyRef.current = false;
        };

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true },
            });
            // The session was ended while we were waiting for the microphone
            if (gen !== genRef.current) { release(); return; }

            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            // On mobile the context can start suspended, which makes the level read zero
            if (ctx.state === 'suspended') await ctx.resume().catch(() => {});

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            ctx.createMediaStreamSource(stream).connect(analyser);
            const data = new Float32Array(analyser.fftSize);

            const cur = { recorder, manual: false };
            currentRef.current = cur;

            const chunks = [];
            let speechMs = 0;      // total time above the speech level
            let silentSince = 0;   // when the current silence began (0 = not silent)
            let hasSpoken = false;
            const startedAt = Date.now();
            let last = startedAt;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            // Poll the volume; the silence timer only runs after real speech was heard
            const timer = setInterval(() => {
                if (recorder.state !== 'recording') return;
                const now = Date.now();
                const dt = now - last;
                last = now;

                analyser.getFloatTimeDomainData(data);
                let sum = 0;
                for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
                const rms = Math.sqrt(sum / data.length);

                if (rms >= SPEECH_RMS) {
                    speechMs += dt;
                    silentSince = 0;
                    if (speechMs >= MIN_SPEECH_MS) hasSpoken = true;
                } else if (hasSpoken) {
                    if (!silentSince) silentSince = now;
                    if (now - silentSince >= SILENCE_MS) recorder.stop();
                }

                if (now - startedAt >= MAX_TURN_MS) recorder.stop();
            }, 50);

            recorder.onstop = () => {
                clearInterval(timer);
                currentRef.current = null;
                release();
                setIsRecording(false);

                if (!hasSpoken || chunks.length === 0) {
                    // Nothing was said: listen again instead of sending silence to Gemini
                    if (!cur.manual) noSpeechRef.current?.();
                    return;
                }

                const reader = new FileReader();
                reader.onloadend = () => readyRef.current(reader.result.split(',')[1]);
                reader.readAsDataURL(new Blob(chunks, { type: 'audio/webm' }));
            };

            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Microphone error:', err);
            release();
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        genRef.current++;
        const cur = currentRef.current;
        if (cur) {
            cur.manual = true;
            if (cur.recorder.state === 'recording') cur.recorder.stop();
        }
        setIsRecording(false);
    };

    return { isRecording, startRecording, stopRecording };
}