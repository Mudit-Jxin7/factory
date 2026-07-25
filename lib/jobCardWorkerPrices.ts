import { JobCardProductionRow, Worker } from '@/lib/types'

export type WorkerPrices = Record<string, string>

const WORKER_PRICE_FIELDS = ['front', 'back', 'zip', 'astar', 'beltProd'] as const

const normalizeWorkerId = (id: unknown) => String(id ?? '').trim()

export const sanitizeWorkerPrices = (workerPrices: WorkerPrices): WorkerPrices =>
  Object.fromEntries(
    Object.entries(workerPrices).filter(([, rate]) => String(rate).trim() !== ''),
  )

export const getAssignedWorkerMongoIds = (
  productionData: JobCardProductionRow[] = [],
): string[] => {
  const assignedIds = new Set<string>()
  productionData.forEach((row) => {
    WORKER_PRICE_FIELDS.forEach((field) => {
      const workerMongoId = normalizeWorkerId(row[`${field}Worker` as keyof JobCardProductionRow])
      if (workerMongoId) assignedIds.add(workerMongoId)
    })
  })
  return [...assignedIds]
}

export const getWorkersAssignedToProduction = (
  productionData: JobCardProductionRow[],
  workers: Worker[],
): Worker[] => {
  const assignedIds = new Set(getAssignedWorkerMongoIds(productionData))
  return workers.filter((w) => assignedIds.has(normalizeWorkerId(w._id)))
}

export const getWorkerRateFromPrices = (
  workerMongoId: string,
  workers: Pick<Worker, '_id' | 'worker_id'>[],
  workerPrices: WorkerPrices,
) => {
  const normalizedId = normalizeWorkerId(workerMongoId)
  if (!normalizedId) return ''
  const worker = workers.find((w) => normalizeWorkerId(w._id) === normalizedId)
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
      ;(updated as any)[rateKey] = rate
    })
    return updated
  })
}

export const hasAllProductionRates = (
  productionData: JobCardProductionRow[] = [],
): boolean => {
  const assignedIds = getAssignedWorkerMongoIds(productionData)
  if (assignedIds.length === 0) return false

  return assignedIds.every((workerMongoId) =>
    productionData.some((row) =>
      WORKER_PRICE_FIELDS.some((field) => {
        if (normalizeWorkerId(row[`${field}Worker` as keyof JobCardProductionRow]) !== workerMongoId) return false
        const rate = row[`${field}Rate` as keyof JobCardProductionRow]
        return rate !== undefined && rate !== null && String(rate).trim() !== ''
      }),
    ),
  )
}
