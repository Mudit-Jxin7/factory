'use client'

import { useEffect } from 'react'
import './dashboard.css'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type: ToastType
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  }

  const colors = {
    success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724', icon: '#28a745' },
    error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24', icon: '#dc3545' },
    info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460', icon: '#17a2b8' },
    warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404', icon: '#ffc107' },
  }

  const color = colors[type]

  return (
    <div
      className="toast-container"
      style={{
        minWidth: '300px',
        maxWidth: '400px',
        backgroundColor: color.bg,
        border: `2px solid ${color.border}`,
        borderRadius: '8px',
        padding: '16px 20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'slideInRight 0.3s ease-out',
        transition: 'all 0.3s ease-out',
        cursor: 'pointer',
      }}
      onClick={onClose}
    >
      <span style={{ fontSize: '22px', flexShrink: 0 }}>{icons[type]}</span>
      <span style={{ color: color.text, fontSize: '16px', fontWeight: '500', flex: 1 }}>
        {message}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        style={{
          background: 'none',
          border: 'none',
          color: color.text,
          fontSize: '22px',
          cursor: 'pointer',
          padding: '0',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
      >
        ×
      </button>
    </div>
  )
}
