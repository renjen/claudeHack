import { useState } from 'react'
import { stripHtml } from '../utils/sanitize'
import PiiToast from './PiiToast'

export default function DOLForm({ prefill }) {
  const [copied, setCopied] = useState(false)
  const [piiToast, setPiiToast] = useState(false)

  const rows = [
    ['Complainant',         prefill.complainant_name],
    ['Employer',            prefill.employer_name],
    ['Violation Type',      prefill.violation_type],
    ['Est. Back Wages',     prefill.estimated_back_wages],
    ['Period of Violation', prefill.period_of_violation],
    ['FLSA Section',        prefill.flsa_section],
  ].filter(([, v]) => v).map(([k, v]) => [k, stripHtml(v)])

  function copy() {
    const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setPiiToast(true)
    setTimeout(() => setPiiToast(false), 4000)
  }

  return (
    <>
    <PiiToast visible={piiToast} />
    <section
      aria-label="DOL complaint prefill"
      className="bg-white dark:bg-slate-900 rounded-2xl p-5 flex flex-col gap-4 border border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            DOL Complaint Prefill
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">
            Copy these fields into the DOL complaint form
          </p>
        </div>
        <button
          onClick={copy}
          aria-label={copied ? 'Fields copied to clipboard' : 'Copy complaint fields to clipboard'}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 border ${
            copied
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {copied ? '✓ Copied' : 'Copy fields'}
        </button>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="bg-slate-50 dark:bg-slate-950 rounded-lg px-3 py-2.5 border border-slate-200 dark:border-slate-800">
            <dt className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">{label}</dt>
            <dd className="text-sm text-slate-800 dark:text-slate-100 font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <a
        href="https://www.dol.gov/agencies/whd/contact/complaints"
        target="_blank"
        rel="noreferrer"
        aria-label="File a complaint with the DOL Wage and Hour Division (opens in new tab)"
        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm"
      >
        File Complaint with DOL Wage &amp; Hour Division →
      </a>
    </section>
    </>
  )
}
