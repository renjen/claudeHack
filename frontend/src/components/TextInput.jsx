import { useState } from 'react'
import { useT } from '../LocaleContext'

const STORAGE_KEY = 'wtw_text_draft'

export default function TextInput({ onTranscript }) {
  const t = useT()
  const [text, setText] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setText(e.target.value)
    sessionStorage.setItem(STORAGE_KEY, e.target.value)
  }

  const CHAR_LIMIT = 5000
  const overLimit = text.length > CHAR_LIMIT

  function handleSubmit() {
    if (!text.trim() || overLimit) return
    setLoading(true)
    onTranscript({ transcript: text.trim(), language: 'en', duration_sec: null })
    sessionStorage.removeItem(STORAGE_KEY)
    setText('')
    setLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <label htmlFor="situation-input" className="sr-only">
        {t('text.label')}
      </label>
      <textarea
        id="situation-input"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={t('text.placeholder')}
        rows={5}
        aria-describedby="text-input-hint"
        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl p-3 text-sm resize-none border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      />
      {overLimit && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {t('text.too_long')}
        </p>
      )}
      <div className="flex items-center justify-between">
        <span id="text-input-hint" className="text-xs text-slate-400 dark:text-slate-600">
          {t('text.tip')}
        </span>
        <div className="flex items-center gap-3">
          <span className={`text-xs tabular-nums ${overLimit ? 'text-red-500' : 'text-slate-400 dark:text-slate-600'}`}>
            {text.length} / {CHAR_LIMIT.toLocaleString()}
          </span>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || loading || overLimit}
            aria-label={t('text.label')}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
          >
            {t('text.analyze')}
          </button>
        </div>
      </div>
    </div>
  )
}
