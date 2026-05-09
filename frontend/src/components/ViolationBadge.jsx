const SEVERITY = {
  high: {
    bar: 'bg-red-500',
    pill: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
    dot:  'bg-red-500',
  },
  medium: {
    bar: 'bg-amber-500',
    pill: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800',
    dot:  'bg-amber-500',
  },
  low: {
    bar: 'bg-blue-500',
    pill: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
    dot:  'bg-blue-500',
  },
}

const TYPE_LABEL = {
  overtime_theft:    'Overtime Theft',
  minimum_wage:      'Minimum Wage Violation',
  tip_skimming:      'Tip Skimming',
  misclassification: 'Misclassification',
  off_the_clock:     'Off-the-Clock Work',
  other:             'Labor Violation',
}

export default function ViolationBadge({ violation }) {
  const sev = SEVERITY[violation.severity] ?? SEVERITY.medium

  return (
    <article
      aria-label={`Violation: ${TYPE_LABEL[violation.type] ?? violation.type}`}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      {/* Top severity stripe */}
      <div aria-hidden="true" className={`h-1.5 w-full ${sev.bar}`} />

      <div className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">
              Violation Detected
            </p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 leading-tight">
              {TYPE_LABEL[violation.type] ?? violation.type}
            </h3>
          </div>
          <span className={`mt-0.5 flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${sev.pill}`}>
            <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
            {violation.severity}
          </span>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{violation.description}</p>

        {violation.relevant_law && (
          <div className="text-xs text-blue-700 dark:text-blue-300 font-mono bg-blue-50 dark:bg-blue-950/40 rounded-lg px-3 py-2.5 border border-blue-200 dark:border-blue-900/50">
            {violation.relevant_law}
          </div>
        )}

        {violation.verbatim_citation && (
          <blockquote className="border-l-2 border-slate-300 dark:border-slate-700 pl-4 text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">
            "{violation.verbatim_citation}"
          </blockquote>
        )}

        {violation.estimated_damages && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1.5">
              Estimated Damages
            </p>
            <p className="text-base font-bold text-emerald-800 dark:text-emerald-300">{violation.estimated_damages}</p>
          </div>
        )}
      </div>
    </article>
  )
}
