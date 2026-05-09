import { useState } from 'react'

const STORAGE_KEY = 'wtw_text_draft'

export default function TextInput({ onTranscript }) {
  const [text, setText] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setText(e.target.value)
    sessionStorage.setItem(STORAGE_KEY, e.target.value)
  }

  function handleSubmit() {
    if (!text.trim()) return
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
        Describe your work situation
      </label>
      <textarea
        id="situation-input"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Describe your situation in your own words… (e.g. 'I work 12 hours a day but my boss only pays me for 8')"
        rows={5}
        aria-describedby="text-input-hint"
        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl p-3 text-sm resize-none border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      />
      <div className="flex items-center justify-between">
        <span id="text-input-hint" className="text-xs text-slate-400 dark:text-slate-600">
          Tip: Ctrl+Enter to submit
        </span>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          aria-label="Analyze my situation"
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
        >
          Analyze →
        </button>
      </div>
    </div>
  )
}
