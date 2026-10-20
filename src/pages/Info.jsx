import { useParams } from 'react-router-dom';
import Learning from './Learning';

const PAGES = {
  learning: 'English/Bengali Learning',
  manual: 'User Manual',
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
  help: 'Help & Support',
  about: 'About App',
};

export default function Info() {
  const { slug } = useParams();
  if (slug === 'learning') return <Learning />;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{PAGES[slug] || 'Page'}</h1>
      <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
        Coming Soon
      </div>
    </main>
  );
}