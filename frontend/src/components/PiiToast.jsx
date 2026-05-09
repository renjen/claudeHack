export default function PiiToast({ visible }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-50 flex items-start gap-3 max-w-sm px-4 py-3 rounded-xl border shadow-lg transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2 pointer-events-none'
      } bg-amber-50 border-amber-300 dark:bg-amber-950 dark:border-amber-700`}
    >
      <span aria-hidden="true" className="text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0">⚠</span>
      <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
        <strong className="font-semibold">Copied</strong> — this document contains personal details. Store it securely.
      </p>
    </div>
  )
}
