export default function TranscriptViewer({ transcript, language, duration }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Transcript</span>
        <span className="text-xs px-2 py-0.5 bg-gray-800 rounded-full text-gray-300 font-mono">
          {language ?? 'en'}{duration ? ` · ${duration.toFixed(1)}s` : ''}
        </span>
      </div>
      <p className="text-sm text-gray-100 leading-relaxed">{transcript}</p>
    </div>
  )
}
