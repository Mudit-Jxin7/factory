export const JOB_CARD_STATUSES = ['incomplete', 'pending_approval', 'complete'] as const
export type JobCardStatus = typeof JOB_CARD_STATUSES[number]

export const JOB_CARD_STATUS_LABELS: Record<JobCardStatus, string> = {
  incomplete: 'Incomplete',
  pending_approval: 'Pending Approval',
  complete: 'Complete',
}

export const JOB_CARD_STATUS_COLORS: Record<JobCardStatus, { bg: string; color: string }> = {
  incomplete: { bg: '#fff3cd', color: '#856404' },
  pending_approval: { bg: '#cce5ff', color: '#004085' },
  complete: { bg: '#d4edda', color: '#155724' },
}

export const normalizeJobCardStatus = (status?: string): JobCardStatus => {
  if (status === 'pending_approval' || status === 'complete') return status
  return 'incomplete'
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
