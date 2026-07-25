import { JobCardProductionRow, LotWorkerRates, WorkerProcess, DEFAULT_LOT_WORKER_RATES } from '@/lib/types'
import {
  getProcessProductionKey,
  resolveWorkerProcesses,
} from '@/lib/workerProcesses'

/** @deprecated Prefer process.productionKey from worker processes master. */
export const LOT_RATE_FIELD_MAP: Record<string, string> = {
  front: 'front',
  back: 'back',
  zip: 'zip',
  astar: 'astar',
  beltProd: 'belt',
}

export type LotRateProductionField = string

export const normalizeLotWorkerRates = (
  rates?: Partial<LotWorkerRates> | null,
  processes?: WorkerProcess[] | null,
): LotWorkerRates => {
  const resolved = resolveWorkerProcesses(processes)
  const base: LotWorkerRates = { ...DEFAULT_LOT_WORKER_RATES }
  resolved.forEach((p) => { base[p.key] = '' })
  Object.entries(rates || {}).forEach(([key, value]) => {
    base[key] = String(value ?? '')
  })
  return base
}

export const isLotWorkerRateFilled = (value: unknown): boolean => {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return false
  const num = Number(trimmed)
  return Number.isFinite(num) && num >= 0
}

export const getRateKeyForProductionField = (
  field: string,
  processes?: WorkerProcess[] | null,
): string => {
  const resolved = resolveWorkerProcesses(processes)
  const match = resolved.find((p) => getProcessProductionKey(p) === field)
  if (match) return match.key
  return LOT_RATE_FIELD_MAP[field] || field
}

export const getLotRateForField = (
  rates: Partial<LotWorkerRates> | null | undefined,
  field: string,
  processes?: WorkerProcess[] | null,
): string => {
  const rateKey = getRateKeyForProductionField(field, processes)
  const normalized = normalizeLotWorkerRates(rates, processes)
  return String(normalized[rateKey] || '').trim()
}

/**
 * Production field keys that have a rate set on the lot.
 * When `rates` is undefined/null (legacy), returns all process production keys.
 * When rates exist but are all empty, returns [].
 */
export const getActiveWorkerFields = (
  rates?: Partial<LotWorkerRates> | null,
  processes?: WorkerProcess[] | null,
): string[] => {
  const resolved = resolveWorkerProcesses(processes)
  if (rates === undefined || rates === null) {
    return resolved.map((p) => getProcessProductionKey(p))
  }
  const normalized = normalizeLotWorkerRates(rates, processes)
  return resolved
    .filter((p) => isLotWorkerRateFilled(normalized[p.key]))
    .map((p) => getProcessProductionKey(p))
}

export const getActiveProcessesForRates = (
  rates?: Partial<LotWorkerRates> | null,
  processes?: WorkerProcess[] | null,
): WorkerProcess[] => {
  const resolved = resolveWorkerProcesses(processes)
  if (rates === undefined || rates === null) return resolved
  const normalized = normalizeLotWorkerRates(rates, processes)
  return resolved.filter((p) => isLotWorkerRateFilled(normalized[p.key]))
}

/** Stamp lot role rates onto production rows that have a worker assigned. */
export const applyLotRatesToProduction = (
  productionData: JobCardProductionRow[] = [],
  rates?: Partial<LotWorkerRates> | null,
  processes?: WorkerProcess[] | null,
): JobCardProductionRow[] => {
  const resolved = resolveWorkerProcesses(processes)
  const normalized = normalizeLotWorkerRates(rates, processes)
  return productionData.map((row) => {
    const updated: any = { ...row }
    resolved.forEach((process) => {
      const field = getProcessProductionKey(process)
      const workerKey = `${field}Worker`
      const rateKey = `${field}Rate`
      const hasWorker = String(row[workerKey as keyof JobCardProductionRow] ?? '').trim() !== ''
      updated[rateKey] = hasWorker ? String(normalized[process.key] || '').trim() : ''
    })
    return updated as JobCardProductionRow
  })
}

export const getMissingLotWorkerRateLabels = (
  rates?: Partial<LotWorkerRates> | null,
  processes?: WorkerProcess[] | null,
): string[] => {
  const resolved = resolveWorkerProcesses(processes)
  const normalized = normalizeLotWorkerRates(rates, processes)
  return resolved
    .filter((p) => !isLotWorkerRateFilled(normalized[p.key]))
    .map((p) => p.label)
}

export const areLotWorkerRatesComplete = (
  rates?: Partial<LotWorkerRates> | null,
  processes?: WorkerProcess[] | null,
): boolean => getMissingLotWorkerRateLabels(rates, processes).length === 0
