export default function TranscriptViewer({ transcript, language, duration }) {
  return (
    <section
      aria-label="Your statement"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Your Statement
        </span>
        <span className="text-xs px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">
          {language ?? 'en'}{duration ? ` · ${duration.toFixed(1)}s` : ''}
        </span>
      </div>
      <div className="p-5 relative">
        <span aria-hidden="true" className="absolute top-3 left-4 text-5xl text-slate-100 dark:text-slate-800 font-serif leading-none select-none">
          "
        </span>
        <p className="relative z-10 text-sm text-slate-800 dark:text-slate-100 leading-relaxed pl-6">
          {transcript}
        </p>
      </div>
    </section>
  )
}
