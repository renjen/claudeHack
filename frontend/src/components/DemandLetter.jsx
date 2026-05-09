import { useState } from 'react'

export default function DemandLetter({ letter }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-5 flex flex-col gap-3 border border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Demand Letter</span>
          <p className="text-xs text-gray-600 mt-0.5">Ready to send or submit with your DOL complaint</p>
        </div>
        <button
          onClick={copy}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 ${
            copied ? 'bg-green-800 text-green-300' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-sans bg-gray-950 rounded-xl p-4 max-h-96 overflow-y-auto border border-gray-800">
        {letter}
      </pre>
    </div>
  )
}
