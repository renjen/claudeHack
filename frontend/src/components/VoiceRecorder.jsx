import { useState, useRef } from 'react'

export default function VoiceRecorder({ onTranscript }) {
  const [state, setState] = useState('idle') // idle | recording | loading | error
  const [error, setError] = useState(null)
  const mediaRecorder = useRef(null)
  const chunks = useRef([])

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks.current = []
      mediaRecorder.current = new MediaRecorder(stream)
      mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data)
      mediaRecorder.current.onstop = () => handleStop(stream)
      mediaRecorder.current.start()
      setState('recording')
    } catch {
      setError('Microphone access denied.')
      setState('error')
    }
  }

  function stopRecording() {
    mediaRecorder.current?.stop()
    setState('loading')
  }

  async function handleStop(stream) {
    stream.getTracks().forEach(t => t.stop())
    const blob = new Blob(chunks.current, { type: 'audio/webm' })
    const form = new FormData()
    form.append('file', blob, 'recording.webm')
    try {
      const res = await fetch('http://localhost:8000/transcribe', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Transcription failed')
      const data = await res.json()
      onTranscript(data)
      setState('idle')
    } catch (e) {
      setError(e.message)
      setState('error')
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="relative">
        {state === 'recording' && (
          <span className="absolute inset-0 rounded-full bg-red-500 opacity-25 animate-ping" />
        )}
        <button
          onClick={state === 'recording' ? stopRecording : startRecording}
          disabled={state === 'loading'}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-colors
            ${state === 'recording' ? 'bg-red-600 hover:bg-red-700'
            : state === 'loading'   ? 'bg-gray-700 cursor-not-allowed'
            :                         'bg-blue-600 hover:bg-blue-700'}`}
        >
          {state === 'recording'
            ? '■'
            : state === 'loading'
            ? <span className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin block" />
            : '🎙'}
        </button>
      </div>
      <p className="text-xs text-center">
        {state === 'idle' && <span className="text-gray-400">Tap to start recording — speak naturally</span>}
        {state === 'recording' && <span className="text-red-400 font-medium">Recording… tap to stop</span>}
        {state === 'loading' && <span className="text-gray-400">Transcribing with Whisper…</span>}
        {state === 'error' && <span className="text-red-400">{error}</span>}
      </p>
    </div>
  )
}
