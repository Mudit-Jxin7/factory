'use client'

import { JobCardProductionRow } from '@/lib/types'
import {
  getJobCardDisplayStatus,
  JOB_CARD_DISPLAY_STATUS_COLORS,
  JOB_CARD_DISPLAY_STATUS_LABELS,
} from '@/lib/jobCardStatus'

interface JobCardStatusBadgeProps {
  status?: string
  jobCard?: {
    productionData?: JobCardProductionRow[]
  }
  variant?: 'admin' | 'worker'
}

export default function JobCardStatusBadge({
  status,
  jobCard,
  variant = 'admin',
}: JobCardStatusBadgeProps) {
  const displayStatus = getJobCardDisplayStatus(
    { status, productionData: jobCard?.productionData },
    { variant },
  )
  const colors = JOB_CARD_DISPLAY_STATUS_COLORS[displayStatus]
  return (
    <span
      className="status-badge"
      style={{
        background: colors.bg,
        color: colors.color,
      }}
    >
      {JOB_CARD_DISPLAY_STATUS_LABELS[displayStatus]}
    </span>
  )
}
