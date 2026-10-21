import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// The public "Web client ID" from Google Cloud (the same one you gave to Supabase)
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

let scriptPromise = null;
const loadScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = resolve;
      s.onerror = () => { scriptPromise = null; reject(new Error('Google script could not be loaded')); };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
};

// Supabase wants the raw nonce, Google wants its SHA-256 hash
const makeNonce = async () => {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return { raw, hashed };
};

// Google keeps the callback it got on the first initialize, so it calls this holder instead
const handler = { current: null };
let initPromise = null;
const initGoogle = () => {
  if (!initPromise) {
    initPromise = (async () => {
      await loadScript();
      const nonce = await makeNonce();
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        nonce: nonce.hashed,
        ux_mode: 'popup',
        use_fedcm_for_prompt: true,
        callback: (response) => handler.current?.(response.credential, nonce.raw),
      });
    })().catch((e) => { initPromise = null; throw e; });
  }
  return initPromise;
};

// text: 'signin_with' | 'signup_with' | 'continue_with'
// onError must be a stable function (pass a useState setter)
export default function GoogleButton({ text = 'continue_with', onError, fallback }) {
  const boxRef = useRef(null);
  const [state, setState] = useState(CLIENT_ID ? 'loading' : 'fallback');

  useEffect(() => {
    if (!CLIENT_ID) return;
    let alive = true;
    handler.current = async (token, rawNonce) => {
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token, nonce: rawNonce });
      if (error && alive) onError?.(error.message);
    };
    initGoogle()
      .then(() => { if (alive) setState('ready'); })
      .catch((e) => {
        console.error('Google sign-in could not start, using the redirect button:', e);
        if (alive) setState('fallback');
      });
    return () => { alive = false; };
  }, [onError]);

  useEffect(() => {
    if (state !== 'ready' || !boxRef.current) return;
    const width = Math.min(400, Math.max(200, Math.round(boxRef.current.offsetWidth)));
    boxRef.current.replaceChildren();
    window.google.accounts.id.renderButton(boxRef.current, {
      type: 'standard', theme: 'outline', size: 'large', shape: 'rectangular', logo_alignment: 'left', text, width,
    });
  }, [state, text]);

  if (state === 'fallback') return fallback;
  return <div ref={boxRef} className="flex min-h-[44px] w-full items-center justify-center" />;
}