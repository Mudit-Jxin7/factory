'use client'

import { useRouter, usePathname } from 'next/navigation'
import './dashboard.css'

export default function NavigationBar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    router.push('/login')
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname?.startsWith(path)
  }

  return (
    <nav className="main-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="navbar-icon">🏭</span>
          <span className="navbar-title">Factory Dashboard</span>
        </div>
        
        <div className="navbar-links">
          <button
            className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => router.push('/dashboard')}
          >
            <span className="navbar-link-icon">📊</span>
            Dashboard
          </button>
          <button
            className={`navbar-link ${isActive('/lots') ? 'active' : ''}`}
            onClick={() => router.push('/lots')}
          >
            <span className="navbar-link-icon">📋</span>
            All Lots
          </button>
          <button
            className={`navbar-link ${isActive('/jobcards') ? 'active' : ''}`}
            onClick={() => router.push('/jobcards')}
          >
            <span className="navbar-link-icon">📄</span>
            Job Cards
          </button>
          <button
            className={`navbar-link ${isActive('/developer') ? 'active' : ''}`}
            onClick={() => router.push('/developer')}
          >
            <span className="navbar-link-icon">⚙️</span>
            Developer
          </button>
          <button
            className={`navbar-link ${isActive('/worker-analytics') ? 'active' : ''}`}
            onClick={() => router.push('/worker-analytics')}
          >
            <span className="navbar-link-icon">📈</span>
            Worker Analytics
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
