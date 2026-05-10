import { useState } from 'react'
import { useT } from '../LocaleContext'

const CHAR_LIMIT = 5000

export default function TranscriptEditor({ transcript, language, onConfirm }) {
  const t = useT()
  const [text, setText] = useState(transcript)
  const overLimit = text.length > CHAR_LIMIT
  const edited = text !== transcript

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{t('editor.title')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('editor.subtitle')}
          </p>
        </div>
        {language && (
          <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
            {language.toUpperCase()}
          </span>
        )}
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={7}
        aria-label={t('editor.title')}
        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-sm resize-none border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      />

      {overLimit && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {t('editor.too_long')}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs tabular-nums ${overLimit ? 'text-red-500' : 'text-slate-400 dark:text-slate-600'}`}>
          {text.length.toLocaleString()} / {CHAR_LIMIT.toLocaleString()}
        </span>
        <div className="flex items-center gap-3">
          {edited && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{t('editor.edited')}</span>
          )}
          <button
            onClick={() => onConfirm(text)}
            disabled={!text.trim() || overLimit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
          >
            {t('editor.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
