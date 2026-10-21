import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import {
  faBook, faShieldHalved, faFileContract, faCircleQuestion, faCircleInfo,
  faEnvelope, faChevronDown, faGraduationCap, faHeart,
} from '@fortawesome/free-solid-svg-icons';
import Learning from './Learning';

// ===== EDIT THESE BEFORE PUBLISHING =====
const CONTACT_EMAIL = 'imran.28279@gmail.com';
const GITHUB_URL = 'https://github.com/Imran-Ali-101';     
const LINKEDIN_URL = 'https://www.linkedin.com/in/imran-ali101/';  
const UPDATED = 'October 21, 2026';
// ========================================

/* ---------- small building blocks ---------- */

const linkCls = 'font-semibold text-blue-600 underline';
const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`} className={linkCls}>{CONTACT_EMAIL}</a>;

const P = ({ children }) => <p className="text-sm leading-relaxed text-gray-600">{children}</p>;

const List = ({ items }) => (
  <ul className="space-y-2 text-sm leading-relaxed text-gray-600">
    {items.map((t, i) => (
      <li key={i} className="flex gap-2.5">
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
        <span>{t}</span>
      </li>
    ))}
  </ul>
);

const Note = ({ children }) => (
  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-900">{children}</div>
);

function Section({ n, title, children }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2.5 text-base font-bold text-gray-900">
        {n && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">{n}</span>
        )}
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function PageShell({ icon, title, subtitle, updated, children }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-lg shadow-blue-600/20">
          <FontAwesomeIcon icon={icon} />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {updated && <p className="mt-3 text-xs text-gray-400">Last updated: {UPDATED}</p>}
      <div className="mt-6 flex flex-col gap-4">{children}</div>
    </main>
  );
}

function Faq({ q, children }) {
  return (
    <details className="group rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 open:bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
        {q}
        <FontAwesomeIcon icon={faChevronDown} className="text-xs text-gray-400 transition group-open:rotate-180" />
      </summary>
      <div className="mt-2 text-sm leading-relaxed text-gray-600">{children}</div>
    </details>
  );
}

/* ---------- Privacy Policy ---------- */

function Privacy() {
  return (
    <PageShell icon={faShieldHalved} title="Privacy Policy" subtitle="What we collect, why, and what we never touch" updated>
      <Note>
        <b>The short version:</b> your video and photos are never recorded, stored or uploaded. Your Gemini API key stays in your
        browser. We only save your account details and your practice results, and you can delete your account at any time.
      </Note>

      <Section n="1" title="What we store in your account">
        <List items={[
          'Account details: your email, display name and profile photo link (from Google or GitHub).',
          'Results of each session: date, length, language, practice type, scores (confidence, clarity, grammar), speaking pace, filler words, pauses, camera presence scores, feedback and tips.',
          'Conversation text: what you said (as text) and the AI’s replies, saved with your sessions so you can read them again in History.',
        ]} />
      </Section>

      <Section n="2" title="What we never store">
        <List items={[
          'Your voice recordings. Each recording is sent for transcription and evaluation, and we keep no copy of the audio.',
          'Your video or photos. See the camera section below.',
          'Your Gemini API key. It is saved only in your own browser.',
        ]} />
      </Section>

      <Section n="3" title="The camera">
        <P>
          The camera is optional and is used only to calculate presence scores: eye contact, smile time, steadiness and framing.
          The analysis runs on your device with MediaPipe. Camera frames are never recorded or uploaded, and only the final numbers
          are saved with your session.
        </P>
        <P>
          The analysis files (about 16 MB, one time) are downloaded from public servers (jsDelivr and Google Cloud Storage). Like any
          download, those servers can see your IP address.
        </P>
      </Section>

      <Section n="4" title="Services that handle your data">
        <List items={[
          <><b>Supabase</b>: sign-in and the database that holds your account and results.</>,
          <><b>Google Gemini</b>: your voice and text go from your browser straight to Google, using your own API key, to transcribe and evaluate your practice. Google’s own terms and privacy policy apply to that data.</>,
          <><b>Text-to-speech</b>: the AI’s reply text (not your voice) is sent to our server function, which gets the spoken audio from Microsoft’s Edge text-to-speech service.</>,
          <><b>Vercel</b>: hosts the app and the speech function, and may keep standard server logs such as IP addresses.</>,
          <><b>Google, GitHub</b>: only if you choose to sign in with them.</>,
        ]} />
        <P>We do not sell your data. There are no ads and no third-party analytics or trackers in the app.</P>
      </Section>

      <Section n="5" title="What stays in your browser">
        <P>
          Your Gemini API key, your preferences (theme, language, prompts), your camera choice and a fast copy of your results are
          kept in your browser’s storage. Clearing the site data in your browser removes them.
        </P>
      </Section>

      <Section n="6" title="Your choices">
        <List items={[
          'Change your display name any time in Settings → Account.',
          'Delete your account in Settings → Request Account Deletion. Your account and its data are permanently deleted after 7 days, and you can cancel before then.',
          'Turn the camera off at any time with the “Turn off camera” button.',
        ]} />
      </Section>

      <Section n="7" title="Children">
        <P>Dear Nervousness is not meant for children under 13. Please do not use it if you are younger.</P>
      </Section>

      <Section n="8" title="Changes and contact">
        <P>If this policy changes, the date at the top will change too. Questions or concerns about your privacy? Write to <Mail />.</P>
      </Section>
    </PageShell>
  );
}

/* ---------- Terms & Conditions ---------- */

function Terms() {
  return (
    <PageShell icon={faFileContract} title="Terms & Conditions" subtitle="Simple rules for using Dear Nervousness" updated>
      <Note>By signing in or using the app, you agree to these terms. If you do not agree, please do not use it.</Note>

      <Section n="1" title="What this app is">
        <P>
          Dear Nervousness is a free speaking-practice tool. You talk with an AI, and you get feedback on things like fluency,
          grammar, pace and, if you turn the camera on, your on-camera presence. It is a student project, offered as is.
        </P>
      </Section>

      <Section n="2" title="Your account">
        <List items={[
          'Give accurate information and keep your sign-in details safe. You are responsible for what happens in your account.',
          'You must be at least 13 years old, or older if your local law requires it.',
        ]} />
      </Section>

      <Section n="3" title="Your Gemini API key">
        <P>
          You use your own Google Gemini API key. Any usage limits, costs and rules that come with it are between you and Google.
          Keep the key private. We do not store it on our servers.
        </P>
      </Section>

      <Section n="4" title="Please do not">
        <List items={[
          'Use the app for anything unlawful, or to harass, threaten or harm others.',
          'Try to break, overload, scrape or get around the limits of the app or its services.',
          'Use another person’s account, voice or face without their permission.',
        ]} />
      </Section>

      <Section n="5" title="Results are estimates">
        <P>
          Scores, tips and rewrites come from AI and from simple measurements, so they can be wrong. They are practice aids only.
          They are not professional advice, and they do not judge your emotions, mental health or how suitable you are for a job.
        </P>
        <Note>Dear Nervousness is not a medical or therapy service. If nervousness or anxiety is affecting your life, please talk to a qualified professional.</Note>
      </Section>

      <Section n="6" title="Your content">
        <P>
          What you say and write stays yours. You allow us to store and process it only to run the app for you, as described in the
          Privacy Policy.
        </P>
      </Section>

      <Section n="7" title="Availability and changes">
        <P>
          The app is free and may change, pause or stop at any time. We do not promise that it will always be available or free of
          errors.
        </P>
      </Section>

      <Section n="8" title="No warranty and limited liability">
        <P>
          The app is provided “as is”, without warranties of any kind. To the extent the law allows, the creator is not liable for any
          loss or damage that comes from using the app or relying on its results.
        </P>
      </Section>

      <Section n="9" title="Ending your use">
        <P>
          You can stop at any time and delete your account in Settings. We may suspend accounts that break these terms.
        </P>
      </Section>

      <Section n="10" title="Law, changes and contact">
        <P>
          These terms are governed by the laws of Bangladesh. We may update them, and the date at the top will change when we do.
          Questions? Write to <Mail />.
        </P>
      </Section>
    </PageShell>
  );
}

/* ---------- User Manual ---------- */

function Manual() {
  return (
    <PageShell icon={faBook} title="User Manual" subtitle="From first sign-in to your first report">
      <Section n="1" title="Quick start">
        <List items={[
          <><b>Sign in</b> with Google or GitHub.</>,
          <><b>Add your Gemini API key</b> in Settings. The Help page shows how to get a free one.</>,
          <>Open <b>Practice</b> and choose the language, type, persona, level and time.</>,
          <>Optional: tap <b>Turn on camera</b> to get presence scores.</>,
          <>Tap <b>Start Conversation</b> and talk with the AI.</>,
          <>Tap <b>End Practice Session</b> to see your report.</>,
        ]} />
      </Section>

      <Section n="2" title="During a conversation">
        <List items={[
          'The AI speaks first. Wait until it finishes, then answer.',
          'When you stop talking for about a second and a half, your answer is sent automatically.',
          'Speak in full sentences, as you would in a real interview or talk.',
          'Ending the session in the middle of a sentence drops that last sentence, so finish speaking first.',
        ]} />
      </Section>

      <Section n="3" title="The camera (optional)">
        <List items={[
          'The first time, you will see a short note about why the camera is needed.',
          'The first download of the face analysis is about 16 MB, so it takes a moment. Next time it opens much faster.',
          'Hold your phone at eye level, with light in front of you, and keep your face in the frame.',
          'Your video is never recorded or uploaded. Only the scores are saved.',
        ]} />
      </Section>

      <Section n="4" title="Reading your report">
        <List items={[
          <><b>Confidence, Clarity, Grammar:</b> AI scores from 0 to 100 for your answers.</>,
          <><b>Speaking pace:</b> words per minute. Roughly 110 to 170 feels natural in English.</>,
          <><b>Filler words:</b> sounds like “um” and “uh”, with how many per minute.</>,
          <><b>Pauses:</b> short pauses (about 0.35 to 1 second) are natural. Long pauses (1 second or more) can feel awkward.</>,
          <><b>Presence on camera:</b> eye contact, smile time, steadiness and framing, combined into one score.</>,
          <><b>Say it better, Stronger words:</b> your own phrases rewritten, with better word choices.</>,
        ]} />
      </Section>

      <Section n="5" title="History and progress">
        <P>
          Every session is saved. Open History to read past conversations and results, and the Home screen to see how your scores
          change over time.
        </P>
      </Section>

      <Section n="6" title="Tips for better results">
        <List items={[
          'Use a quiet place, and keep the phone close to your mouth.',
          'Short sessions of 3 to 5 minutes, done often, work better than one long session.',
          'Pick one thing to improve each time, such as the “Focus for next time” tip in your report.',
        ]} />
      </Section>
    </PageShell>
  );
}

/* ---------- Help & Support ---------- */

function Help() {
  return (
    <PageShell icon={faCircleQuestion} title="Help & Support" subtitle="Quick answers, and a way to reach us">
      <Section title="Get a free Gemini API key">
        <List items={[
          <>Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className={linkCls}>Google AI Studio</a> and sign in with your Google account.</>,
          'Create an API key and copy it.',
          'In Dear Nervousness, go to More → Settings and paste the key.',
        ]} />
        <P>The key stays in your browser only. Free keys have usage limits set by Google.</P>
      </Section>

      <Section title="Common questions">
        <div className="space-y-2.5">
          <Faq q="It says “Add API Key to Start”">
            You have not saved a Gemini key on this device yet. Add it in Settings. The key is saved per browser, so you need to add it again on a new phone or browser.
          </Faq>
          <Faq q="The AI does not hear me">
            Allow the microphone in your browser’s site settings, close other apps that use the mic, and speak clearly. Wait about a second and a half after you finish so your answer is sent.
          </Faq>
          <Faq q="The camera does not start">
            Allow camera access in your browser’s site settings and try again. If you blocked it earlier, you must unblock it there.
          </Faq>
          <Faq q="Face analysis is loading for a long time">
            The first time it downloads about 16 MB, so on slow internet it can take a minute or more. You can continue in the background, and next time it opens much faster.
          </Faq>
          <Faq q="My eye contact score looks low">
            On a phone the camera sits above the screen, so looking at the screen can read as looking down. Hold the phone at eye level and glance at the camera lens. The score is an estimate.
          </Faq>
          <Faq q="My report has no scores, or is missing">
            Sessions where nothing was said do not make a report. If scores are missing, check your API key and quota, then reopen the app. It tries again for sessions from the last 24 hours.
          </Faq>
          <Faq q="I see a quota or rate-limit error">
            Your Gemini key has reached its limit. Wait a little, or try another model in Settings or another key.
          </Faq>
          <Faq q="The AI voice does not play">
            Check your internet connection and volume, then try again. If it keeps failing, the app lets you continue talking anyway.
          </Faq>
          <Faq q="Is my video recorded?">
            No. The camera is analysed on your device, and only the scores are saved.
          </Faq>
          <Faq q="How do I delete my account?">
            Go to More → Settings → Request Account Deletion. Everything is deleted after 7 days, and you can cancel before then.
          </Faq>
        </div>
      </Section>

      <Section title="Still need help?">
        <P>Write to us and describe what happened, and which phone and browser you use. We read every message.</P>
        <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700">
          <FontAwesomeIcon icon={faEnvelope} /> {CONTACT_EMAIL}
        </a>
      </Section>
    </PageShell>
  );
}

/* ------- Profile Picture ------ */
function ProfilePhoto() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="-mt-11 h-[88px] w-[88px] overflow-hidden rounded-2xl border-4 border-white bg-blue-600 shadow-md">
      {failed ? (
        <span className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-white">IA</span>
      ) : (
        <img
          src="/profile.jpg"
          alt="Md. Imran Ali"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}

/* ---------- About ---------- */

const BUILT_WITH = ['React', 'Vite', 'Tailwind CSS', 'Supabase', 'Google Gemini', 'MediaPipe', 'Edge TTS', 'Vercel'];

function About() {
  return (
    <PageShell icon={faCircleInfo} title="About App" subtitle="Dear Nervousness, and the person behind it">
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-500" />
        <div className="px-5 pb-5">
          <ProfilePhoto />
          <h2 className="mt-3 text-xl font-bold text-gray-900">Md. Imran Ali</h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
            <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600" />
            University of Rajshahi
          </p>
          <p className="mt-0.5 pl-6 text-sm text-gray-600">Department of Computer Science and Engineering</p>
          <p className="mt-0.5 pl-6 text-sm text-gray-500">Session: 2024-25</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <FontAwesomeIcon icon={faEnvelope} /> Email
            </a>
            {GITHUB_URL && (
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <FontAwesomeIcon icon={faGithub} /> GitHub
              </a>
            )}
            {LINKEDIN_URL && (
              <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <FontAwesomeIcon icon={faLinkedinIn} /> LinkedIn
              </a>
            )}
          </div>
        </div>
      </section>

      <Section title="Why I built this">
        <P>
          Hi, I’m Imran. I built Dear Nervousness for my own speaking practice, so I could talk in English and Bengali with more
          confidence. Since it can help other people too, I am opening it up for everyone.
        </P>
        <P>It is a student project, made with care. Some things may still be rough, and your feedback helps it get better.</P>
      </Section>

      <Section title="What it does">
        <List items={[
          'Real conversation practice with an AI, such as interviews and general speaking.',
          'Feedback on filler words, speaking pace and pauses.',
          'Confidence, clarity and grammar scores, with tips for next time.',
          'Better ways to say your own sentences, and stronger word choices.',
          'Optional camera analysis for eye contact, smile, steadiness and framing, done on your device.',
          'History and progress charts, in English and Bengali.',
        ]} />
      </Section>

      <Section title="Built with">
        <div className="flex flex-wrap gap-2">
          {BUILT_WITH.map((t) => (
            <span key={t} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{t}</span>
          ))}
        </div>
      </Section>

      <p className="flex items-center justify-center gap-1.5 pb-2 text-xs text-gray-400">
        Made with <FontAwesomeIcon icon={faHeart} className="text-rose-400" /> in Rajshahi, Bangladesh
      </p>
    </PageShell>
  );
}

/* ---------- routing ---------- */

// Used for /privacy and /terms, which work without signing in
function PublicFrame({ children }) {
  return (
    <div className="min-h-[100dvh] bg-[#f6f8fc] text-[#1b1f24]">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-base font-bold text-gray-900">
            <img src="/logo.svg" alt="" className="h-8 w-8" />
            <span>Dear <span className="text-blue-600">Nervousness</span></span>
          </Link>
          <Link to="/auth" className="text-sm font-semibold text-blue-600">Sign in</Link>
        </div>
      </header>
      {children}
    </div>
  );
}

export default function Info({ slug: forced, standalone = false }) {
  const params = useParams();
  const slug = forced || params.slug;
  if (slug === 'learning') return <Learning />;

  let body;
  switch (slug) {
    case 'manual': body = <Manual />; break;
    case 'privacy': body = <Privacy />; break;
    case 'terms': body = <Terms />; break;
    case 'help': body = <Help />; break;
    case 'about': body = <About />; break;
    default:
      body = (
        <PageShell icon={faCircleInfo} title="Page not found">
          <P>We could not find this page. Please go back and try again.</P>
        </PageShell>
      );
  }
  return standalone ? <PublicFrame>{body}</PublicFrame> : body;
}