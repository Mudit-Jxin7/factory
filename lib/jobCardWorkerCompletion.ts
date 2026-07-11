import { JobCardProductionRow } from '@/lib/types'

const WORKER_REQUIRED_FIELDS = ['front', 'back', 'zip', 'astar', 'beltProd'] as const
type RequiredWorkerField = typeof WORKER_REQUIRED_FIELDS[number]

const normalizeValue = (value: unknown) => String(value ?? '').trim()

export const isWorkerProductionFieldFilled = (
  row: JobCardProductionRow,
  field: RequiredWorkerField,
): boolean => normalizeValue(row[`${field}Worker` as keyof JobCardProductionRow]) !== ''

export const isProductionRowWorkerComplete = (row: JobCardProductionRow): boolean =>
  WORKER_REQUIRED_FIELDS.every((field) => isWorkerProductionFieldFilled(row, field))

export const hasAllRequiredWorkerFields = (
  productionData: JobCardProductionRow[] = [],
): boolean => productionData.length > 0 && productionData.every(isProductionRowWorkerComplete)

export const hasAnyRequiredWorkerFields = (
  productionData: JobCardProductionRow[] = [],
): boolean => productionData.some((row) =>
  WORKER_REQUIRED_FIELDS.some((field) => isWorkerProductionFieldFilled(row, field)),
)
