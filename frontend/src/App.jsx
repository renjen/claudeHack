import { useEffect, useState } from 'react'
import VoiceRecorder from './components/VoiceRecorder'
import TextInput from './components/TextInput'
import TranscriptViewer from './components/TranscriptViewer'
import FactsPanel from './components/FactsPanel'
import ViolationBadge from './components/ViolationBadge'
import DemandLetter from './components/DemandLetter'
import DOLForm from './components/DOLForm'

const API = 'http://localhost:8000'

const PIPELINE_STEPS = [
  { key: 'extracting', label: 'Facts' },
  { key: 'analyzing',  label: 'Violations' },
  { key: 'generating', label: 'Letter' },
  { key: 'complete',   label: 'Done' },
]

function StepBar({ step }) {
  const order = PIPELINE_STEPS.map(s => s.key)
  const currentIdx = order.indexOf(step)

  return (
    <div className="flex items-center w-full gap-1">
      {PIPELINE_STEPS.map((s, i) => {
        const done = step === 'complete' || currentIdx > i
        const active = order[currentIdx] === s.key && step !== 'complete'
        return (
          <div key={s.key} className="flex items-center gap-1 flex-1 last:flex-none">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                ${done ? 'bg-green-600 text-white' : active ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-600'}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium truncate hidden sm:block transition-colors
                ${done ? 'text-green-400' : active ? 'text-blue-400' : 'text-gray-600'}`}>
                {s.label}
              </span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 transition-colors ${done ? 'bg-green-800' : 'bg-gray-800'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Spinner({ label }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 flex items-center gap-3 border border-gray-800">
      <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
      <span className="text-sm text-gray-400">{label}</span>
    </div>
  )
}

const HOW_IT_WORKS = [
  { icon: '🎙', title: 'Describe', desc: 'Voice or text — any language' },
  { icon: '⚖️', title: 'Analyze',  desc: 'FLSA law matched to your facts' },
  { icon: '📄', title: 'Act',      desc: 'Demand letter + DOL complaint ready' },
]

export default function App() {
  const [backendStatus, setBackendStatus] = useState('checking…')
  const [tab, setTab] = useState('Voice')
  const [step, setStep] = useState('idle')
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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-10 sm:py-16 gap-8">

      {/* Header */}
      <div className="text-center flex flex-col items-center gap-2">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          <span className="text-red-500">Wage Theft</span>
          <span className="text-white"> Watchdog</span>
        </h1>
        <p className="text-gray-400 text-sm max-w-xs sm:max-w-sm leading-relaxed">
          AI-powered legal triage for workers — describe your situation, get FLSA analysis in seconds.
        </p>
        <span className={`mt-1 inline-block text-xs px-3 py-1 rounded-full font-mono border ${
          backendStatus === 'ok'
            ? 'bg-green-900/50 text-green-300 border-green-800'
            : 'bg-red-900/50 text-red-300 border-red-800'
        }`}>
          backend {backendStatus}
        </span>
      </div>

      {/* Idle state — how it works + input */}
      {step === 'idle' && (
        <div className="w-full max-w-xl flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-3">
            {HOW_IT_WORKS.map(({ icon, title, desc }) => (
              <div key={title} className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
                <div className="text-xl mb-2">{icon}</div>
                <div className="text-sm font-semibold text-white">{title}</div>
                <div className="text-xs text-gray-500 mt-1 leading-snug">{desc}</div>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 flex flex-col gap-4">
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
            <p className="text-xs text-gray-600 text-center">
              Speaks any language. Recordings are never stored.
            </p>
          </div>
        </div>
      )}

      {/* Pipeline output */}
      {step !== 'idle' && (
        <div className="w-full max-w-xl flex flex-col gap-4">
          {/* Top bar */}
          <div className="flex items-center gap-4">
            <button
              onClick={reset}
              disabled={processing}
              className="text-xs text-gray-600 hover:text-gray-300 disabled:opacity-30 transition-colors flex-shrink-0"
            >
              ← New analysis
            </button>
            {step !== 'error' && <StepBar step={step} />}
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
          {step === 'extracting' && <Spinner label="Extracting facts from your statement…" />}
          {facts && <FactsPanel facts={facts} />}

          {/* Violations */}
          {step === 'analyzing' && <Spinner label="Searching FLSA law for violations…" />}
          {analysis?.violations?.map((v, i) => <ViolationBadge key={i} violation={v} />)}
          {analysis?.clarifications_needed?.length > 0 && (
            <div className="bg-yellow-950/60 border border-yellow-800 rounded-2xl p-4">
              <p className="text-xs font-semibold text-yellow-400 mb-2 uppercase tracking-wide">Clarifications Needed</p>
              <ul className="list-disc list-inside text-xs text-yellow-200 space-y-1">
                {analysis.clarifications_needed.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
          {analysis?.immigration_disclaimer && (
            <p className="text-xs text-gray-600 px-1 italic">
              FLSA protections apply equally to all workers regardless of immigration status.
            </p>
          )}

          {/* Letter + DOL */}
          {step === 'generating' && <Spinner label="Drafting demand letter with citations…" />}
          {letter && (
            <>
              <DemandLetter letter={letter.demand_letter} />
              <DOLForm prefill={letter.dol_prefill} />
            </>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="bg-red-950/60 border border-red-800 rounded-2xl p-4">
              <strong className="block text-red-400 text-sm mb-1">Error</strong>
              <p className="text-sm text-red-300">{error}. Check that the backend is running and try again.</p>
            </div>
          )}
        </div>
      )}

      {/* Footer disclaimer */}
      <p className="text-xs text-gray-700 text-center max-w-xs mt-2">
        This tool provides legal information, not legal advice. Always consult a licensed attorney for your specific situation.
      </p>
    </div>
  )
}
