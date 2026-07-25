import { JobCardProductionRow, LotWorkerRates } from '@/lib/types'
import { getActiveWorkerFields, LotRateProductionField } from '@/lib/lotWorkerRates'

export const WORKER_REQUIRED_FIELDS = ['front', 'back', 'zip', 'astar', 'beltProd'] as const
export const WORKER_EDITABLE_FIELDS = [
  'front', 'back', 'zip', 'astar', 'beltProd',
] as const

type RequiredWorkerField = typeof WORKER_REQUIRED_FIELDS[number]
export type WorkerEditableField = typeof WORKER_EDITABLE_FIELDS[number]

const normalizeValue = (value: unknown) => String(value ?? '').trim()

export const isWorkerProductionFieldFilled = (
  row: JobCardProductionRow,
  field: WorkerEditableField | RequiredWorkerField | LotRateProductionField,
): boolean => normalizeValue(row[`${field}Worker` as keyof JobCardProductionRow]) !== ''

const resolveRequiredFields = (
  workerRates?: Partial<LotWorkerRates> | null,
): LotRateProductionField[] => getActiveWorkerFields(workerRates)

export const isProductionRowWorkerComplete = (
  row: JobCardProductionRow,
  workerRates?: Partial<LotWorkerRates> | null,
): boolean => {
  const fields = resolveRequiredFields(workerRates)
  if (fields.length === 0) return true
  return fields.every((field) => isWorkerProductionFieldFilled(row, field))
}

export const hasAllRequiredWorkerFields = (
  productionData: JobCardProductionRow[] = [],
  workerRates?: Partial<LotWorkerRates> | null,
): boolean => {
  const fields = resolveRequiredFields(workerRates)
  if (fields.length === 0) return true
  return productionData.length > 0 && productionData.every((row) => isProductionRowWorkerComplete(row, workerRates))
}

export const hasAnyRequiredWorkerFields = (
  productionData: JobCardProductionRow[] = [],
  workerRates?: Partial<LotWorkerRates> | null,
): boolean => {
  const fields = resolveRequiredFields(workerRates)
  if (fields.length === 0) return false
  return productionData.some((row) =>
    fields.some((field) => isWorkerProductionFieldFilled(row, field)),
  )
}

/** Keys like `0:front` for cells that already have a saved worker assignment. */
export const buildLockedWorkerCellKeys = (
  productionData: JobCardProductionRow[] = [],
  workerRates?: Partial<LotWorkerRates> | null,
): Set<string> => {
  const locked = new Set<string>()
  const fields = resolveRequiredFields(workerRates)
  productionData.forEach((row, rowIndex) => {
    fields.forEach((field) => {
      if (isWorkerProductionFieldFilled(row, field)) {
        locked.add(`${rowIndex}:${field}`)
      }
    })
  })
  return locked
}

export const isWorkerCellLocked = (
  lockedCells: Set<string>,
  rowIndex: number,
  field: string,
): boolean => lockedCells.has(`${rowIndex}:${field}`)
