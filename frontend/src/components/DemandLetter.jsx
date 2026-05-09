import { useState } from 'react'

export default function DemandLetter({ letter }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Demand Letter</span>
        <button
          onClick={copy}
          className="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-sans bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
        {letter}
      </pre>
    </div>
  )
}
