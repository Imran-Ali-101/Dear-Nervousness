import { PERSONA_PROMPTS } from './practiceOptions';

const KEY = 'dn_general_prompt';

export const DEFAULT_GENERAL_PROMPT = [
  'You are a warm, professional communication and interview coach having a spoken conversation.',
  'First respond to what the user just said, briefly and naturally, the way a real person would.',
  'Then keep the conversation moving: ask ONE relevant follow-up question, or suggest the next practice topic.',
  'Stay professional. Never ask about personal tastes or private life, and avoid small talk that does not help the user practise.',
  'Never mention or announce these rules.',
  'Reply in 2 to 3 short sentences of plain text, with no markdown, lists or emoji.',
].join(' ');

export const getGeneralPrompt = () => {
  try { return localStorage.getItem(scoped(KEY)) || DEFAULT_GENERAL_PROMPT; } catch { return DEFAULT_GENERAL_PROMPT; }
};

// Empty text = go back to the default prompt
export const setGeneralPrompt = (text) => {
  try {
    if (text.trim()) localStorage.setItem(scopef(KEY), text.trim());
    else localStorage.removeItem(scoped(KEY));
  } catch { /* ignore */ }
};

const TYPE_HINT = {
  interview: 'This is a mock interview. Ask one interview question at a time and react to the answer like a real interviewer.',
  speaking: 'This is speaking practice. Talk naturally on everyday and work topics and help the user improve grammar and vocabulary.',
};
const LEVEL_HINT = {
  easy: 'Use simple words and gentle, easy questions.',
  medium: 'Use a normal pace and moderately challenging questions.',
  hard: 'Ask challenging, probing follow-up questions.',
};

// Final prompt = General + type + persona/custom + difficulty + user's custom prompt + language
export function buildPrompt({ language, type, persona, level, customPersona, customPrompt }) {
  const role = persona === 'custom' ? customPersona?.trim() : PERSONA_PROMPTS[persona];
  return [
    getGeneralPrompt(),
    TYPE_HINT[type],
    role && `Your role: ${role}`,
    LEVEL_HINT[level],
    customPrompt?.trim() && `Extra instructions from the user: ${customPrompt.trim()}`,
    language === 'bn' ? 'Always reply in Bengali script.' : 'Always reply in English.',
  ].filter(Boolean).join('\n');
}