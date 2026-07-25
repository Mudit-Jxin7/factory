import { JobCardProductionRow } from '@/lib/types'

export const WORKER_REQUIRED_FIELDS = ['front', 'back', 'zip', 'astar', 'beltProd'] as const
export const WORKER_EDITABLE_FIELDS = [
  'front', 'back', 'zip', 'astar', 'beltProd',
] as const

type RequiredWorkerField = typeof WORKER_REQUIRED_FIELDS[number]
export type WorkerEditableField = typeof WORKER_EDITABLE_FIELDS[number]

const normalizeValue = (value: unknown) => String(value ?? '').trim()

export const isWorkerProductionFieldFilled = (
  row: JobCardProductionRow,
  field: WorkerEditableField | RequiredWorkerField,
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

/** Keys like `0:front` for cells that already have a saved worker assignment. */
export const buildLockedWorkerCellKeys = (
  productionData: JobCardProductionRow[] = [],
): Set<string> => {
  const locked = new Set<string>()
  productionData.forEach((row, rowIndex) => {
    WORKER_EDITABLE_FIELDS.forEach((field) => {
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
