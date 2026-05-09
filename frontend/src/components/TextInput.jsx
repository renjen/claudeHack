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
    // Text input bypasses Whisper — pass directly as transcript
    onTranscript({ transcript: text.trim(), language: 'en', duration_sec: null })
    sessionStorage.removeItem(STORAGE_KEY)
    setText('')
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Describe your situation in your own words… (e.g. 'I work 12 hours a day but my boss only pays me for 8')"
        rows={5}
        className="w-full bg-gray-800 text-white rounded-lg p-3 text-sm resize-none border border-gray-700 focus:outline-none focus:border-blue-500"
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || loading}
        className="self-end px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg text-sm font-medium"
      >
        Analyze →
      </button>
    </div>
  )
}
