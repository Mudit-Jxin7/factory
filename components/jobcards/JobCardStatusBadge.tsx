'use client'

import { JobCardProductionRow, Worker } from '@/lib/types'
import { WorkerPrices } from '@/lib/jobCardWorkerPrices'
import {
  getJobCardDisplayStatus,
  JOB_CARD_DISPLAY_STATUS_COLORS,
  JOB_CARD_DISPLAY_STATUS_LABELS,
} from '@/lib/jobCardStatus'

interface JobCardStatusBadgeProps {
  status?: string
  jobCard?: {
    productionData?: JobCardProductionRow[]
    workerPrices?: WorkerPrices
  }
  workers?: Pick<Worker, '_id' | 'worker_id'>[]
  variant?: 'admin' | 'worker'
}

export default function JobCardStatusBadge({
  status,
  jobCard,
  workers = [],
  variant = 'admin',
}: JobCardStatusBadgeProps) {
  const displayStatus = getJobCardDisplayStatus(
    { status, productionData: jobCard?.productionData, workerPrices: jobCard?.workerPrices },
    { variant },
    workers,
  )
  const colors = JOB_CARD_DISPLAY_STATUS_COLORS[displayStatus]
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
      {JOB_CARD_DISPLAY_STATUS_LABELS[displayStatus]}
    </span>
  )
}
