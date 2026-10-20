import { useState, useRef } from 'react';
import { callGemini, parseJson } from '../lib/gemini';
import { getGeminiKey } from '../lib/apiKey';
import { measureSpeechSeconds } from '../lib/audioStats';

export default function useGeminiLive(model, systemPrompt) {
    const [caption, setCaption] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    const modelRef = useRef(model);
    modelRef.current = model;
    const promptRef = useRef(systemPrompt);
    promptRef.current = systemPrompt;

    const apiHistory = useRef([]);   // context sent to Gemini
    const turns = useRef([]);        // saved for history + analysis
    const seq = useRef(0);

    // Priority: the fast reply goes first; transcription jobs wait in a queue
    const fastBusy = useRef(false);
    const queue = useRef([]);
    const pumping = useRef(false);
    const jobs = useRef(new Set());

    const pump = async () => {
        if (pumping.current) return;
        pumping.current = true;
        while (queue.current.length && !fastBusy.current) {
            await queue.current.shift()();
        }
        pumping.current = false;
    };

    const enqueue = (fn) => {
        const p = new Promise((resolve) => {
            queue.current.push(async () => { try { await fn(); } finally { resolve(); } });
        });
        jobs.current.add(p);
        p.then(() => jobs.current.delete(p));
        pump();
    };

    // Wait until all pending transcriptions are done (call when the session ends)
    const flush = () => Promise.allSettled([...jobs.current]);

    const transcribe = async (turn, base64Audio, language) => {
        const langName = language === 'bn' ? 'Bengali (write it in Bengali script)' : 'English';
        const prompt = `Listen to the audio (${langName}). Return ONLY JSON: {"transcript":"exact words spoken, including filler words","fillers":["every filler word or sound you heard, e.g. um, uh, ah, hmm, মানে, আসলে, ইয়ে"],"feedback":"one short grammar or fluency tip in ${language === 'bn' ? 'Bengali' : 'English'}"}`;
        try {
            const raw = await callGemini(modelRef.current, {
                contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: 'audio/webm', data: base64Audio } }] }],
                generationConfig: { responseMimeType: 'application/json' },
            });
            const p = parseJson(raw);
            turn.userText = (p.transcript || '').trim();
            turn.feedback = p.feedback || '';
            turn.fillers = Array.isArray(p.fillers) ? p.fillers : [];
            turn.words = turn.userText ? turn.userText.split(/\s+/).length : 0;
            turn.speechSec = await measureSpeechSeconds(base64Audio);

            // Replace the audio in the context with its text: later requests get smaller and faster
            const entry = apiHistory.current.find((e) => e.turnId === turn.id);
            if (entry && turn.userText) entry.parts = [{ text: turn.userText }];
        } catch (err) {
            console.error('Transcription failed:', err);
        }
    };

    const processAudio = (base64Audio, language, playTTS, restartMic) => {
        if (!getGeminiKey() || !modelRef.current) {
            console.error('Gemini key or model is missing');
            return;
        }
        const turn = { id: ++seq.current, time: Date.now(), userText: '', feedback: '', fillers: [], words: 0, speechSec: 0, aiText: '' };
        turns.current.push(turn);

        fastBusy.current = true;                                // block the queue first
        enqueue(() => transcribe(turn, base64Audio, language)); // runs after the reply arrives
        fastReply(turn, base64Audio, playTTS, restartMic);
    };

    const fastReply = async (turn, base64Audio, playTTS, restartMic) => {
        setIsThinking(true);
        const userEntry = { role: 'user', parts: [{ inlineData: { mimeType: 'audio/webm', data: base64Audio } }], turnId: turn.id };
        try {
            const text = await callGemini(modelRef.current, {
                systemInstruction: { parts: [{ text: promptRef.current }] },
                contents: [...apiHistory.current, userEntry].map(({ role, parts }) => ({ role, parts })),
            });
            turn.aiText = text;
            apiHistory.current.push(userEntry, { role: 'model', parts: [{ text }] });
            setCaption(text);
            setIsThinking(false);
            fastBusy.current = false;
            pump();                                  // transcription starts now, while TTS plays

            const ok = await playTTS(text);
            if (restartMic) {
                if (ok) restartMic();
                else setTimeout(restartMic, 2000);
            }
        } catch (err) {
            console.error('Fast reply error:', err);
            setIsThinking(false);
            fastBusy.current = false;
            pump();
            if (restartMic) setTimeout(restartMic, 3000);
        }
    };

    const getTurns = () => turns.current.map((t) => ({ ...t }));
    const liveTurns = () => turns.current;   // the real array of this session (reset() makes a new one)

    const reset = () => {
        apiHistory.current = [];
        turns.current = [];
        setCaption('');
        setIsThinking(false);
    };

    return { caption, isThinking, processAudio, getTurns, liveTurns, flush, reset };
}