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
      setError('Mic access denied.')
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
    <div className="flex flex-col items-center gap-3">
      {state === 'recording' ? (
        <button
          onClick={stopRecording}
          className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white text-3xl animate-pulse"
        >
          ■
        </button>
      ) : (
        <button
          onClick={startRecording}
          disabled={state === 'loading'}
          className="w-20 h-20 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center text-white text-3xl"
        >
          {state === 'loading' ? '…' : '🎙'}
        </button>
      )}
      <p className="text-xs text-gray-400">
        {state === 'idle' && 'Click to record'}
        {state === 'recording' && 'Recording — click to stop'}
        {state === 'loading' && 'Transcribing…'}
        {state === 'error' && <span className="text-red-400">{error}</span>}
      </p>
    </div>
  )
}
