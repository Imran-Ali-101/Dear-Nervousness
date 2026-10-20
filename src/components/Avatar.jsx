import { useState } from 'react';
import { getAvatarUrl, getDisplayName } from '../lib/profile';

export default function Avatar({ user, size = 36, className = '' }) {
  const [failed, setFailed] = useState(false);
  const url = getAvatarUrl(user);
  const initial = (getDisplayName(user)[0] || '?').toUpperCase();
  const box = { width: size, height: size, fontSize: size * 0.42 };

  if (url && !failed) {
    return (
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        style={box}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span style={box} className={`flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 ${className}`}>
      {initial}
    </span>
  );
}