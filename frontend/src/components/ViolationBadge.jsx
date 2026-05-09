const SEVERITY = {
  high:   { pill: 'bg-red-900/80 text-red-300 border border-red-700',    dot: 'bg-red-500' },
  medium: { pill: 'bg-yellow-900/80 text-yellow-300 border border-yellow-700', dot: 'bg-yellow-500' },
  low:    { pill: 'bg-blue-900/80 text-blue-300 border border-blue-700',  dot: 'bg-blue-500' },
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
    <div className="bg-gray-900 rounded-2xl p-5 flex flex-col gap-3 border border-gray-800">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-700/80 text-red-100 border border-red-600">
          {TYPE_LABEL[violation.type] ?? violation.type}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${sev.pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sev.dot}`} />
          {violation.severity}
        </span>
      </div>

      <p className="text-sm text-gray-100 leading-relaxed">{violation.description}</p>

      {violation.relevant_law && (
        <div className="text-xs text-blue-300 font-mono bg-blue-950/40 rounded-lg px-3 py-2 border border-blue-900/50">
          {violation.relevant_law}
        </div>
      )}

      {violation.verbatim_citation && (
        <blockquote className="border-l-2 border-blue-700 pl-3 text-xs text-gray-400 italic leading-relaxed">
          "{violation.verbatim_citation}"
        </blockquote>
      )}

      {violation.estimated_damages && (
        <div className="bg-green-950/60 border border-green-800/60 rounded-xl p-3">
          <div className="text-xs text-green-500 font-semibold uppercase tracking-wide mb-1">Estimated Damages</div>
          <div className="text-sm text-green-300 font-medium">{violation.estimated_damages}</div>
        </div>
      )}
    </div>
  )
}
