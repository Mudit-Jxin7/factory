import { JobCardProductionRow, LotWorkerRates, DEFAULT_LOT_WORKER_RATES } from '@/lib/types'

/** Maps job-card production field → lot workerRates key. */
export const LOT_RATE_FIELD_MAP = {
  front: 'front',
  back: 'back',
  zip: 'zip',
  astar: 'astar',
  beltProd: 'belt',
} as const

export type LotRateProductionField = keyof typeof LOT_RATE_FIELD_MAP

export const normalizeLotWorkerRates = (
  rates?: Partial<LotWorkerRates> | null,
): LotWorkerRates => ({
  ...DEFAULT_LOT_WORKER_RATES,
  ...(rates || {}),
})

export const getLotRateForField = (
  rates: Partial<LotWorkerRates> | null | undefined,
  field: string,
): string => {
  const key = LOT_RATE_FIELD_MAP[field as LotRateProductionField]
  if (!key) return ''
  return String(normalizeLotWorkerRates(rates)[key] || '').trim()
}

/** Stamp lot role rates onto production rows that have a worker assigned. */
export const applyLotRatesToProduction = (
  productionData: JobCardProductionRow[] = [],
  rates?: Partial<LotWorkerRates> | null,
): JobCardProductionRow[] => {
  const normalized = normalizeLotWorkerRates(rates)
  return productionData.map((row) => {
    const updated = { ...row }
    ;(Object.keys(LOT_RATE_FIELD_MAP) as LotRateProductionField[]).forEach((field) => {
      const workerKey = `${field}Worker` as keyof JobCardProductionRow
      const rateKey = `${field}Rate` as keyof JobCardProductionRow
      const hasWorker = String(row[workerKey] ?? '').trim() !== ''
      ;(updated as any)[rateKey] = hasWorker
        ? String(normalized[LOT_RATE_FIELD_MAP[field]] || '').trim()
        : ''
    })
    return updated
  })
}

export const LOT_WORKER_RATE_LABELS: Record<keyof LotWorkerRates, string> = {
  front: 'Front',
  back: 'Back',
  zip: 'Zip',
  astar: 'Astar',
  belt: 'Belt',
}

/** Returns missing rate field labels, or an empty array when all are filled. */
export const getMissingLotWorkerRateLabels = (
  rates?: Partial<LotWorkerRates> | null,
): string[] => {
  const normalized = normalizeLotWorkerRates(rates)
  return (Object.keys(LOT_WORKER_RATE_LABELS) as (keyof LotWorkerRates)[])
    .filter((key) => {
      const value = String(normalized[key] ?? '').trim()
      if (!value) return true
      const num = Number(value)
      return !Number.isFinite(num) || num < 0
    })
    .map((key) => LOT_WORKER_RATE_LABELS[key])
}

export const areLotWorkerRatesComplete = (
  rates?: Partial<LotWorkerRates> | null,
): boolean => getMissingLotWorkerRateLabels(rates).length === 0


