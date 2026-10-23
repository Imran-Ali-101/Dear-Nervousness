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

// Reduce thinking time: live replies need little reasoning
const thinkingFor = (model) => {
  if (/gemini-3/.test(model)) return { thinkingLevel: 'low' };
  if (/gemini-2\.5-flash/.test(model)) return { thinkingBudget: 0 };
  return null;
};

// Streaming version of callGemini. onText(fullTextSoFar) is called whenever new text arrives.
// Returns the final text. If streaming fails before any text arrives, it falls back to callGemini.
export async function streamGemini(model, body, onText) {
  let acc = '';
  const thinking = thinkingFor(model);
  const payload = thinking
    ? { ...body, generationConfig: { ...body.generationConfig, thinkingConfig: thinking } }
    : body;

  const ctrl = new AbortController();
  let timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API}/${model}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': getGeminiKey() },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // A stalled stream must not hang forever: reset the timer on every chunk
      clearTimeout(timer);
      timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();   // the last line may be incomplete

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const json = line.slice(5).trim();
        if (!json) continue;
        try {
          const d = JSON.parse(json);
          const t = d.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
          if (t) {
            acc += t;
            onText(acc);
          }
        } catch { /* ignore a broken chunk */ }
      }
    }
  } catch (err) {
    console.error('Streaming failed:', err);
    // Nothing received yet: use the normal request (it has retries and the quota popup)
    if (!acc) return callGemini(model, body);
  } finally {
    clearTimeout(timer);
  }

  const final = acc.trim();
  return final || callGemini(model, body);
}