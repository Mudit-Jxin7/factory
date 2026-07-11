import { JobCardProductionRow, Worker } from '@/lib/types'

export type WorkerPrices = Record<string, string>

const WORKER_PRICE_FIELDS = ['front', 'back', 'zip', 'astar', 'beltProd', 'add1', 'add2'] as const

export const getWorkersAssignedToProduction = (
  productionData: JobCardProductionRow[],
  workers: Worker[],
): Worker[] => {
  const assignedIds = new Set<string>()
  productionData.forEach((row) => {
    WORKER_PRICE_FIELDS.forEach((field) => {
      const workerMongoId = String(row[`${field}Worker` as keyof JobCardProductionRow] ?? '')
      if (workerMongoId) assignedIds.add(workerMongoId)
    })
  })
  return workers.filter((w) => assignedIds.has(w._id))
}

export const getWorkerRateFromPrices = (
  workerMongoId: string,
  workers: Worker[],
  workerPrices: WorkerPrices,
) => {
  if (!workerMongoId) return ''
  const worker = workers.find((w) => w._id === workerMongoId)
  if (!worker) return ''
  return workerPrices[String(worker.worker_id)] ?? ''
}

export const applyWorkerPricesToProduction = (
  productionData: JobCardProductionRow[],
  workerPrices: WorkerPrices,
  workers: Worker[],
): JobCardProductionRow[] => {
  return productionData.map((row) => {
    const updated = { ...row }
    WORKER_PRICE_FIELDS.forEach((field) => {
      const workerKey = `${field}Worker` as keyof JobCardProductionRow
      const rateKey = `${field}Rate` as keyof JobCardProductionRow
      const workerMongoId = String(row[workerKey] ?? '')
      if (!workerMongoId) return
      const rate = getWorkerRateFromPrices(workerMongoId, workers, workerPrices)
      if (rate !== '') (updated as any)[rateKey] = rate
    })
    return updated
  })
}

export const hasAllProductionRates = (
  productionData: JobCardProductionRow[] = [],
  workerPrices: WorkerPrices = {},
  workers: Pick<Worker, '_id' | 'worker_id'>[] = [],
): boolean => {
  for (const row of productionData) {
    for (const field of WORKER_PRICE_FIELDS) {
      const workerMongoId = String(row[`${field}Worker` as keyof JobCardProductionRow] ?? '')
      if (!workerMongoId) continue

      const productionRate = row[`${field}Rate` as keyof JobCardProductionRow]
      if (productionRate !== undefined && productionRate !== null && String(productionRate).trim() !== '') continue

      if (getWorkerRateFromPrices(workerMongoId, workers, workerPrices) !== '') continue

      return false
    }
  }
  return true
}
