import { useState } from 'react'

export default function DOLForm({ prefill }) {
  const [copied, setCopied] = useState(false)

  const rows = [
    ['Complainant',        prefill.complainant_name],
    ['Employer',           prefill.employer_name],
    ['Violation Type',     prefill.violation_type],
    ['Est. Back Wages',    prefill.estimated_back_wages],
    ['Period of Violation',prefill.period_of_violation],
    ['FLSA Section',       prefill.flsa_section],
  ].filter(([, v]) => v)

  function copy() {
    const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">DOL Complaint Prefill</span>
        <button
          onClick={copy}
          className="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-sm text-gray-100">{value}</span>
          </div>
        ))}
      </div>
      <a
        href="https://www.dol.gov/agencies/whd/contact/complaints"
        target="_blank"
        rel="noreferrer"
        className="text-xs text-blue-400 hover:text-blue-300 underline mt-1"
      >
        File with DOL Wage and Hour Division →
      </a>
    </div>
  )
}
