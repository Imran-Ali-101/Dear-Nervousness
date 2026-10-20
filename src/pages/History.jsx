import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faChevronDown, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { TYPES } from '../lib/practiceOptions';
import { useSessions } from '../lib/sessions';

export default function History() {
  const sessions = useSessions();
  const chats = sessions.filter((s) => Array.isArray(s.turns) && s.turns.length).slice(0, 5);
  const [open, setOpen] = useState(chats[0]?.startedAt ?? null);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">History</h1>
      <p className="mt-1 text-sm text-gray-500">Recent Conversation</p>

      {chats.length === 0 && (
        <div className="mt-6 flex h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-gray-400">
          <FontAwesomeIcon icon={faFolderOpen} className="text-3xl" />
          <p className="mt-3 text-sm">Finish a practice session to see it here.</p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {chats.map((s) => {
          const isOpen = open === s.startedAt;
          return (
            <section key={s.startedAt} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <button onClick={() => setOpen(isOpen ? null : s.startedAt)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">
                    {TYPES.find((t) => t.value === s.type)?.title || 'Practice'} · {s.language === 'bn' ? 'Bengali' : 'English'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(s.startedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                {s.analysis?.confidence != null && (
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{s.analysis.confidence}%</span>
                )}
                <FontAwesomeIcon icon={faChevronDown} className={`text-xs text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50/60 p-3 md:p-5">
                  {s.analysis?.summary && (
                    <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900 md:text-sm">
                      <p>{s.analysis.summary}</p>
                      {s.analysis.pausesPerMin != null && (
                        <p className="mt-2 text-xs text-blue-700">
                          Pauses: {s.analysis.shortPauses} natural, {s.analysis.longPauses} long ({s.analysis.pausePercent}% of speaking time)
                        </p>
                      )}
                      {s.analysis.tips?.length > 0 && (
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                          {s.analysis.tips.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      )}
                    </div>
                  )}

                  {(s.analysis?.improvements?.length > 0 || s.analysis?.vocab?.length > 0) && (
                    <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 md:text-sm">
                      {s.analysis.improvements?.length > 0 && (
                        <>
                          <p className="font-bold">Say it better</p>
                          <ul className="mt-1.5 space-y-2.5">
                            {s.analysis.improvements.map((x, i) => (
                              <li key={i}>
                                <p className="text-gray-500 line-through">{x.original}</p>
                                <p className="font-semibold text-emerald-700">{x.better}</p>
                                {x.why && <p className="text-amber-800/80">{x.why}</p>}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {s.analysis.vocab?.length > 0 && (
                        <>
                          <p className={`font-bold ${s.analysis.improvements?.length > 0 ? 'mt-3' : ''}`}>Stronger words</p>
                          <ul className="mt-1.5 space-y-1">
                            {s.analysis.vocab.map((v, i) => (
                              <li key={i}><span className="text-gray-500 line-through">{v.weak}</span> → <span className="font-semibold text-emerald-700">{v.better.join(', ')}</span></li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    {s.turns.map((t) => (
                      <div key={t.id} className="flex flex-col gap-3">
                        {t.userText && (
                          <div className="flex w-full justify-end">
                            <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-blue-600 p-3 text-white shadow-md md:max-w-[80%]">
                              <span className="text-sm leading-relaxed md:text-[15px]">{t.userText}</span>
                              {t.feedback && (
                                <div className="mt-2 rounded-lg bg-blue-700/50 p-2 text-xs md:text-sm">
                                  <strong className="text-blue-200"><FontAwesomeIcon icon={faLightbulb} className="mr-1.5" />Tip:</strong> {t.feedback}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {t.aiText && (
                          <div className="flex w-full justify-start">
                            <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-gray-200 bg-white p-3 text-gray-800 shadow-sm md:max-w-[80%]">
                              <strong className="mb-1 block text-[10px] uppercase tracking-wider text-blue-600 md:text-xs">AI Coach</strong>
                              <span className="text-sm leading-relaxed md:text-[15px]">{t.aiText}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}