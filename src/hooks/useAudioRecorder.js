import { useState, useRef, useCallback } from 'react';

export default function useAudioRecorder(onAudioReady) {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const silenceTimerRef = useRef(null);

    const SILENCE_RMS_THRESHOLD = 0.015;
    const SILENCE_DURATION = 1500;

    const checkAudioLevel = useCallback(() => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;

        const analyser = analyserRef.current;
        const data = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(data);

        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length);

        if (rms < SILENCE_RMS_THRESHOLD) {
            if (!silenceTimerRef.current) {
                silenceTimerRef.current = setTimeout(() => {
                    if (mediaRecorderRef.current.state === 'recording') {
                        mediaRecorderRef.current.stop();
                    }
                }, SILENCE_DURATION);
            }
        } else {
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }
        }
        requestAnimationFrame(checkAudioLevel);
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            
            let audioChunks = [];

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;
            
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyserRef.current = analyser;
            
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                    audioContextRef.current.close();
                }
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }

                if (audioChunks.length > 0) {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        const base64Audio = reader.result.split(',')[1];
                        onAudioReady(base64Audio);
                    };
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            checkAudioLevel();

        } catch (err) {
            console.error("Microphone permission denied!", err);
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    return { isRecording, startRecording, stopRecording };
}
