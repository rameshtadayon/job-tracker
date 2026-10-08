import { useState } from 'react'
import { api } from '../api'
import type { User } from '../types'
import '../App.css'

export default function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      onLogin(await api.auth.login(email, password))
    } catch (e) {
      const message = (e as Error).message
      if (message.includes('(429)')) setError('Too many failed attempts. Try again in 15 minutes.')
      else if (message.includes('(401)')) setError('Invalid email or password.')
      else setError(message)
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page login-page">
      <form className="app-form login-form" onSubmit={handleSubmit}>
        <div className="title-block">
          <h1>🚀 Job Hunt HQ</h1>
          <p className="tagline">Sign in to see your applications.</p>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <label className="notes-label">
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="notes-label">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  )
}
