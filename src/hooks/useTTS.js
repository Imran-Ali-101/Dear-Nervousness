import { useEffect, useRef, useState } from "react";
import { createTTS } from "../lib/tts-client";

// Empty value = same-origin "/api" (production on Vercel).
// Set VITE_TTS_URL in .env.local to use the remote API while developing locally.
const TTS_BASE_URL = import.meta.env.VITE_TTS_URL || "";

export function useTTS(options = {}) {
  const [state, setState] = useState("idle");
  const ref = useRef(null);

  if (!ref.current) {
    ref.current = createTTS({
      baseUrl: TTS_BASE_URL,
      ...options,
      onState: setState,
    });
  }

  useEffect(() => {
    ref.current.warmUp();
    return () => ref.current.stop();
  }, []);

  return { speak: ref.current.speak, stop: ref.current.stop, state, getVoices: ref.current.getVoices };
}
