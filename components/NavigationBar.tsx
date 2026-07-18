'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { clearAuthSession } from '@/lib/auth'
import './dashboard.css'

const NAV_LINKS = [
  { path: '/dashboard', icon: '➕', label: 'Create Lot', match: (pathname: string | null) => pathname === '/dashboard' || pathname === '/' },
  { path: '/lots', icon: '📋', label: 'All Lots', match: (pathname: string | null) => !!pathname?.startsWith('/lots') },
  { path: '/jobcards', icon: '📄', label: 'Job Cards', match: (pathname: string | null) => !!pathname?.startsWith('/jobcards') },
  { path: '/developer', icon: '⚙️', label: 'Developer', match: (pathname: string | null) => !!pathname?.startsWith('/developer') },
  { path: '/worker-analytics', icon: '📈', label: 'Worker Analytics', match: (pathname: string | null) => !!pathname?.startsWith('/worker-analytics') },
]

export default function NavigationBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const handleLogout = () => {
    clearAuthSession()
    router.push('/login')
  }

  const navigate = (path: string) => {
    setMenuOpen(false)
    router.push(path)
  }

  return (
    <nav className="main-navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          <span className="navbar-icon">🏭</span>
          <span className="navbar-title">Factory Dashboard</span>
        </div>

        <div className="navbar-links navbar-links--desktop">
          {NAV_LINKS.map((link) => (
            <button
              key={link.path}
              className={`navbar-link ${link.match(pathname) ? 'active' : ''}`}
              onClick={() => navigate(link.path)}
            >
              <span className="navbar-link-icon">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </div>

        <div className="navbar-actions">
          <button className="navbar-logout navbar-logout--desktop" onClick={handleLogout}>
            <span className="navbar-link-icon">🚪</span>
            Logout
          </button>
          <button
            type="button"
            className={`navbar-toggle ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="navbar-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}

      <div className={`navbar-drawer ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <div className="navbar-drawer-links">
          {NAV_LINKS.map((link) => (
            <button
              key={link.path}
              className={`navbar-drawer-link ${link.match(pathname) ? 'active' : ''}`}
              onClick={() => navigate(link.path)}
            >
              <span className="navbar-link-icon">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </div>
        <button className="navbar-drawer-logout" onClick={handleLogout}>
          <span className="navbar-link-icon">🚪</span>
          Logout
        </button>
      </div>
    </nav>
  )
}
