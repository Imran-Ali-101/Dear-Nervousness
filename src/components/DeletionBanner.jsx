import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../hooks/useAuth';
import { cancelDeletion, getDeletionDate } from '../lib/deletion';

export default function DeletionBanner() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const date = getDeletionDate(user);
  if (!date) return null;

  const cancel = async () => {
    setBusy(true);
    await cancelDeletion();
    setBusy(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-700 md:px-8">
      <FontAwesomeIcon icon={faTriangleExclamation} />
      <span className="min-w-0 flex-1">
        Your account will be permanently deleted on {date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}.
      </span>
      <button onClick={cancel} disabled={busy} className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
        {busy && <FontAwesomeIcon icon={faSpinner} spin />} Cancel deletion
      </button>
    </div>
  );
}