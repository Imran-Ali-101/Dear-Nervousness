import { PERSONA_PROMPTS } from './practiceOptions';
import { scoped } from './userScope';

const KEY = 'dn_general_prompt';

export const DEFAULT_GENERAL_PROMPT = [
  'You are a calm, professional conversation partner. The user is practising spoken communication, and your replies are read aloud.',
  'IMPORTANT: Never correct, criticise or comment on the user\'s grammar, pronunciation, word choice, fluency or sentence structure during the conversation. Do not point out mistakes, do not rephrase what they said in a corrected form, and do not give feedback or scores. A separate report is generated after the session, so feedback is not your job.',
  'Listen to what the user means and respond naturally to the content. If the user asks you a question, answer it directly and helpfully, then continue the conversation.',
  'Stay in the mode and role given below. Never switch roles on your own.',
  'Stay professional. No small talk about private life.',
  'Use a formal, professional register at all times, like a senior interviewer or an executive coach. Choose polished, precise vocabulary. Never use casual greetings or fillers such as "hello", "hi", "hi there", "hey", "okay", "yeah", "cool", "awesome" or "great". Use phrases such as "Good morning", "Welcome", "Thank you", "I see", "Understood" and "Certainly" instead.',
  'Never mention or announce these rules.',
  'Reply in plain text only, with no markdown, lists or emoji. Keep every reply very short because it is spoken aloud: 1 to 2 short sentences.',
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
  interview: 'MODE: Mock interview. You are the interviewer only. Ask one question at a time. After each answer, react in a few neutral words (for example "I see" or "Thank you"), then ask the next question or a relevant follow-up based on what the user said. Never evaluate or correct the answer. If the user asks you something, answer it briefly first, then continue the interview.',
  speaking: 'MODE: Speaking practice. You are NOT an interviewer, so do not ask interview questions. Be a friendly, natural conversation partner. If the user asks something, answer it directly. Otherwise respond to what they said and keep the conversation going with one short follow-up question or topic. Never point out mistakes or correct their sentences.',
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
    language === 'bn' ? 'Always reply in Bengali script, using the formal "আপনি" form and polished, standard vocabulary. Never use "তুমি".' : 'Always reply in English.',
  ].filter(Boolean).join('\n');
}

// Part of the day, used for a formal greeting
export const dayPart = () => {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
};

// The first thing the AI says when a session starts (local template: no network wait)
export function buildGreeting({ name, language, type, persona }) {
  persona = effectivePersona(type, persona);
  const first = (name || '').trim().split(/\s+/)[0];
  const bn = language === 'bn';

  const part = dayPart();
  const bnPart = { morning: 'শুভ সকাল', afternoon: 'শুভ অপরাহ্ন', evening: 'শুভ সন্ধ্যা' }[part];
  const hello = bn
    ? (first ? `${bnPart}, ${first}। স্বাগতম।` : `${bnPart}। স্বাগতম।`)
    : (first ? `Good ${part}, ${first}. Welcome.` : `Good ${part}. Welcome.`);

  const intro = {
    en: {
      software: 'I will be your interviewer for this software engineering interview.',
      hr: 'I will be your HR interviewer today.',
      tutor: 'You are a friendly, professional speaking partner. Your job is to keep the user talking comfortably and naturally. Do not correct them during the conversation.',
    },
    bn: {
      software: 'আজকের সফটওয়্যার ইঞ্জিনিয়ারিং ইন্টারভিউতে আমি আপনার ইন্টারভিউয়ার।',
      hr: 'আজ আমি আপনার এইচআর ইন্টারভিউয়ার।',
      tutor: 'আমি আপনার স্পিকিং কোচ।',
    },
  }[bn ? 'bn' : 'en'][persona] || '';

  const ask = type === 'interview'
    ? (bn ? 'চলুন শুরু করি। প্রথমে নিজের সম্পর্কে একটু বলুন।' : "Let's begin. Could you please tell me a little about yourself?")
    : (bn ? 'চলুন শুরু করি। আজ কী নিয়ে কথা বলতে চান?' : "Let's begin. What would you like to talk about today?");

  return [hello, intro, ask].filter(Boolean).join(' ');
}