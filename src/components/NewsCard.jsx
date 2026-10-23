import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

export default function NewsCard({ news }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="shrink-0 border-b border-amber-100 bg-amber-50 px-3 py-2.5 md:px-6">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-left">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-semibold uppercase tracking-wide text-amber-700">{news.source}</span>
            <span className={`block text-sm font-bold text-gray-900 ${open ? '' : 'truncate'}`}>{news.title}</span>
          </span>
          <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="text-xs text-amber-700" />
        </button>
        {open && (
          <div className="mt-1.5">
            {news.summary && <p className="text-xs leading-relaxed text-gray-700">{news.summary}</p>}
            <a href={news.link} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[10px]" /> Read full article
            </a>
          </div>
        )}
      </div>
    </div>
  );
}