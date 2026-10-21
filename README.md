# Dear Nervousness

An AI speaking and interview coach for Bengali and English speakers. Practice mock interviews by voice, get instant feedback on filler words, pacing and confidence, and track your progress over time.

## Features

- Voice mock interviews (HR and technical) with an AI interviewer that talks back
- Filler word detection, words per minute and pause tracking
- Post-session report with scores, rephrasing suggestions and follow-up questions
- Optional camera analysis for presence scores (runs in the browser)
- Session history and progress charts
- English and Bengali learning tools
- Sign in with Google or GitHub
- Account deletion with a 7-day grace period

## Tech stack

- React 19, Vite, Tailwind CSS 4, React Router, Chart.js
- Supabase (authentication and session storage)
- Google Gemini API (each user adds their own key in Settings)
- MediaPipe Tasks Vision (face analysis in the browser)
- Edge TTS on a Vercel Python function (`api/tts.py`, FastAPI)

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Environment variables (`.env.local`):

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_TTS_URL` | Base URL of the TTS API |
| `VITE_GOOGLE_CLIENT_ID` | Optional. Google Web client ID for one-tap style sign-in |

Never put a `service_role` key in any `VITE_` variable.

## Supabase setup

1. Enable the Google and GitHub providers. Disable the Email provider.
2. Add your site URL and `http://localhost:5173` to the redirect URL list.
3. Create the `sessions` table with a unique constraint on `(user_id, started_at)` and enable Row Level Security so every user can only read and write their own rows (policies use `auth.uid() = user_id`).
4. Schedule a daily job that deletes accounts whose `deletion_requested_at` metadata is older than 7 days.

## Deployment

Deploy to Vercel. `vercel.json` rewrites `/api/*` to the Python TTS function, serves the SPA for all other routes and sets security headers. Add the same environment variables in the Vercel project settings.

## Project structure

```
api/          TTS API (FastAPI on Vercel)
src/pages/    Route pages (landing, auth, dashboard, practice, report, settings)
src/components/  Shared UI components
src/hooks/    Auth, camera, audio, Gemini and face-analysis hooks
src/lib/      Supabase client, session sync, analysis, prompts, helpers
public/       Static assets
```

## Privacy and security

- Gemini API keys are stored only in the browser and sent only to Google.
- Voice and text go directly from the browser to Google using the user's own key.
- Camera frames are processed locally and are never uploaded.
- All database access goes through Row Level Security.

See `/privacy` and `/terms` in the running app for the full policies.

## License

All rights reserved. Contact the author before reuse.