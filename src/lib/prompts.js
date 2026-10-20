import { PERSONA_PROMPTS } from './practiceOptions';
import { scoped } from './userScope';

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
    if (text.trim()) localStorage.setItem(scoped(KEY), text.trim());
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
export function buildPrompt({ language, type, persona, level, customPersona, customPrompt, userName, greeting }) {
  const role = persona === 'custom' ? customPersona?.trim() : PERSONA_PROMPTS[persona];
  return [
    getGeneralPrompt(),
    TYPE_HINT[type],
    role && `Your role: ${role}`,
    LEVEL_HINT[level],
    customPrompt?.trim() && `Extra instructions from the user: ${customPrompt.trim()}`,
    userName && `The user's name is ${userName}. Use it only now and then, not in every reply.`,
    greeting && `You have already greeted the user and said: "${greeting}" Do not greet again; respond to their answer.`,
    language === 'bn' ? 'Always reply in Bengali script.' : 'Always reply in English.',
  ].filter(Boolean).join('\n');
}

// The first thing the AI says when a session starts (local template: no network wait)
export function buildGreeting({ name, language, type, persona }) {
  const first = (name || '').trim().split(/\s+/)[0];
  const bn = language === 'bn';

  const hello = bn
    ? (first ? `হ্যালো ${first}, স্বাগতম!` : 'হ্যালো, স্বাগতম!')
    : (first ? `Hi ${first}, welcome!` : 'Hi, welcome!');

  const intro = {
    en: {
      software: 'I will be your interviewer for this software engineering interview.',
      hr: 'I will be your HR interviewer today.',
      tutor: 'I am your speaking coach.',
    },
    bn: {
      software: 'আজকের সফটওয়্যার ইঞ্জিনিয়ারিং ইন্টারভিউতে আমি তোমার ইন্টারভিউয়ার।',
      hr: 'আজ আমি তোমার এইচআর ইন্টারভিউয়ার।',
      tutor: 'আমি তোমার স্পিকিং কোচ।',
    },
  }[bn ? 'bn' : 'en'][persona] || '';

  const ask = type === 'interview'
    ? (bn ? 'চলো শুরু করি। প্রথমে নিজের সম্পর্কে একটু বলো।' : "Let's begin. Could you please tell me a little about yourself?")
    : (bn ? 'চলো শুরু করি। আজ কী নিয়ে কথা বলতে চাও?' : "Let's begin. What would you like to talk about today?");

  return [hello, intro, ask].filter(Boolean).join(' ');
}