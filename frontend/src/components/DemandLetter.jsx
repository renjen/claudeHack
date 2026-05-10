import { useState } from 'react'
import { stripHtml } from '../utils/sanitize'
import PiiToast from './PiiToast'
import { useT } from '../LocaleContext'

export default function DemandLetter({ letter }) {
  const t = useT()
  const safeLetterText = stripHtml(letter)
  const [copied, setCopied] = useState(false)
  const [piiToast, setPiiToast] = useState(false)
  const [downloading, setDownloading] = useState(false)

  function copy() {
    navigator.clipboard.writeText(safeLetterText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setPiiToast(true)
    setTimeout(() => setPiiToast(false), 4000)
  }

  async function downloadPDF() {
    setDownloading(true)
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'letter' })
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(safeLetterText, 180)
    doc.text(lines, 15, 20)
    doc.save('demand-letter.pdf')
    setDownloading(false)
  }

  return (
    <>
    <PiiToast visible={piiToast} />
    <section
      aria-label={t('letter.title')}
      className="bg-white dark:bg-slate-900 rounded-2xl p-5 flex flex-col gap-3 border border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {t('letter.title')}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">
            {t('letter.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={downloadPDF}
            disabled={downloading}
            aria-label="Download letter as PDF"
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
          >
            {downloading ? t('letter.saving') : 'PDF'}
          </button>
          <button
            onClick={copy}
            aria-label={copied ? t('letter.copied') : t('letter.copy')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 border ${
              copied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {copied ? t('letter.copied') : t('letter.copy')}
          </button>
        </div>
      </div>
      <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-sans bg-slate-50 dark:bg-slate-950 rounded-xl p-4 max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-800">
        {safeLetterText}
      </pre>
    </section>
    </>
  )
}
