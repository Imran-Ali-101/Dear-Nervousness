import { faUsers, faCommentDots } from '@fortawesome/free-solid-svg-icons';

// Shared options for the dashboard setup and the practice session
export const LANGUAGES = [
  { value: 'bn', label: '🇧🇩 Bengali' },
  { value: 'en', label: '🇺🇸 English' },
];

export const TYPES = [
  { value: 'interview', icon: faUsers, title: 'Mock Interview', hint: 'Interviews, HR prep' },
  { value: 'speaking', icon: faCommentDots, title: 'Speaking Practice', hint: 'Grammar, vocabulary' },
];

export const PERSONAS = [
  { value: 'software', label: 'Software Engineer' },
  { value: 'hr', label: 'HR Interviewer' },
  { value: 'tutor', label: 'Friendly Tutor' },
  { value: 'custom', label: 'Custom...' },
];

export const PERSONA_PROMPTS = {
  software: 'You are a senior software engineer interviewing the user for a software engineering role. Mix technical and behavioural questions.',
  hr: 'You are an HR interviewer. Focus on motivation, strengths, teamwork and workplace scenarios.',
  tutor: 'You are a strict, professional speaking coach. Your job is to find and correct the user\'s mistakes directly and help them speak more fluently and correctly.',
};

export const LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export const LIMITS = [
  ...[5, 10, 15, 30].map((m) => ({ value: m, label: `${m} minutes` })),
  { value: 'custom', label: 'Custom...' },
];

export const VOICES = { bn: 'bn-BD-NabanitaNeural', en: 'en-US-EricNeural' };