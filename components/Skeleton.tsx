'use client'

type SkeletonProps = {
  className?: string
  style?: React.CSSProperties
  /** Accessible label for screen readers */
  label?: string
}

/** Single shimmer block. Combine with utility classes for width/height. */
export function Skeleton({ className = '', style, label }: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={style}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'status' : undefined}
    />
  )
}

type PageSkeletonProps = {
  /** Number of content cards below the header */
  cards?: number
  /** Show a form-like grid inside cards */
  variant?: 'form' | 'detail' | 'table'
}

/** Full-page loading placeholder matching dashboard card layout. */
export function PageSkeleton({ cards = 3, variant = 'form' }: PageSkeletonProps) {
  return (
    <div className="page-skeleton" role="status" aria-label="Loading content">
      <div className="page-skeleton-header">
        <Skeleton className="skeleton--title" />
        <Skeleton className="skeleton--subtitle" />
      </div>

      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="page-skeleton-card">
          <Skeleton className="skeleton--lg" style={{ width: '28%', maxWidth: 180 }} />
          {variant === 'table' ? (
            <div className="page-skeleton-rows">
              {Array.from({ length: 5 }).map((_, r) => (
                <Skeleton key={r} className="skeleton--block" style={{ height: 36 }} />
              ))}
            </div>
          ) : variant === 'detail' ? (
            <div className="page-skeleton-grid">
              {Array.from({ length: 4 }).map((_, g) => (
                <div key={g} className="flex flex-col gap-2">
                  <Skeleton className="skeleton--label" />
                  <Skeleton className="skeleton--md" style={{ width: '70%' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="page-skeleton-grid">
              {Array.from({ length: 4 }).map((_, g) => (
                <div key={g} className="flex flex-col gap-2">
                  <Skeleton className="skeleton--label" />
                  <Skeleton className="skeleton--input" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  )
}

/** Compact card-level skeleton for developer tabs and inline panels. */
export function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="page-skeleton-card" role="status" aria-label="Loading">
      <Skeleton className="skeleton--lg" style={{ width: '32%', maxWidth: 160 }} />
      <div className="page-skeleton-rows">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton
            key={i}
            className="skeleton--block"
            style={{ height: 40, width: `${88 - (i % 3) * 8}%` }}
          />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}
