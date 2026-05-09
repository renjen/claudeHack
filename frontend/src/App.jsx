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
  { key: 'extracting', label: 'Extracting Facts' },
  { key: 'analyzing',  label: 'Finding Violations' },
  { key: 'generating', label: 'Writing Letter' },
  { key: 'complete',   label: 'Complete' },
]

const HOW_IT_WORKS = [
  { n: '01', icon: '🎙️', title: 'Describe Your Situation', desc: 'Voice or text, in any language. Your recording is never stored on our servers.' },
  { n: '02', icon: '⚖️', title: 'We Analyze the Law',      desc: 'Your facts are matched against FLSA statutes with exact verbatim citations.' },
  { n: '03', icon: '📄', title: 'Take Action',             desc: 'Receive a demand letter and pre-filled DOL complaint form, ready to send.' },
]

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  )
}

function StepBar({ step }) {
  const order = PIPELINE_STEPS.map(s => s.key)
  const currentIdx = order.indexOf(step)

  return (
    <nav aria-label="Analysis progress" className="flex-1">
      <ol className="flex items-center w-full gap-2" role="list">
        {PIPELINE_STEPS.map((s, i) => {
          const done = step === 'complete' || currentIdx > i
          const active = order[currentIdx] === s.key && step !== 'complete'
          return (
            <li key={s.key} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  aria-current={active ? 'step' : undefined}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                    ${done   ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                    : active ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    :          'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium truncate transition-colors hidden sm:block
                  ${done   ? 'text-emerald-600 dark:text-emerald-400'
                  : active ? 'text-blue-600 dark:text-blue-400'
                  :          'text-slate-400 dark:text-slate-600'}`}>
                  {s.label}
                </span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-1 transition-colors ${done ? 'bg-emerald-300 dark:bg-emerald-800' : 'bg-slate-200 dark:bg-slate-800'}`} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function Spinner({ label }) {
  return (
    <div role="status" aria-live="polite" className="bg-white dark:bg-slate-900 rounded-2xl p-5 flex items-center gap-3 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem('wtw-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  })
  const [backendStatus, setBackendStatus] = useState('checking')
  const [tab, setTab] = useState('Voice')
  const [step, setStep] = useState('idle')
  const [error, setError] = useState(null)
  const [transcriptData, setTranscriptData] = useState(null)
  const [facts, setFacts] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [letter, setLetter] = useState(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('wtw-theme', theme)
  }, [theme])

  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(d => setBackendStatus(d.ok ? 'ok' : 'down'))
      .catch(() => setBackendStatus('down'))
  }, [])

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  async function handleTranscript(data) {
    setTranscriptData(data)
    setFacts(null); setAnalysis(null); setLetter(null); setError(null)

    try {
      setStep('extracting')
      const extractRes = await fetch(`${API}/extract`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: data.transcript }),
      })
      if (!extractRes.ok) throw new Error('Fact extraction failed')
      const factsData = await extractRes.json()
      setFacts(factsData)

      setStep('analyzing')
      const analyzeRes = await fetch(`${API}/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facts: factsData }),
      })
      if (!analyzeRes.ok) throw new Error('Violation analysis failed')
      const analysisData = await analyzeRes.json()
      setAnalysis(analysisData)

      setStep('generating')
      const letterRes = await fetch(`${API}/generate-letter`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
    setStep('idle'); setError(null)
    setTranscriptData(null); setFacts(null); setAnalysis(null); setLetter(null)
  }

  const processing = ['extracting', 'analyzing', 'generating'].includes(step)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col transition-colors duration-200">

      {/* Nav */}
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="text-xl">⚖️</span>
            <span className="font-bold tracking-tight text-base">
              <span className="text-red-600 dark:text-red-400">Wage Theft</span>
              {' '}
              <span className="text-slate-900 dark:text-slate-50">Watchdog</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {backendStatus !== 'checking' && (
              <span
                role="status"
                aria-label={`Service ${backendStatus === 'ok' ? 'online' : 'offline'}`}
                className={`hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium border ${
                  backendStatus === 'ok'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900'
                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900'
                }`}
              >
                <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {backendStatus === 'ok' ? 'Service online' : 'Service offline'}
              </span>
            )}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      {step === 'idle' && (
        <section className="relative bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-20 overflow-hidden">
          <div aria-hidden="true" className="hero-grid absolute inset-0 opacity-60 dark:opacity-100" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-5">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-full text-xs font-semibold border border-red-200 dark:border-red-900">
              <span aria-hidden="true">⚖️</span>
              AI-Powered Legal Triage for Workers
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Get the legal help<br />
              <span className="text-red-600 dark:text-red-400">you deserve.</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Describe your situation in any language. Get FLSA violation analysis,
              a demand letter, and DOL complaint fields — in seconds.
            </p>
          </div>
        </section>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">

        {/* Idle: 2-col — steps left, input right */}
        {step === 'idle' && (
          <div className="grid md:grid-cols-5 gap-10 lg:gap-16 items-start">

            {/* Left: How it works */}
            <div className="md:col-span-2 flex flex-col gap-10">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                How it works
              </h2>
              {HOW_IT_WORKS.map(({ n, title, desc }, i) => (
                <div key={n} className="flex gap-4 items-start">
                  <span aria-hidden="true" className="text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none flex-shrink-0 w-16 text-right">
                    {n}
                  </span>
                  <div className="pt-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Input */}
            <div className="md:col-span-3">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Tab bar */}
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                  {['Voice', 'Type'].map(t => (
                    <button
                      key={t}
                      role="tab"
                      aria-selected={tab === t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                        tab === t
                          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                          : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {t === 'Voice' ? '🎙️  Voice' : '✏️  Type'}
                    </button>
                  ))}
                </div>
                <div role="tabpanel" className="p-6">
                  {tab === 'Voice'
                    ? <VoiceRecorder onTranscript={handleTranscript} />
                    : <TextInput onTranscript={handleTranscript} />
                  }
                </div>
                <div className="px-6 pb-5 pt-0">
                  <p className="text-xs text-slate-400 dark:text-slate-600 text-center">
                    Supports any language · Voice recordings are never stored
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline output: full-width progress + 2-col results */}
        {step !== 'idle' && (
          <div className="flex flex-col gap-6">

            {/* Progress bar card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-5 py-4 flex items-center gap-5">
              <button
                onClick={reset}
                disabled={processing}
                aria-label="Start a new analysis"
                className="text-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 transition-colors flex-shrink-0 underline underline-offset-2 whitespace-nowrap"
              >
                ← New analysis
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
              {step !== 'error' && <StepBar step={step} />}
            </div>

            {/* 2-column: context | outputs */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">

              {/* Left: what you said + extracted facts */}
              <div className="flex flex-col gap-4">
                {transcriptData && (
                  <TranscriptViewer
                    transcript={transcriptData.transcript}
                    language={transcriptData.language}
                    duration={transcriptData.duration_sec}
                  />
                )}
                {step === 'extracting' && <Spinner label="Extracting facts from your statement…" />}
                {facts && <FactsPanel facts={facts} />}
              </div>

              {/* Right: violations + letter + DOL */}
              <div className="flex flex-col gap-4">
                {step === 'analyzing' && <Spinner label="Searching FLSA law for violations…" />}

                {analysis?.violations?.map((v, i) => <ViolationBadge key={i} violation={v} />)}

                {analysis?.clarifications_needed?.length > 0 && (
                  <div role="alert" className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">Clarifications Needed</p>
                    <ul className="list-disc list-inside text-sm text-amber-800 dark:text-amber-200 space-y-1">
                      {analysis.clarifications_needed.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}

                {analysis?.immigration_disclaimer && (
                  <p className="text-xs text-slate-500 px-1 italic">
                    FLSA protections apply equally to all workers regardless of immigration status.
                  </p>
                )}

                {step === 'generating' && <Spinner label="Drafting demand letter with citations…" />}

                {letter && (
                  <>
                    <DemandLetter letter={letter.demand_letter} />
                    <DOLForm prefill={letter.dol_prefill} />
                  </>
                )}

                {step === 'error' && (
                  <div role="alert" className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl p-5">
                    <strong className="block text-red-700 dark:text-red-400 text-sm mb-1">Something went wrong</strong>
                    <p className="text-sm text-red-600 dark:text-red-300">{error}. Check that the backend is running and try again.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-bold text-sm tracking-tight">
            <span className="text-red-600 dark:text-red-400">Wage Theft</span>
            {' '}
            <span className="text-slate-400 dark:text-slate-600">Watchdog</span>
          </span>
          <p className="text-xs text-slate-400 dark:text-slate-600 text-center">
            Provides <strong className="text-slate-500 font-semibold">legal information</strong>, not legal advice.
            Always consult a licensed attorney for your specific situation.
          </p>
        </div>
      </footer>
    </div>
  )
}
