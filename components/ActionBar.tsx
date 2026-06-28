'use client'

export interface ActionBarItem {
  label: string
  shortLabel?: string
  icon: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
  variant?: 'primary' | 'secondary' | 'danger'
}

interface ActionBarProps {
  actions: ActionBarItem[]
}

export default function ActionBar({ actions }: ActionBarProps) {
  return (
    <div className="action-bar">
      <div className="action-bar-inner">
        {actions.map((action, i) => {
          const variant = action.variant ?? 'primary'
          const label = action.loading && action.loadingLabel
            ? action.loadingLabel
            : (action.shortLabel ?? action.label)
          return (
            <button
              key={i}
              className={`action-bar-btn action-bar-btn--${variant}${action.loading ? ' action-bar-btn--loading' : ''}`}
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
              title={action.label}
            >
              {action.loading
                ? <span className="action-bar-btn-spinner" />
                : <span className="action-bar-btn-icon">{action.icon}</span>
              }
              <span className="action-bar-btn-label">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
