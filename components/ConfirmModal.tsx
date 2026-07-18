'use client'

import { IconAlert, IconInfo } from './Icons'
import './dashboard.css'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
}: ConfirmModalProps) {
  if (!isOpen) return null

  const icon = type === 'info' ? <IconInfo size={22} /> : <IconAlert size={22} />
  const confirmClass =
    type === 'danger' ? 'btn-confirm-danger'
      : type === 'info' ? 'btn-confirm-info'
        : 'btn-confirm-warning'

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className={`confirm-dialog confirm-dialog--${type}`}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div className="confirm-body">
          <div className="confirm-icon">{icon}</div>
          <div>
            <h3 id="confirm-title">{title}</h3>
            <p id="confirm-message">{message}</p>
          </div>
        </div>

        <div className="confirm-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className={confirmClass} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
