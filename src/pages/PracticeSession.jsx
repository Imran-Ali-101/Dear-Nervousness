import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faGear, faStopwatch, faCamera, faMicrophone, faPlay, 
  faStop, faSpinner, faVolumeHigh, faHourglassHalf, faCircleCheck, 
  faKey,
} from '@fortawesome/free-solid-svg-icons';
import { useTTS } from '../hooks/useTTS';
import useAudioRecorder from '../hooks/useAudioRecorder';
import useGeminiLive from '../hooks/useGeminiLive';
import useGeminiModels from '../hooks/useGeminiModels';
import Dropdown from '../components/Dropdown';
import { LANGUAGES, PERSONAS, LEVELS, TYPES, VOICES } from '../lib/practiceOptions';
import { hasGeminiKey } from '../lib/apiKey';
import { addSession, updateSession, runAnalysis } from '../lib/sessions';
import { useAuth } from '../hooks/useAuth';
import { getDisplayName } from '../lib/profile';
import { buildPrompt, buildGreeting, dayPart } from '../lib/prompts';
import { callGemini } from '../lib/gemini';
import useCamera from '../hooks/useCamera';
import CameraConsent from '../components/CameraConsent';
import { hasCameraConsent, giveCameraConsent } from '../lib/cameraConsent';
import useFaceAnalysis from '../hooks/useFaceAnalysis';
import FaceLoadingDialog from '../components/FaceLoadingDialog';
import { finishGame } from '../lib/game';

const labelOf = (list, value) => list.find((o) => o.value === value)?.label;
const fmt = (s) => `${String(Math.floor(Math.max(s, 0) / 60)).padStart(2, '0')}:${String(Math.max(s, 0) % 60).padStart(2, '0')}`;
const SAMPLE = { bn: 'হ্যালো, আমি তোমার স্পিকিং কোচ।', en: 'Hi, I am your speaking coach.' };

const EDGE_TIMEOUT_MS = 6000;     // এক চেষ্টায় voice এতক্ষণ loading-এ থাকতে পারবে
const MAX_RETRIES = 3;            // একই voice সর্বোচ্চ কতবার চেষ্টা হবে
const RETRY_DELAY_MS = 600;       // দুই চেষ্টার মাঝে বিরতি

// Reject if a promise takes longer than the given time
const withTimeout = (p, ms) => Promise.race([
    p,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
]);

const loadSavedVoices = () => {
    try { return { ...VOICES, ...JSON.parse(localStorage.getItem('dn_voices') || '{}') }; }
    catch { return { ...VOICES }; }
};

export default function PracticeSession() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const cfg = { language: 'en', type: 'interview', persona: 'software', level: 'medium', minutes: 10, customPersona: '', customPrompt: '', ...(state || {}) };

    const [language, setLanguage] = useState(cfg.language);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(cfg.minutes * 60);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    const { videoRef, status: camStatus, start: startCamera, stop: stopCamera } = useCamera();
    const camLoading = camStatus === 'starting' || camStatus === 'on';
    const {
        ready: faceReady,
        error: faceError,
        progress: faceProgress,
        live: faceLive,
        debug: faceDebug,
        retry: retryFace,
        reset: resetFace,
        getVisual,
    } = useFaceAnalysis({ videoRef, cameraOn: camStatus === 'on', load: camLoading, active: isSessionActive });
    
    const [faceHidden, setFaceHidden] = useState(false);
    const showFaceDialog = camLoading && !isSessionActive && !faceHidden && (!faceReady || faceError);
    
    const [consentOpen, setConsentOpen] = useState(false); 
    const turnOnCamera = () => {
        if (hasCameraConsent()) {
            setFaceHidden(false);
            startCamera();   // already agreed once
        }
        else setConsentOpen(true);               // first time: explain first
    };
    const acceptConsent = () => {
        giveCameraConsent();
        setConsentOpen(false);
        setFaceHidden(false);
        startCamera();
    };
    
    const [voices, setVoices] = useState([]);
    const [voiceByLang, setVoiceByLang] = useState(loadSavedVoices);
    const hasKey = hasGeminiKey();
    const { user } = useAuth();
    const [greeting, setGreeting] = useState('');
    const userName = getDisplayName(user);
    const startedAtRef = useRef(0);
    // Refs always hold the latest value, so async callbacks never read stale state

    const activeRef = useRef(false);
    const settingsRef = useRef(null);

    const voice = voiceByLang[language];
    const voiceRef = useRef(voice);
    voiceRef.current = voice;

    const { models, model, setModel, loading: modelsLoading } = useGeminiModels();
    const { speak, stop: stopTTS, state: ttsState, getVoices } = useTTS({ voice: VOICES[language] });
    
    const ttsStateRef = useRef('idle');
    ttsStateRef.current = ttsState;
    
    const systemPrompt = buildPrompt({ ...cfg, language, userName, greeting });
    const { caption, isThinking, processAudio, liveTurns, flush, reset } = useGeminiLive(model, systemPrompt);
    
    const handleAudioReady = (base64Audio) => {
        // Ignore audio that arrives after the session was ended
        if (!activeRef.current) return;
        processAudio(base64Audio, language, playAIResponse, restartListening);
    };

    const { isRecording, startRecording, stopRecording } = useAudioRecorder(handleAudioReady, () => restartListening());

    // One Edge voice with a watchdog: if it is still "loading" after the timeout, give up on it
    const speakEdge = (text, voiceName) => new Promise((resolve, reject) => {
        let settled = false;
        const finish = (fn, value) => {
            if (settled) return;
            settled = true;
            clearTimeout(watchdog);
            fn(value);
        };
        const watchdog = setTimeout(() => {
            if (ttsStateRef.current === 'loading') {
                stopTTS();   // a late answer from the stuck request will be ignored
                finish(reject, new Error('Edge TTS timed out'));
            }
        }, EDGE_TIMEOUT_MS);
        speak(text, { voice: voiceName }).then((r) => finish(resolve, r), (e) => finish(reject, e));
    });
    
    // Speak the reply; when a voice fails, switch to the next voice from the list
        // Speak the reply with the selected voice; if it fails, retry the SAME voice
    const playAIResponse = async (text) => {
        const cleanText = text.replace(/[*_#`~]/g, '');

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            if (!activeRef.current) return false;   // session ended meanwhile
            try {
                await speakEdge(cleanText, voiceRef.current);
                return true;
            } catch (err) {
                console.error(`Edge voice attempt ${attempt}/${MAX_RETRIES} failed:`, err);
                if (attempt < MAX_RETRIES) {
                    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
                }
            }
        }
        return false;   // all retries failed: the caller restarts the mic so the user can still talk
    };

    const restartListening = () => {
        if (activeRef.current) startRecording();
    };

    // The AI speaks first: greet the user by name in its own role, then start listening
    const greetUser = async () => {
        const first = (userName || '').trim().split(/\s+/)[0];
        let text = '';
        try {
            if (model) {
                const part = dayPart();
                const who = first
                    ? `Open with a formal greeting such as "Good ${part}, ${first}" in the reply language (never "hello" or "hi")`
                    : `Open with a formal greeting such as "Good ${part}" in the reply language (never "hello" or "hi")`;
                text = await withTimeout(callGemini(model, {
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ role: 'user', parts: [{ text: `The session starts now. ${who}, introduce yourself in your role in one short sentence, then ask your first question. Plain text only, 3 short sentences at most.` }] }],
                }), 6000);
            }
        } catch (err) {
            console.error('Greeting failed, using the template:', err);
        }
    
        if (!activeRef.current) return;   // the session was ended while waiting
        if (!text) text = buildGreeting({ name: userName, language, type: cfg.type, persona: cfg.persona });
    
        setGreeting(text);

        // Save the greeting as the first turn so it shows in History. The 'greeting' flag marks it.
        liveTurns().push({
            id: 0, greeting: true, time: Date.now(),
            userText: '', feedback: '', fillers: [], words: 0,
            speechSec: 0, shortPauses: 0, longPauses: 0, pauseSec: 0, longestPauseSec: 0,
            aiText: text,
        });
        
        const ok = await playAIResponse(text);
        if (ok) restartListening();
        else setTimeout(restartListening, 1500);   // TTS failed: still let the user talk
    };

    const endSession = () => {
        if (!activeRef.current) return;
        const startedAt = startedAtRef.current;
        const live = liveTurns();            // this session's turns
        activeRef.current = false;
        setIsSessionActive(false);
        stopRecording();
        stopTTS();
        
        if (!live.some((t) => !t.greeting)) {
            setSaveStatus('No speech was recorded, so there is no report this time.');
            setTimeout(() => setSaveStatus(''), 4000);
            return;
        }
    
        const snapshot = () => live.map((t) => ({ ...t }));

        const visual = getVisual();
        // 1) Save right away, so nothing is lost
        addSession({
            startedAt,
            durationSec: Math.round((Date.now() - startedAt) / 1000),
            language,
            type: cfg.type,
            persona: cfg.persona,
            level: cfg.level,
            turns: snapshot(),
        });
        if (visual) updateSession(startedAt, { analysis: { visual } });
        setSaveStatus('Saved ✓ Analyzing in background...');
        setTimeout(() => setSaveStatus(''), 3000);
    
        // 2) Finish in the background: last transcripts first, then the analysis
        (async () => {
            await flush();
            const turns = snapshot();
            updateSession(startedAt, { turns });
            if (cfg.game) await finishGame({ startedAt, game: cfg.game, model, turns });
            await runAnalysis(startedAt, { model, language, turns, visual });
        })();
    };

    const endRef = useRef(null);
    endRef.current = endSession;

    const toggleSession = () => {
        if (isSessionActive) {
            const startedAt = startedAtRef.current;
            const hadTurns = liveTurns().some((t) => !t.greeting);
            endSession();
            if (hadTurns) navigate(cfg.game ? `/game/result/${startedAt}` : `/report/${startedAt}`);
        } else {
            resetFace();
            // Each user needs their own Gemini key
            if (!hasKey) {
                navigate('/settings');
                return;
            }
            reset();
            setGreeting('');
            setSaveStatus('');
            activeRef.current = true;
            startedAtRef.current = Date.now();
            setSettingsOpen(false);
            setSecondsLeft(cfg.minutes * 60);
            setIsSessionActive(true);
            greetUser();
        }
    };

    const chooseVoice = (name) => {
        setVoiceByLang((prev) => {
            const next = { ...prev, [language]: name };
            try { localStorage.setItem('dn_voices', JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    };

    const previewVoice = async () => {
        stopTTS();
        try { await speak(SAMPLE[language], { voice }); } catch (err) { console.error('Voice preview failed:', err); }
    };

    // Load the available voices once
    useEffect(() => {
        getVoices().then(setVoices).catch(() => setVoices([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

        // Countdown: calculated from the start time, so it never drifts
        useEffect(() => {
            if (!isSessionActive) return;
            const tick = () =>
                setSecondsLeft(cfg.minutes * 60 - Math.floor((Date.now() - startedAtRef.current) / 1000));
            tick();
            const id = setInterval(tick, 1000);
            return () => clearInterval(id);
        }, [isSessionActive, cfg.minutes]);

    // Leaving the page: save a running session first, then release the microphone
    useEffect(() => () => {
        endRef.current?.();
        activeRef.current = false;
        stopRecording();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Close the settings panel when clicking outside it
    useEffect(() => {
        const onDown = (e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    // Voice options filtered by the selected language
    const voiceOptions = voices
        .filter((v) => v.locale?.toLowerCase().startsWith(language))
        .map((v) => ({
            value: v.name,
            label: `${v.name.split('-')[2]?.replace('Neural', '') || v.name} · ${v.gender} · ${v.locale}`,
        }));
    if (!voiceOptions.some((o) => o.value === voice)) voiceOptions.unshift({ value: voice, label: voice });

    // Status shown on the camera placeholder
    const live = isSessionActive;
    const status = live && isThinking
        ? { icon: faSpinner, spin: true, text: 'Thinking...' }
        : live && ttsState === 'speaking'
        ? { icon: faVolumeHigh, text: 'AI is speaking...' }
        : live && isRecording
        ? { icon: faMicrophone, text: 'Listening...' }
        : live
        ? { icon: faHourglassHalf, text: 'Getting ready...' }
        : { icon: faCircleCheck, text: 'Ready' };

    const typeTitle = TYPES.find((t) => t.value === cfg.type)?.title;

    return (
        <div className="flex h-[100dvh] flex-col bg-[#f6f8fc] text-[#1b1f24]">
            {/* Header */}
            <header className="relative z-30 shrink-0 border-b border-gray-200 bg-white px-3 py-2.5 md:px-6 md:py-3">
                <div className="mx-auto flex max-w-6xl items-center gap-2 md:gap-4">
                    <button onClick={() => navigate('/dashboard')} aria-label="Back to dashboard" className="rounded-lg px-2.5 py-2 text-gray-700 hover:bg-gray-100">
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <img src="/logo.svg" alt="" className="h-8 w-8 object-contain" />
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-sm font-bold text-gray-900 md:text-lg">Dear <span className="text-blue-600">Nervousness</span></h1>
                        <p className="truncate text-[11px] text-gray-500 md:text-xs">
                            {typeTitle} · {labelOf(PERSONAS, cfg.persona)} · {labelOf(LEVELS, cfg.level)}
                        </p>
                    </div>
                    <span className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-mono text-sm font-bold tabular-nums ${isSessionActive && secondsLeft <= 30 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
                        <FontAwesomeIcon icon={faStopwatch} className="text-xs" /> {secondsLeft < 0 ? `+${fmt(-secondsLeft)}` : fmt(secondsLeft)}
                    </span>

                    {/* Settings: language, AI model, voice */}
                    <div ref={settingsRef} className="relative">
                        <button
                            onClick={() => setSettingsOpen((o) => !o)}
                            aria-expanded={settingsOpen}
                            aria-label="Settings"
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${settingsOpen ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            <FontAwesomeIcon icon={faGear} /> <span className="hidden md:inline">Settings</span>
                        </button>

                        {settingsOpen && (
                            <div className="anim-pop absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
                                {isSessionActive && (
                                    <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">End the session to change these settings.</p>
                                )}

                                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Language</p>
                                <Dropdown value={language} options={LANGUAGES} onChange={setLanguage} disabled={isSessionActive} />

                                <p className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">AI Model</p>
                                <Dropdown
                                    value={model}
                                    options={models.length ? models : [{ value: '', label: modelsLoading ? 'Loading models...' : 'No models' }]}
                                    onChange={setModel}
                                    disabled={isSessionActive || modelsLoading}
                                />

                                <p className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Voice</p>
                                <div className="flex items-center gap-2">
                                    <Dropdown value={voice} options={voiceOptions} onChange={chooseVoice} disabled={isSessionActive} className="min-w-0 flex-1" />
                                    <button
                                        onClick={previewVoice}
                                        disabled={isSessionActive}
                                        aria-label="Preview voice"
                                        className="shrink-0 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <FontAwesomeIcon icon={faPlay} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Body */}
            <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col p-3 md:p-6">
                <section className="relative min-h-0 flex-1 overflow-hidden rounded-3xl border-4 border-gray-800 bg-gray-900 shadow-inner">
                    {/* Mirrored like a selfie; always mounted so the stream can attach */}
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ transform: 'scaleX(-1)' }}
                        className={`absolute inset-0 h-full w-full object-cover ${camStatus === 'on' ? '' : 'opacity-0'}`}
                    />
                    
                    {camStatus !== 'on' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-gray-400">
                            <FontAwesomeIcon icon={camStatus === 'starting' ? faSpinner : faCamera} spin={camStatus === 'starting'} className="text-4xl md:text-5xl" />
                            <p className="text-xs font-medium md:text-sm">
                                {camStatus === 'denied' ? 'Camera access was blocked. Allow it in your browser settings and try again.'
                                    : camStatus === 'error' ? 'Could not start the camera on this device.'
                                    : 'The camera is optional. Turn it on to get presence scores.'}
                            </p>
                            {camStatus !== 'starting' && (
                                <button onClick={turnOnCamera} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">Turn on camera</button>
                            )}
                        </div>
                    )}
                    
                    {camStatus === 'on' && (
                        <button onClick={stopCamera} className="absolute right-3 top-14 rounded-lg bg-black/50 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md hover:bg-black/70">Turn off camera</button>
                    )}

                    {/* Camera detect */}
                    {isSessionActive && camStatus === 'on' && (
                        <span className="absolute left-3 top-14 rounded-lg bg-black/50 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
                            {faceError ? 'Face analysis unavailable'
                                : !faceReady ? `Loading face analysis… ${faceProgress}%`
                                : !faceLive.face ? 'Face not visible'
                                : faceLive.eye ? '● Eye contact'
                                : '○ Look at the camera'}
                        </span>
                    )}
                    {faceDebug && isSessionActive && faceLive.raw && (
                        <span className="absolute left-3 top-24 rounded-lg bg-black/60 px-2 py-1 font-mono text-[10px] text-white">
                            yaw {faceLive.raw.yawDev.toFixed(2)} h {faceLive.raw.h.toFixed(2)} v {faceLive.raw.v.toFixed(2)} smile {faceLive.raw.smile.toFixed(2)} w {faceLive.raw.width.toFixed(2)}
                        </span>
                    )}
            
                    <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 backdrop-blur-md">
                        <span className={`h-2 w-2 rounded-full ${isSessionActive ? 'animate-pulse bg-red-500' : 'bg-gray-400'}`} />
                        <span className="text-[11px] font-medium text-white md:text-xs">{isSessionActive ? 'Live Session' : 'Camera Preview'}</span>
                    </div>
            
                    {saveStatus && (
                        <span className="absolute right-3 top-3 rounded-lg bg-black/50 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">{saveStatus}</span>
                    )}
            
                    {/* Caption: only what the AI says */}
                    {(caption || greeting) && (
                        <div className="absolute inset-x-3 bottom-16 max-h-24 overflow-y-auto rounded-xl bg-black/60 px-3 py-2 text-center text-xs leading-snug text-white backdrop-blur-md md:bottom-20 md:text-sm">
                            {caption || greeting}
                        </div>
                    )}
            
                    <div className="absolute bottom-3 left-1/2 w-max max-w-[90%] -translate-x-1/2 rounded-full border border-white/20 bg-black/60 px-4 py-2 shadow-lg backdrop-blur-md md:bottom-5">
                        <span className="flex items-center gap-2.5 truncate text-xs font-medium text-white md:text-sm">
                            <FontAwesomeIcon icon={status.icon} spin={!!status.spin} />
                            {status.text}
                        </span>
                    </div>
                </section>
            </main>

            {/* Action button */}
            <footer className="shrink-0 border-t border-gray-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-4">
                <div className="mx-auto max-w-6xl">
                    <button
                        onClick={toggleSession}
                        className={`flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-base font-bold text-white shadow-lg transition active:scale-[0.99] md:py-4 md:text-lg ${
                            isSessionActive ? 'bg-red-500 shadow-red-500/30 hover:bg-red-600' : 'bg-blue-600 shadow-blue-600/30 hover:bg-blue-700'
                        }`}
                    >
                        <FontAwesomeIcon icon={isSessionActive ? faStop : hasKey ? faPlay : faKey} className="text-sm" />
                        {isSessionActive ? 'End Practice Session' : hasKey ? 'Start Conversation' : 'Add API Key to Start'}
                    </button>
                </div>
            </footer>
            <CameraConsent open={consentOpen} onAccept={acceptConsent} onCancel={() => setConsentOpen(false)} />
            <FaceLoadingDialog
                open={showFaceDialog}
                progress={faceProgress}
                error={faceError}
                onHide={() => setFaceHidden(true)}
                onRetry={() => { setFaceHidden(false); retryFace(); }}
            />
        </div>
    );
}