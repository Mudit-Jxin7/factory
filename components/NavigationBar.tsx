'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { clearAuthSession } from '@/lib/auth'
import {
  IconPlus,
  IconList,
  IconFile,
  IconSettings,
  IconChart,
  IconLogout,
  IconFactory,
} from './Icons'
import './dashboard.css'

const NAV_LINKS: {
  path: string
  icon: ReactNode
  label: string
  match: (pathname: string | null) => boolean
}[] = [
  { path: '/dashboard', icon: <IconPlus size={16} />, label: 'Create Lot', match: (pathname) => pathname === '/dashboard' || pathname === '/' },
  { path: '/lots', icon: <IconList size={16} />, label: 'All Lots', match: (pathname) => !!pathname?.startsWith('/lots') },
  { path: '/jobcards', icon: <IconFile size={16} />, label: 'Job Cards', match: (pathname) => !!pathname?.startsWith('/jobcards') },
  { path: '/developer', icon: <IconSettings size={16} />, label: 'Developer', match: (pathname) => !!pathname?.startsWith('/developer') },
  { path: '/worker-analytics', icon: <IconChart size={16} />, label: 'Worker Analytics', match: (pathname) => !!pathname?.startsWith('/worker-analytics') },
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
          <span className="navbar-brand-mark">
            <IconFactory size={18} />
          </span>
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
            <span className="navbar-link-icon"><IconLogout size={16} /></span>
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
          <span className="navbar-link-icon"><IconLogout size={16} /></span>
          Logout
        </button>
      </div>
    </nav>
  )
}
