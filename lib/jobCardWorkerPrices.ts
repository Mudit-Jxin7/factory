import { JobCardProductionRow, Worker } from '@/lib/types'

export type WorkerPrices = Record<string, string>

const WORKER_PRICE_FIELDS = ['front', 'back', 'zip', 'astar', 'beltProd', 'add1', 'add2'] as const

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
