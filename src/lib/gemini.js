import { getGeminiKey } from './apiKey';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 20000;   // a hung request must never block the conversation
const MAX_ATTEMPTS = 2;     // one retry for temporary errors

class RetryableError extends Error {}
class RateLimitError extends RetryableError {}   // per-minute limit: waiting helps
class QuotaError extends Error {}                // daily quota finished: waiting does not help

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The app shows a popup when this event fires (see QuotaDialog)
const notifyQuota = (kind) => window.dispatchEvent(new CustomEvent('dn:quota', { detail: { kind } }));

export async function callGemini(model, body) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${API}/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': getGeminiKey() },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      const data = await res.json();
      const message = data.error?.message || `HTTP ${res.status}`;

      if (res.status === 429) {
        // Daily limits (or a limit of 0) will not recover soon; per-minute limits will
        if (/PerDay|limit: 0/i.test(JSON.stringify(data.error || {}))) {
          notifyQuota('daily');
          throw new QuotaError(message);
        }
        throw new RateLimitError(message);
      }
      if ([500, 503].includes(res.status)) throw new RetryableError(message);
      if (data.error) throw new Error(message);

      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
      if (!text) throw new RetryableError('Empty response');
      return text;
    } catch (err) {
      lastErr = err;
      const retryable = err instanceof RetryableError || err.name === 'AbortError' || err instanceof TypeError;
      if (!retryable || attempt === MAX_ATTEMPTS) break;
      await sleep(800);
    } finally {
      clearTimeout(timer);
    }
  }
  if (lastErr instanceof RateLimitError) notifyQuota('rate');
  throw lastErr;
}

export function parseJson(raw) {
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(m ? m[0] : raw);
  } catch {
    return {};
  }
}