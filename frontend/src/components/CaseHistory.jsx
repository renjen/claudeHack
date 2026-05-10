import { useT } from '../LocaleContext'

export default function CaseHistory({ cases, onRestore, onDelete, onClose }) {
  const t = useT()

  function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function caseLabel(c) {
    const employer = c.facts?.employer_name || 'Unknown employer'
    const first = c.violations?.[0]?.type?.replace(/_/g, ' ') || 'No violations detected'
    return { employer, violation: first }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-50 text-base">{t('history.title')}</h2>
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">
            {t('history.last')} {cases.length} {t('history.analyses')}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close case history"
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none transition-colors"
        >
          ×
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
            <span className="text-3xl">📂</span>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('history.empty')}</p>
            <p className="text-xs text-slate-400 dark:text-slate-600">{t('history.empty_sub')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {cases.map(c => {
              const { employer, violation } = caseLabel(c)
              return (
                <li key={c.id} className="flex items-stretch">
                  <button
                    onClick={() => onRestore(c)}
                    className="flex-1 text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col gap-1 min-w-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{employer}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-600 flex-shrink-0">{formatDate(c.created_at)}</span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{violation}</span>
                    {c.transcript && (
                      <span className="text-xs text-slate-400 dark:text-slate-600 truncate mt-0.5 italic">
                        "{c.transcript.slice(0, 80)}{c.transcript.length > 80 ? '…' : ''}"
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    aria-label={`Delete case for ${employer}`}
                    className="flex-shrink-0 px-3 text-slate-300 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-lg"
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-400 dark:text-slate-600 text-center">
          {t('history.note')}
        </p>
      </div>
    </div>
  )
}
