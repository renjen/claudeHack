export default function FactsPanel({ facts }) {
  const rows = [
    ['Employer', facts.employer_name],
    ['Hours worked / week', facts.hours_worked_per_week],
    ['Hours paid / week', facts.hours_paid_per_week],
    ['Hourly rate', facts.hourly_rate != null ? `$${facts.hourly_rate}/hr` : null],
    ['Pay period', facts.pay_period],
    ['Employment type', facts.employment_type],
  ].filter(([, v]) => v != null)

  return (
    <div className="bg-gray-900 rounded-2xl p-5 flex flex-col gap-3">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Extracted Facts</span>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-sm text-gray-100 font-medium">{String(value)}</div>
          </div>
        ))}
      </div>
      {facts.raw_claims?.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-1">Claims</div>
          {facts.raw_claims.map((c, i) => (
            <p key={i} className="text-sm text-yellow-300 italic">"{c}"</p>
          ))}
        </div>
      )}
    </div>
  )
}
