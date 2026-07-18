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

export const getLotWorkerRateExportRows = (
  rates?: Partial<LotWorkerRates> | null,
): [string, string][] => {
  const normalized = normalizeLotWorkerRates(rates)
  return (
    [
      ['Front Rate', normalized.front],
      ['Back Rate', normalized.back],
      ['Zip Rate', normalized.zip],
      ['Astar Rate', normalized.astar],
      ['Belt Rate', normalized.belt],
    ] as [string, string][]
  ).filter(([, value]) => String(value || '').trim() !== '')
}

