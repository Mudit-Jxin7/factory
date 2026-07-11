'use client'

import { useRouter } from 'next/navigation'
import { clearAuthSession } from '@/lib/auth'
import './dashboard.css'

export default function WorkerNavigationBar() {
  const router = useRouter()

  const handleLogout = () => {
    clearAuthSession()
    router.push('/login')
  }

  return (
    <nav className="main-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="navbar-icon">🏭</span>
          <span className="navbar-title">Factory Worker</span>
        </div>

        <div className="navbar-links">
          <button className="navbar-link active">
            <span className="navbar-link-icon">📄</span>
            Job Cards
          </button>
        </div>

        <div className="navbar-actions">
          <button className="navbar-logout" onClick={handleLogout}>
            <span className="navbar-link-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
