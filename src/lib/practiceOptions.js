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
];

export const LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export const LIMITS = [5, 10, 15, 20].map((m) => ({ value: m, label: `${m} minutes` }));

export const VOICES = { bn: 'bn-BD-NabanitaNeural', en: 'en-US-EricNeural' };