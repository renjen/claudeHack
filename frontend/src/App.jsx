import { useEffect, useState } from 'react'
import VoiceRecorder from './components/VoiceRecorder'
import TextInput from './components/TextInput'
import TranscriptViewer from './components/TranscriptViewer'
import FactsPanel from './components/FactsPanel'
import ViolationBadge from './components/ViolationBadge'
import DemandLetter from './components/DemandLetter'
import DOLForm from './components/DOLForm'

const API = 'http://localhost:8000'

function Spinner({ label }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 flex items-center gap-3">
      <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
      <span className="text-sm text-gray-400">{label}</span>
    </div>
  )
}

export default function App() {
  const [backendStatus, setBackendStatus] = useState('checking...')
  const [tab, setTab] = useState('Voice')
  const [step, setStep] = useState('idle') // idle | extracting | analyzing | generating | complete | error
  const [error, setError] = useState(null)
  const [transcriptData, setTranscriptData] = useState(null)
  const [facts, setFacts] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [letter, setLetter] = useState(null)

  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(d => setBackendStatus(d.ok ? 'ok' : 'down'))
      .catch(() => setBackendStatus('down'))
  }, [])

  async function handleTranscript(data) {
    setTranscriptData(data)
    setFacts(null)
    setAnalysis(null)
    setLetter(null)
    setError(null)

    try {
      setStep('extracting')
      const extractRes = await fetch(`${API}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: data.transcript }),
      })
      if (!extractRes.ok) throw new Error('Fact extraction failed')
      const factsData = await extractRes.json()
      setFacts(factsData)

      setStep('analyzing')
      const analyzeRes = await fetch(`${API}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facts: factsData }),
      })
      if (!analyzeRes.ok) throw new Error('Violation analysis failed')
      const analysisData = await analyzeRes.json()
      setAnalysis(analysisData)

      setStep('generating')
      const letterRes = await fetch(`${API}/generate-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facts: factsData, violations: analysisData.violations }),
      })
      if (!letterRes.ok) throw new Error('Letter generation failed')
      const letterData = await letterRes.json()
      setLetter(letterData)

      setStep('complete')
    } catch (err) {
      setError(err.message)
      setStep('error')
    }
  }

  function reset() {
    setStep('idle')
    setError(null)
    setTranscriptData(null)
    setFacts(null)
    setAnalysis(null)
    setLetter(null)
  }

  const processing = ['extracting', 'analyzing', 'generating'].includes(step)

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-12 gap-6">

      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500">Wage Theft Watchdog</h1>
        <p className="text-gray-400 text-sm mt-1">AI-powered legal triage for workers</p>
        <span className={`mt-2 inline-block text-xs px-3 py-1 rounded-full font-mono ${
          backendStatus === 'ok' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
        }`}>
          Backend: {backendStatus}
        </span>
      </div>

      {/* Input — only when idle */}
      {step === 'idle' && (
        <div className="w-full max-w-lg bg-gray-900 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex gap-2">
            {['Voice', 'Type'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {t === 'Voice' ? '🎙 Voice' : '✏️ Type'}
              </button>
            ))}
          </div>
          {tab === 'Voice'
            ? <VoiceRecorder onTranscript={handleTranscript} />
            : <TextInput onTranscript={handleTranscript} />
          }
        </div>
      )}

      {/* Pipeline output */}
      {step !== 'idle' && (
        <div className="w-full max-w-lg flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-gray-500 font-mono uppercase tracking-wide">
              {step === 'complete' ? 'Analysis complete' : step === 'error' ? 'Error' : 'Processing…'}
            </span>
            <button
              onClick={reset}
              disabled={processing}
              className="text-xs text-gray-500 hover:text-gray-300 disabled:opacity-30"
            >
              ← Start over
            </button>
          </div>

          {/* Transcript */}
          {transcriptData && (
            <TranscriptViewer
              transcript={transcriptData.transcript}
              language={transcriptData.language}
              duration={transcriptData.duration_sec}
            />
          )}

          {/* Facts */}
          {step === 'extracting' && <Spinner label="Extracting facts…" />}
          {facts && <FactsPanel facts={facts} />}

          {/* Violations */}
          {step === 'analyzing' && <Spinner label="Analyzing violations…" />}
          {analysis?.violations?.map((v, i) => (
            <ViolationBadge key={i} violation={v} />
          ))}
          {analysis?.clarifications_needed?.length > 0 && (
            <div className="bg-yellow-950 border border-yellow-700 rounded-2xl p-4">
              <p className="text-xs font-semibold text-yellow-400 mb-2">Clarifications needed</p>
              <ul className="list-disc list-inside text-xs text-yellow-200 space-y-1">
                {analysis.clarifications_needed.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
          {analysis?.immigration_disclaimer && (
            <p className="text-xs text-gray-500 px-1">
              FLSA protections apply to all workers regardless of immigration status.
            </p>
          )}

          {/* Letter + DOL */}
          {step === 'generating' && <Spinner label="Drafting demand letter…" />}
          {letter && (
            <>
              <DemandLetter letter={letter.demand_letter} />
              <DOLForm prefill={letter.dol_prefill} />
            </>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="bg-red-950 border border-red-700 rounded-2xl p-4 text-sm text-red-300">
              {error}. Check the backend and try again.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
