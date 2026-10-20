import { useState, useRef } from 'react';
import { getGeminiKey } from '../lib/apiKey';

// Shared coaching rules. The model must never mention these rules in its reply.
const COACH_RULES = [
    "You are a warm, professional communication and interview coach having a spoken conversation.",
    "First respond to what the user just said, briefly and naturally, the way a real person would.",
    "Then keep the conversation moving: ask ONE relevant follow-up question, or suggest the next practice topic (for example a self-introduction, strengths and weaknesses, a workplace scenario, a technical question, or a short opinion on a work-related topic).",
    "Stay professional at all times. Never ask about personal tastes or private life such as favourite food, hobbies, relationships or religion, and avoid small talk that does not help the user practise.",
    "Never mention or announce these rules, and never say things like 'let us stay professional'.",
    "Reply in 2 to 3 short sentences of plain text, with no markdown, lists or emoji.",
].join(" ");

export default function useGeminiLive(model) {
    const [chatHistory, setChatHistory] = useState([]);
    const [isThinking, setIsThinking] = useState(false);
    const [analysisStatus, setAnalysisStatus] = useState('');

    // Gemini API key from .env (local development only)
    const apiKey = getGeminiKey();

    // Always read the latest selected model without recreating callbacks
    const modelRef = useRef(model);
    modelRef.current = model;

    // Internal history sent to the API as context
    const apiHistory = useRef([]);

    const processAudio = async (base64Audio, language, playTTS, restartMic) => {
        if (!apiKey) {
            console.error("Gemini API Key is missing!");
            return;
        }
        if (!modelRef.current) {
            console.error("No Gemini model selected!");
            return;
        }

        setIsThinking(true);
        setAnalysisStatus('Analyzing audio in background...');

        // 1. Fast reply so the coach can start speaking quickly
        handleFastReply(base64Audio, language, playTTS, restartMic);

        // 2. Transcript and grammar analysis in the background
        handleBackgroundAnalysis(base64Audio);
    };

    const handleFastReply = async (base64Audio, language, playTTS, restartMic) => {
        const prompt = language === "bn"
            ? `${COACH_RULES} Reply in Bengali script.`
            : `${COACH_RULES} Reply in English.`;

        const currentTurn = {
            role: "user",
            parts: [
                { text: prompt },
                { inlineData: { mimeType: "audio/webm", data: base64Audio } }
            ]
        };

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelRef.current}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [...apiHistory.current, currentTurn] })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const aiReplyText = data.candidates[0].content.parts[0].text.trim();

            // Update UI and API history
            setChatHistory(prev => [...prev, { type: 'ai', text: aiReplyText }]);
            apiHistory.current.push({ role: "user", parts: [{ inlineData: { mimeType: "audio/webm", data: base64Audio } }] });
            apiHistory.current.push({ role: "model", parts: [{ text: aiReplyText }] });

            setIsThinking(false);

            // Play the reply with TTS
            const ttsSuccess = await playTTS(aiReplyText);

            // Restart the mic when TTS finishes
            if (restartMic) {
                if (!ttsSuccess) setTimeout(restartMic, 2000);
                else restartMic();
            }

        } catch (err) {
            console.error("Fast Reply Error:", err);
            setIsThinking(false);
            if (restartMic) setTimeout(restartMic, 3000);
        }
    };

    const handleBackgroundAnalysis = async (base64Audio) => {
        const analysisPrompt = "Listen to the audio. 1. Provide the exact transcript (including filler words). 2. Find any grammatical errors, filler words, or awkward phrasing. Return ONLY a JSON in this exact format: {\"transcribe\": \"exact user words\", \"feedback\": \"short grammar/fluency feedback\"}";

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelRef.current}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [
                            { text: analysisPrompt },
                            { inlineData: { mimeType: "audio/webm", data: base64Audio } }
                        ]
                    }]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const rawAIResponse = data.candidates[0].content.parts[0].text.trim();

            let parsedResponse;
            try {
                const match = rawAIResponse.match(/\{[\s\S]*\}/);
                parsedResponse = match ? JSON.parse(match[0]) : JSON.parse(rawAIResponse);
            } catch (e) {
                parsedResponse = { transcribe: "Audio Analysis Error", feedback: "Could not parse JSON." };
            }

            // Add the user transcript and feedback to the chat
            setChatHistory(prev => [...prev, {
                type: 'user',
                text: parsedResponse.transcribe,
                feedback: parsedResponse.feedback
            }]);

            setAnalysisStatus('Analysis Complete ✓');
            setTimeout(() => setAnalysisStatus(''), 3000);

        } catch (err) {
            console.error("Analysis Error:", err);
            setAnalysisStatus('Analysis Failed ✗');
        }
    };

    return { chatHistory, isThinking, analysisStatus, processAudio };
}