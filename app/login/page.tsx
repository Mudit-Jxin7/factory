'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authenticate, setAuthSession, type UserRole } from '@/lib/auth'
import { IconFactory } from '@/components/Icons'
import '@/components/dashboard.css'

export default function Login() {
  const [loginRole, setLoginRole] = useState<UserRole>('admin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Brief delay so the loading state is perceptible on fast auth
    await new Promise((r) => setTimeout(r, 280))

    if (authenticate(username, password, loginRole)) {
      setAuthSession(loginRole)
      router.push(loginRole === 'worker' ? '/worker' : '/dashboard')
    } else {
      setError(`Invalid ${loginRole === 'worker' ? 'staff' : loginRole} username or password`)
      setLoading(false)
    }
  }

  return (
    <div className="login-container px-4 sm:px-6 md:px-8">
      <div className="login-card w-full max-w-[420px]">
        <div className="login-header">
          <div className="login-brand-mark" aria-hidden>
            <IconFactory size={28} />
          </div>
          <h1>Factory</h1>
          <p>Sign in to your production workspace</p>
        </div>

        <div className="login-role-toggle" role="tablist" aria-label="Login role">
          <button
            type="button"
            role="tab"
            aria-selected={loginRole === 'admin'}
            className={`login-role-btn ${loginRole === 'admin' ? 'active' : ''}`}
            onClick={() => { setLoginRole('admin'); setError('') }}
          >
            Admin
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={loginRole === 'worker'}
            className={`login-role-btn ${loginRole === 'worker' ? 'active' : ''}`}
            onClick={() => { setLoginRole('worker'); setError('') }}
          >
            Staff
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary login-button"
          >
            {loading && <span className="spinner-sm" aria-hidden />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
