import { useState, useRef } from 'react'
import { useT } from '../LocaleContext'

export default function VoiceRecorder({ onTranscript }) {
  const t = useT()
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
      setError(t('recorder.mic_denied'))
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
    if (blob.size > 10 * 1024 * 1024) {
      setError(t('recorder.too_large'))
      setState('error')
      return
    }
    const form = new FormData()
    form.append('file', blob, 'recording.webm')
    try {
      const res = await fetch('http://localhost:8000/transcribe', { method: 'POST', body: form })
      if (!res.ok) throw new Error(t('recorder.failed'))
      const data = await res.json()
      onTranscript(data)
      setState('idle')
    } catch (e) {
      setError(e.message)
      setState('error')
    }
  }

  const isRecording = state === 'recording'
  const isLoading = state === 'loading'

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="relative">
        {isRecording && (
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping" />
        )}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          aria-label={isRecording ? t('recorder.recording') : isLoading ? t('recorder.loading') : t('recorder.idle')}
          aria-pressed={isRecording}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg
            ${isRecording
              ? 'bg-red-600 hover:bg-red-700 shadow-red-900/30 dark:shadow-red-900/50'
              : isLoading
              ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none'
              : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-blue-900/20 dark:shadow-blue-900/40'
            }`}
        >
          {isRecording
            ? <span aria-hidden="true" className="text-white text-xl font-bold">■</span>
            : isLoading
            ? <span aria-hidden="true" className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin block" />
            : <span aria-hidden="true">🎙️</span>
          }
        </button>
      </div>
      <p aria-live="polite" className="text-xs text-center min-h-[1.25rem]">
        {state === 'idle'      && <span className="text-slate-500 dark:text-slate-400">{t('recorder.idle')}</span>}
        {state === 'recording' && <span className="text-red-600 dark:text-red-400 font-medium">{t('recorder.recording')}</span>}
        {state === 'loading'   && <span className="text-slate-500 dark:text-slate-400">{t('recorder.loading')}</span>}
        {state === 'error'     && <span className="text-red-600 dark:text-red-400">{error}</span>}
      </p>
    </div>
  )
}
