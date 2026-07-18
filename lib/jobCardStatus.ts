import { JobCardProductionRow } from '@/lib/types'
import {
  hasAllRequiredWorkerFields,
  hasAnyRequiredWorkerFields,
} from '@/lib/jobCardWorkerCompletion'

export const JOB_CARD_STATUSES = ['incomplete', 'in_progress', 'complete'] as const
export type JobCardStatus = typeof JOB_CARD_STATUSES[number]

export type JobCardDisplayStatus = JobCardStatus

export const JOB_CARD_STATUS_LABELS: Record<JobCardStatus, string> = {
  incomplete: 'Incomplete',
  in_progress: 'In Progress',
  complete: 'Complete',
}

export const JOB_CARD_DISPLAY_STATUS_LABELS: Record<JobCardDisplayStatus, string> = {
  ...JOB_CARD_STATUS_LABELS,
}

export const JOB_CARD_STATUS_COLORS: Record<JobCardStatus, { bg: string; color: string }> = {
  incomplete: { bg: '#fff3cd', color: '#856404' },
  in_progress: { bg: '#cce5ff', color: '#004085' },
  complete: { bg: '#d4edda', color: '#155724' },
}

export const JOB_CARD_DISPLAY_STATUS_COLORS: Record<JobCardDisplayStatus, { bg: string; color: string }> = {
  ...JOB_CARD_STATUS_COLORS,
}

export const JOB_CARD_FILTER_STATUSES: JobCardStatus[] = [...JOB_CARD_STATUSES]
/** @deprecated Use JOB_CARD_FILTER_STATUSES — admin and worker share the same statuses. */
export const ADMIN_FILTER_STATUSES = JOB_CARD_FILTER_STATUSES
/** @deprecated Use JOB_CARD_FILTER_STATUSES — admin and worker share the same statuses. */
export const WORKER_FILTER_STATUSES = JOB_CARD_FILTER_STATUSES

type JobCardForDisplay = {
  status?: string
  productionData?: JobCardProductionRow[]
}

/** Derive status from whether required worker fields are filled. */
export const deriveJobCardStatus = (
  productionData: JobCardProductionRow[] = [],
): JobCardStatus => {
  if (hasAllRequiredWorkerFields(productionData)) return 'complete'
  if (hasAnyRequiredWorkerFields(productionData)) return 'in_progress'
  return 'incomplete'
}

/**
 * Normalize stored status.
 * Legacy `pending_approval` maps to `complete` (those cards were submitted with all fields filled).
 */
export const normalizeJobCardStatus = (status?: string): JobCardStatus => {
  if (status === 'complete' || status === 'pending_approval') return 'complete'
  if (status === 'in_progress') return 'in_progress'
  return 'incomplete'
}

export const getJobCardDisplayStatus = (
  jobCard: JobCardForDisplay,
  _options?: { variant: 'admin' | 'worker' },
): JobCardDisplayStatus => {
  const stored = normalizeJobCardStatus(jobCard.status)
  if (stored === 'complete') return 'complete'
  return deriveJobCardStatus(jobCard.productionData)
}

/** Workers can edit until the card is complete. */
export const canWorkerEditJobCard = (status?: string) =>
  normalizeJobCardStatus(status) !== 'complete'

/** Admins get edit access once the card is complete. */
export const canAdminEditJobCard = (status?: string) =>
  normalizeJobCardStatus(status) === 'complete'

export const canAdminViewWorkerPrices = (status?: string) =>
  normalizeJobCardStatus(status) === 'complete'
