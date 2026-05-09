export default function FactsPanel({ facts }) {
  const rows = [
    ['Employer',          facts.employer_name],
    ['Hours worked/week', facts.hours_worked_per_week],
    ['Hours paid/week',   facts.hours_paid_per_week],
    ['Hourly rate',       facts.hourly_rate != null ? `$${facts.hourly_rate}/hr` : null],
    ['Pay period',        facts.pay_period],
    ['Employment type',   facts.employment_type],
  ].filter(([, v]) => v != null)

  return (
    <section
      aria-label="Extracted facts"
      className="bg-white dark:bg-slate-900 rounded-2xl p-5 flex flex-col gap-4 border border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        Extracted Facts
      </span>
      {rows.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-xs text-slate-400 dark:text-slate-500">{label}</dt>
              <dd className="text-sm text-slate-800 dark:text-slate-100 font-medium">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
      {facts.raw_claims?.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex flex-col gap-1.5">
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Claims</p>
          {facts.raw_claims.map((c, i) => (
            <p key={i} className="text-sm text-amber-700 dark:text-amber-300 italic leading-snug">"{c}"</p>
          ))}
        </div>
      )}
    </section>
  )
}
