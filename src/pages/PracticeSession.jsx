import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faGear, faStopwatch, faCamera, faMicrophone, faPlay, faStop, faComments,
  faLightbulb, faSpinner, faVolumeHigh, faHourglassHalf, faCircleCheck, faWandMagicSparkles, 
  faKey,
} from '@fortawesome/free-solid-svg-icons';
import { useTTS } from '../hooks/useTTS';
import useAudioRecorder from '../hooks/useAudioRecorder';
import useGeminiLive from '../hooks/useGeminiLive';
import useGeminiModels from '../hooks/useGeminiModels';
import Dropdown from '../components/Dropdown';
import { LANGUAGES, PERSONAS, LEVELS, TYPES, VOICES } from '../lib/practiceOptions';
import { hasGeminiKey } from '../lib/apiKey';
import { addSession } from '../lib/sessions';

const labelOf = (list, value) => list.find((o) => o.value === value)?.label;
const fmt = (s) => `${String(Math.floor(Math.max(s, 0) / 60)).padStart(2, '0')}:${String(Math.max(s, 0) % 60).padStart(2, '0')}`;
const SAMPLE = { bn: 'হ্যালো, আমি তোমার স্পিকিং কোচ।', en: 'Hi, I am your speaking coach.' };
const TTS_RETRIES = 3;

const loadSavedVoices = () => {
    try { return { ...VOICES, ...JSON.parse(localStorage.getItem('dn_voices') || '{}') }; }
    catch { return { ...VOICES }; }
};

export default function PracticeSession() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const cfg = { language: 'en', type: 'interview', persona: 'software', level: 'medium', minutes: 10, ...(state || {}) };

    const [language, setLanguage] = useState(cfg.language);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(cfg.minutes * 60);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [voices, setVoices] = useState([]);
    const [voiceByLang, setVoiceByLang] = useState(loadSavedVoices);
    const hasKey = hasGeminiKey();
    const startedAtRef = useRef(0);
    const turnsRef = useRef(0);

    // Refs always hold the latest value, so async callbacks never read stale state
    const activeRef = useRef(false);
    const chatContainerRef = useRef(null);
    const settingsRef = useRef(null);

    const voice = voiceByLang[language];
    const voiceRef = useRef(voice);
    voiceRef.current = voice;

    const { models, model, setModel, loading: modelsLoading } = useGeminiModels();
    const { speak, stop: stopTTS, state: ttsState, getVoices } = useTTS({ voice: VOICES[language] });
    const { chatHistory, isThinking, analysisStatus, processAudio } = useGeminiLive(model);
    turnsRef.current = chatHistory.length;

    const handleAudioReady = (base64Audio) => {
        // Ignore audio that arrives after the session was ended
        if (!activeRef.current) return;
        processAudio(base64Audio, language, playAIResponse, restartListening);
    };

    const { isRecording, startRecording, stopRecording } = useAudioRecorder(handleAudioReady);

    // Speak the reply; retry on network errors (same behaviour as the deep.html prototype)
    const playAIResponse = async (text) => {
        const cleanText = text.replace(/[*_#`~]/g, '');
        for (let i = 0; i < TTS_RETRIES; i++) {
            if (!activeRef.current) return false;
            try {
                await speak(cleanText, { voice: voiceRef.current });
                return true;
            } catch (err) {
                console.error(`TTS attempt ${i + 1}/${TTS_RETRIES} failed:`, err);
                await new Promise((r) => setTimeout(r, 1500));
            }
        }
        return false;
    };

    const restartListening = () => {
        if (activeRef.current) startRecording();
    };

        const endSession = () => {
        // Log the finished session for the dashboard progress
        if (activeRef.current && turnsRef.current > 0) {
            addSession({
                startedAt: startedAtRef.current,
                durationSec: Math.round((Date.now() - startedAtRef.current) / 1000),
                language,
                type: cfg.type,
                persona: cfg.persona,
                level: cfg.level,
                turns: turnsRef.current,
            });
        }
        activeRef.current = false;
        setIsSessionActive(false);
        stopRecording();
        stopTTS();
    };

    const toggleSession = () => {
        if (isSessionActive) {
            endSession();
        } else {
            // Each user needs their own Gemini key
            if (!hasKey) {
                navigate('/settings');
                return;
            }
            activeRef.current = true;
            startedAtRef.current = Date.now();
            setSettingsOpen(false);
            setSecondsLeft(cfg.minutes * 60);
            setIsSessionActive(true);
            startRecording();
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

    // Countdown while a session is running; the session ends when time is up
    useEffect(() => {
        if (!isSessionActive) return;
        const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearInterval(id);
    }, [isSessionActive]);

    useEffect(() => {
        if (isSessionActive && secondsLeft <= 0) endSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [secondsLeft, isSessionActive]);

    // Release the microphone when leaving the page
    useEffect(() => () => {
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

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

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
                    <button onClick={() => navigate('/')} aria-label="Back to dashboard" className="rounded-lg px-2.5 py-2 text-gray-700 hover:bg-gray-100">
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
                        <FontAwesomeIcon icon={faStopwatch} className="text-xs" /> {fmt(secondsLeft)}
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
            <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-3 p-3 md:gap-5 md:p-6 lg:grid lg:grid-cols-5">
                {/* Camera placeholder (camera will be added later) */}
                <section className="relative h-[340px] shrink-0 overflow-hidden rounded-3xl border-4 border-gray-800 bg-gray-900 shadow-inner sm:h-[420px] lg:col-span-2 lg:h-full">
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
                        <FontAwesomeIcon icon={faCamera} className="text-4xl md:text-5xl" />
                        <p className="text-xs font-medium md:text-sm">Camera preview coming soon</p>
                    </div>

                    <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 backdrop-blur-md">
                        <span className={`h-2 w-2 rounded-full ${isSessionActive ? 'animate-pulse bg-red-500' : 'bg-gray-400'}`} />
                        <span className="text-[11px] font-medium text-white md:text-xs">{isSessionActive ? 'Live Session' : 'Camera Preview'}</span>
                    </div>

                    <div className="absolute bottom-3 left-1/2 w-max max-w-[90%] -translate-x-1/2 rounded-full border border-white/20 bg-black/60 px-4 py-2 shadow-lg backdrop-blur-md md:bottom-5">
                        <span className="flex items-center gap-2.5 truncate text-xs font-medium text-white md:text-sm">
                            <FontAwesomeIcon icon={status.icon} spin={!!status.spin} />
                            {status.text}
                        </span>
                    </div>
                </section>

                {/* Transcript */}
                <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm lg:col-span-3">
                    <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 md:text-base">
                            <FontAwesomeIcon icon={faComments} className="text-gray-500" /> Transcript
                        </h3>
                        {analysisStatus && <span className="max-w-[55%] truncate rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600">{analysisStatus}</span>}
                    </div>

                    <div ref={chatContainerRef} className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gray-50/60 p-3 md:p-5">
                        {chatHistory.length === 0 && (
                            <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
                                <FontAwesomeIcon icon={faWandMagicSparkles} className="text-4xl opacity-60" />
                                <p className="text-sm font-medium">Start the conversation</p>
                            </div>
                        )}

                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex w-full ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.type === 'user' ? (
                                    <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-blue-600 p-3 text-white shadow-md md:max-w-[80%]">
                                        <span className="text-sm leading-relaxed md:text-[15px]">{msg.text}</span>
                                        {msg.feedback && (
                                            <div className="mt-2 rounded-lg bg-blue-700/50 p-2 text-xs md:text-sm">
                                                <strong className="text-blue-200"><FontAwesomeIcon icon={faLightbulb} className="mr-1.5" />Tip:</strong> {msg.feedback}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-gray-200 bg-white p-3 text-gray-800 shadow-sm md:max-w-[80%]">
                                        <strong className="mb-1 block text-[10px] uppercase tracking-wider text-blue-600 md:text-xs">AI Coach</strong>
                                        <span className="text-sm leading-relaxed md:text-[15px]">{msg.text}</span>
                                    </div>
                                )}
                            </div>
                        ))}
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
        </div>
    );
}