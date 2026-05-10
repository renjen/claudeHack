import { useState } from 'react'
import { useT } from '../LocaleContext'

const API = 'http://localhost:8000'

export default function AuthModal({ onAuth, onClose, initialTab = 'login' }) {
  const t = useT()
  const [tab, setTab] = useState(initialTab)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showRegisterCTA, setShowRegisterCTA] = useState(false)

  function switchTab(newTab) {
    setTab(newTab)
    setError(null)
    setShowRegisterCTA(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setShowRegisterCTA(false)
    if (tab === 'register' && password.length < 5) {
      setError('Password must be at least 5 characters')
      return
    }
    if (tab === 'register' && password.length > 15) {
      setError('Password must be at most 15 characters')
      return
    }
    setLoading(true)
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register'
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Something went wrong')
        if (tab === 'login') setShowRegisterCTA(true)
        return
      }
      onAuth({ token: data.access_token, username: data.username })
    } catch {
      setError('Could not reach the server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-sm flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="font-bold text-slate-900 dark:text-slate-50 text-lg">
            {tab === 'login' ? t('auth.welcome') : t('auth.create_account')}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mx-6">
          {['login', 'register'].map(tabKey => (
            <button
              key={tabKey}
              onClick={() => switchTab(tabKey)}
              className={`flex-1 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors capitalize ${
                tab === tabKey
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tabKey === 'login' ? t('auth.login_tab') : t('auth.signup_tab')}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-username" className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('auth.username')}
            </label>
            <input
              id="auth-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              minLength={3}
              maxLength={30}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="your_username"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-password" className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('auth.password')} {tab === 'register' && <span className="text-slate-400">{t('auth.password_hint')}</span>}
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={5}
              maxLength={15}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div role="alert" className="flex flex-col gap-2">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              {showRegisterCTA && (
                <button
                  type="button"
                  onClick={() => switchTab('register')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline text-left font-medium"
                >
                  {t('auth.no_account')}
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors shadow-sm"
          >
            {loading ? t('auth.submitting') : tab === 'login' ? t('auth.login_tab') : t('auth.create_account')}
          </button>

          <p className="text-xs text-slate-400 dark:text-slate-600 text-center">
            {t('auth.note')}
          </p>
        </form>
      </div>
    </div>
  )
}
