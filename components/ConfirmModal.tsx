'use client'

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

  const typeStyles = {
    danger: {
      confirmBg: '#dc3545',
      confirmHover: '#c82333',
      icon: '⚠️',
      border: '#f5c6cb',
    },
    warning: {
      confirmBg: '#ffc107',
      confirmHover: '#e0a800',
      icon: '⚠️',
      border: '#ffeaa7',
    },
    info: {
      confirmBg: '#17a2b8',
      confirmHover: '#138496',
      icon: 'ℹ️',
      border: '#bee5eb',
    },
  }

  const style = typeStyles[type]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '28px',
          maxWidth: '450px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          animation: 'slideUp 0.3s ease-out',
          border: `2px solid ${style.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '36px',
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {style.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: 0,
                marginBottom: '8px',
                fontSize: '22px',
                fontWeight: '600',
                color: '#1a1a1a',
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '16px',
                color: '#6c757d',
                lineHeight: '1.5',
              }}
            >
              {message}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px',
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: '500',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: '500',
              backgroundColor: style.confirmBg,
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = style.confirmHover
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = style.confirmBg
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
