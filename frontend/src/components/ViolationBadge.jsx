const SEVERITY = {
  high:   'bg-red-900 text-red-300 border border-red-700',
  medium: 'bg-yellow-900 text-yellow-300 border border-yellow-700',
  low:    'bg-blue-900 text-blue-300 border border-blue-700',
}

const TYPE_LABEL = {
  overtime_theft:   'Overtime Theft',
  minimum_wage:     'Minimum Wage',
  tip_skimming:     'Tip Skimming',
  misclassification:'Misclassification',
  off_the_clock:    'Off the Clock',
  other:            'Violation',
}

export default function ViolationBadge({ violation }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-700 text-white">
          {TYPE_LABEL[violation.type] ?? violation.type}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEVERITY[violation.severity] ?? ''}`}>
          {violation.severity}
        </span>
      </div>
      <p className="text-sm text-gray-100">{violation.description}</p>
      {violation.relevant_law && (
        <div className="text-xs text-blue-300 font-mono">{violation.relevant_law}</div>
      )}
      {violation.verbatim_citation && (
        <blockquote className="border-l-2 border-blue-600 pl-3 text-xs text-gray-400 italic">
          "{violation.verbatim_citation}"
        </blockquote>
      )}
      {violation.estimated_damages && (
        <div className="bg-gray-800 rounded-lg p-3 text-sm text-green-300">
          {violation.estimated_damages}
        </div>
      )}
    </div>
  )
}
