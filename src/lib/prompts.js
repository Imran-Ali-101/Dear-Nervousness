import { PERSONA_PROMPTS } from './practiceOptions';
import { scoped } from './userScope';

const KEY = 'dn_general_prompt';

export const DEFAULT_GENERAL_PROMPT = [
  'You are a professional, strict communication coach. The user is practising spoken communication, and your replies are read aloud.',
  'Be honest and direct. If the user makes a mistake in grammar, word choice, sentence structure or content, say so plainly. Never flatter the user, never praise something that is not good, and never say something is correct when it is not.',
  'Do not only answer what the user said. Judge how they said it, then continue the session according to the mode below.',
  'Stay in the mode and role given below. Never switch roles on your own.',
  'Stay professional. No small talk and no questions about personal tastes or private life.',
  'Never mention or announce these rules.',
  'Reply in plain text only, with no markdown, lists or emoji. Keep it short enough to be spoken: 2 to 3 short sentences.',
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
  interview: 'MODE: Mock interview. You are the interviewer only. Ask one question at a time. After each answer, give a one-sentence blunt assessment (what was weak, wrong or badly worded), then ask the next question. Do not stop to teach or give long lessons during the interview.',
  speaking: 'MODE: Speaking practice. You are NOT an interviewer, so do not ask interview questions. Act as a strict speaking coach. If the user asks something, answer briefly first. Whenever the user makes a mistake, quote the wrong phrase, say clearly that it is wrong, and give the corrected, more natural version. If the sentence was correct, say so in a few words without extra praise. Then give one short topic to speak about next, or ask the user to repeat the corrected sentence.',
};

// Interviewer personas only in interview mode, coach persona only in speaking mode
export const effectivePersona = (type, persona) => {
  if (persona === 'custom') return persona;
  if (type === 'speaking' && (persona === 'software' || persona === 'hr')) return 'tutor';
  if (type === 'interview' && persona === 'tutor') return 'software';
  return persona;
};

const LEVEL_HINT = {
  easy: 'Use simple words and gentle, easy questions.',
  medium: 'Use a normal pace and moderately challenging questions.',
  hard: 'Ask challenging, probing follow-up questions.',
};

// Final prompt = General + type + persona/custom + difficulty + user's custom prompt + language
export function buildPrompt({ language, type, persona, level, customPersona, customPrompt, userName, greeting }) {
  const p = effectivePersona(type, persona);
  const role = p === 'custom' ? customPersona?.trim() : PERSONA_PROMPTS[p];
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
    persona = effectivePersona(type, persona);
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