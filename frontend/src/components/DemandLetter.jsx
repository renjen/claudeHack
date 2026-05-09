import { useState } from 'react'

export default function DemandLetter({ letter }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section
      aria-label="Demand letter"
      className="bg-white dark:bg-slate-900 rounded-2xl p-5 flex flex-col gap-3 border border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Demand Letter
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">
            Ready to send or submit with your DOL complaint
          </p>
        </div>
        <button
          onClick={copy}
          aria-label={copied ? 'Letter copied to clipboard' : 'Copy letter to clipboard'}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 border ${
            copied
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-sans bg-slate-50 dark:bg-slate-950 rounded-xl p-4 max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-800">
        {letter}
      </pre>
    </section>
  )
}
