import { useParams } from 'react-router-dom';

const PAGES = {
  learning: 'English/Bengali Learning',
  manual: 'User Manual',
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
};

export default function Info() {
  const { slug } = useParams();
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{PAGES[slug] || 'Page'}</h1>
      <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
        Coming soon.
      </div>
    </main>
  );
}