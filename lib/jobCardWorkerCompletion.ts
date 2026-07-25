import { JobCardProductionRow, LotWorkerRates, WorkerProcess } from '@/lib/types'
import { getActiveWorkerFields } from '@/lib/lotWorkerRates'

export type WorkerEditableField = string

const normalizeValue = (value: unknown) => String(value ?? '').trim()

export const isWorkerProductionFieldFilled = (
  row: JobCardProductionRow,
  field: string,
): boolean => normalizeValue((row as any)[`${field}Worker`]) !== ''

const resolveRequiredFields = (
  workerRates?: Partial<LotWorkerRates> | null,
  processes?: WorkerProcess[] | null,
): string[] => getActiveWorkerFields(workerRates, processes)

export const isProductionRowWorkerComplete = (
  row: JobCardProductionRow,
  workerRates?: Partial<LotWorkerRates> | null,
  processes?: WorkerProcess[] | null,
): boolean => {
  const fields = resolveRequiredFields(workerRates, processes)
  if (fields.length === 0) return true
  return fields.every((field) => isWorkerProductionFieldFilled(row, field))
}

export const hasAllRequiredWorkerFields = (
  productionData: JobCardProductionRow[] = [],
  workerRates?: Partial<LotWorkerRates> | null,
  processes?: WorkerProcess[] | null,
): boolean => {
  const fields = resolveRequiredFields(workerRates, processes)
  if (fields.length === 0) return true
  return productionData.length > 0 && productionData.every((row) => isProductionRowWorkerComplete(row, workerRates, processes))
}

export const hasAnyRequiredWorkerFields = (
  productionData: JobCardProductionRow[] = [],
  workerRates?: Partial<LotWorkerRates> | null,
  processes?: WorkerProcess[] | null,
): boolean => {
  const fields = resolveRequiredFields(workerRates, processes)
  if (fields.length === 0) return false
  return productionData.some((row) =>
    fields.some((field) => isWorkerProductionFieldFilled(row, field)),
  )
}

/** Keys like `0:front` for cells that already have a saved worker assignment. */
export const buildLockedWorkerCellKeys = (
  productionData: JobCardProductionRow[] = [],
  workerRates?: Partial<LotWorkerRates> | null,
  processes?: WorkerProcess[] | null,
): Set<string> => {
  const locked = new Set<string>()
  const fields = resolveRequiredFields(workerRates, processes)
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
