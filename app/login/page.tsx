'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authenticate, setAuthSession, type UserRole } from '@/lib/auth'
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

    if (authenticate(username, password, loginRole)) {
      setAuthSession(loginRole)
      router.push(loginRole === 'worker' ? '/worker' : '/dashboard')
    } else {
      setError(`Invalid ${loginRole} username or password`)
    }

    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Factory Dashboard</h1>
          <p>Please login to continue</p>
        </div>

        <div className="login-role-toggle">
          <button
            type="button"
            className={`login-role-btn ${loginRole === 'admin' ? 'active' : ''}`}
            onClick={() => { setLoginRole('admin'); setError('') }}
          >
            Login as Admin
          </button>
          <button
            type="button"
            className={`login-role-btn ${loginRole === 'worker' ? 'active' : ''}`}
            onClick={() => { setLoginRole('worker'); setError('') }}
          >
            Login as Worker
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
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
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary login-button"
          >
            {loading ? 'Logging in...' : loginRole === 'admin' ? 'Login as Admin' : 'Login as Worker'}
          </button>
        </form>
      </div>
    </div>
  )
}
