import { JobCardProductionRow } from '@/lib/types'
import { hasAllProductionRates, WorkerPrices } from '@/lib/jobCardWorkerPrices'

export const JOB_CARD_STATUSES = ['incomplete', 'pending_approval', 'complete'] as const
export type JobCardStatus = typeof JOB_CARD_STATUSES[number]

export type JobCardDisplayStatus = JobCardStatus | 'rate_pending'

export const JOB_CARD_STATUS_LABELS: Record<JobCardStatus, string> = {
  incomplete: 'Incomplete',
  pending_approval: 'Pending Approval',
  complete: 'Complete',
}

export const JOB_CARD_DISPLAY_STATUS_LABELS: Record<JobCardDisplayStatus, string> = {
  ...JOB_CARD_STATUS_LABELS,
  rate_pending: 'Rate Pending',
}

export const JOB_CARD_STATUS_COLORS: Record<JobCardStatus, { bg: string; color: string }> = {
  incomplete: { bg: '#fff3cd', color: '#856404' },
  pending_approval: { bg: '#cce5ff', color: '#004085' },
  complete: { bg: '#d4edda', color: '#155724' },
}

export const JOB_CARD_DISPLAY_STATUS_COLORS: Record<JobCardDisplayStatus, { bg: string; color: string }> = {
  ...JOB_CARD_STATUS_COLORS,
  rate_pending: { bg: '#ffe8cc', color: '#8a4b00' },
}

export const ADMIN_FILTER_STATUSES: JobCardDisplayStatus[] = [...JOB_CARD_STATUSES, 'rate_pending']

type JobCardForDisplay = {
  status?: string
  productionData?: JobCardProductionRow[]
  workerPrices?: WorkerPrices
}

export const normalizeJobCardStatus = (status?: string): JobCardStatus => {
  if (status === 'pending_approval' || status === 'complete') return status
  return 'incomplete'
}

export const getJobCardDisplayStatus = (
  jobCard: JobCardForDisplay,
  options: { variant: 'admin' | 'worker' },
  workers: { _id: string; worker_id: number }[] = [],
): JobCardDisplayStatus => {
  const stored = normalizeJobCardStatus(jobCard.status)

  if (options.variant === 'worker') {
    if (stored === 'pending_approval' || stored === 'complete') return 'complete'
    return stored
  }

  if (stored === 'complete') {
    return hasAllProductionRates(jobCard.productionData, jobCard.workerPrices, workers)
      ? 'complete'
      : 'rate_pending'
  }

  return stored
}

export const canWorkerEditJobCard = (status?: string) => {
  const normalized = normalizeJobCardStatus(status)
  return normalized === 'incomplete' || normalized === 'pending_approval'
}

export const canAdminEditJobCard = (status?: string) => {
  const normalized = normalizeJobCardStatus(status)
  return normalized !== 'incomplete' && normalized !== 'pending_approval'
}

export const canAdminApproveJobCard = (status?: string) => normalizeJobCardStatus(status) === 'pending_approval'
