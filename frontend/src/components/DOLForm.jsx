import { useState } from 'react'

export default function DOLForm({ prefill }) {
  const [copied, setCopied] = useState(false)

  const rows = [
    ['Complainant',         prefill.complainant_name],
    ['Employer',            prefill.employer_name],
    ['Violation Type',      prefill.violation_type],
    ['Est. Back Wages',     prefill.estimated_back_wages],
    ['Period of Violation', prefill.period_of_violation],
    ['FLSA Section',        prefill.flsa_section],
  ].filter(([, v]) => v)

  function copy() {
    const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-5 flex flex-col gap-4 border border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">DOL Complaint Prefill</span>
          <p className="text-xs text-gray-600 mt-0.5">Copy these fields into the DOL complaint form</p>
        </div>
        <button
          onClick={copy}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 ${
            copied ? 'bg-green-800 text-green-300' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          {copied ? '✓ Copied' : 'Copy fields'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="bg-gray-950 rounded-lg px-3 py-2.5 border border-gray-800">
            <span className="text-xs text-gray-500 block mb-0.5">{label}</span>
            <span className="text-sm text-gray-100 font-medium">{value}</span>
          </div>
        ))}
      </div>

      <a
        href="https://www.dol.gov/agencies/whd/contact/complaints"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 hover:bg-blue-600 rounded-xl text-sm font-semibold text-white transition-colors"
      >
        File Complaint with DOL Wage &amp; Hour Division →
      </a>
    </div>
  )
}
