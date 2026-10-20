import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';

export default function CameraConsent({ open, onAccept, onCancel }) {
  if (!open) return null;
  const link = 'font-semibold text-blue-600 underline';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onCancel}>
      <div className="anim-pop w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FontAwesomeIcon icon={faShieldHalved} />
          </span>
          <h3 className="font-bold text-gray-900">Why we need your camera</h3>
        </div>

        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600">
          <li>Your camera is used only to calculate your presence scores, like eye contact and smile.</li>
          <li>Your video and photos are never recorded, stored or uploaded. The analysis happens on your device.</li>
          <li>Only the resulting scores are saved to your account.</li>
        </ul>

        {/* New tab, so a running practice session is not interrupted */}
        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          Have a concern? Please read our{' '}
          <a href="/info/privacy" target="_blank" rel="noopener noreferrer" className={link}>Privacy Policy</a> and{' '}
          <a href="/info/help" target="_blank" rel="noopener noreferrer" className={link}>Help &amp; Support</a>.
        </p>

        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Not now</button>
          <button onClick={onAccept} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Allow camera</button>
        </div>
      </div>
    </div>
  );
}