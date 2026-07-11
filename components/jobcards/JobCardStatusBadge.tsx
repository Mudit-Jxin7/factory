'use client'

import {
  JOB_CARD_STATUS_COLORS,
  JOB_CARD_STATUS_LABELS,
  normalizeJobCardStatus,
} from '@/lib/jobCardStatus'

export default function JobCardStatusBadge({ status }: { status?: string }) {
  const normalized = normalizeJobCardStatus(status)
  const colors = JOB_CARD_STATUS_COLORS[normalized]
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
      background: colors.bg,
      color: colors.color,
      whiteSpace: 'nowrap',
    }}>
      {JOB_CARD_STATUS_LABELS[normalized]}
    </span>
  )
}
