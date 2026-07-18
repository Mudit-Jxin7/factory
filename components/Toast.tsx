'use client'

import { useEffect } from 'react'
import { IconCheck, IconX, IconInfo, IconAlert } from './Icons'
import './dashboard.css'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type: ToastType
  isVisible: boolean
  onClose: () => void
  duration?: number
}

const TOAST_ICONS = {
  success: <IconCheck size={16} />,
  error: <IconX size={16} />,
  info: <IconInfo size={16} />,
  warning: <IconAlert size={16} />,
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

  return (
    <div
      className={`toast toast--${type}`}
      onClick={onClose}
      role="status"
    >
      <span className="toast-icon">{TOAST_ICONS[type]}</span>
      <span className="toast-message">{message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Dismiss"
      >
        <IconX size={14} />
      </button>
    </div>
  )
}
