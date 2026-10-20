import { useCallback, useEffect, useRef, useState } from 'react';

// status: 'off' | 'starting' | 'on' | 'denied' | 'error'
export default function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const aliveRef = useRef(true);
  const [status, setStatus] = useState('off');

  const release = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const stop = useCallback(() => {
    release();
    setStatus('off');
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) { setStatus('error'); return; }
    setStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (!aliveRef.current) { stream.getTracks().forEach((t) => t.stop()); return; } // page was left meanwhile
      streamRef.current = stream;
      stream.getVideoTracks()[0].onended = () => { if (aliveRef.current) stop(); };   // unplugged / revoked
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setStatus('on');
    } catch (err) {
      if (aliveRef.current) setStatus(err?.name === 'NotAllowedError' ? 'denied' : 'error');
    }
  }, [stop]);

  // Leaving the page always releases the camera
  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; release(); };
  }, []);

  return { videoRef, status, start, stop };
}