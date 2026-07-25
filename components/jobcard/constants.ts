import { JobCardProductionRow, LotWorkerRates, Worker, WorkerProcess } from '@/lib/types'
import { getActiveProcessesForRates, getActiveWorkerFields } from '@/lib/lotWorkerRates'
import { getProcessProductionKey, resolveWorkerProcesses } from '@/lib/workerProcesses'

export type WorkerField = string

export const getWorkerRole = (worker: Pick<Worker, 'role' | 'tbd1'>) => worker.role || worker.tbd1 || ''

export const filterWorkersForField = (
  workers: Worker[],
  field: WorkerField,
  selectedWorkerId = '',
  processes?: WorkerProcess[] | null,
) => {
  const resolved = resolveWorkerProcesses(processes)
  const process = resolved.find((p) => getProcessProductionKey(p) === field)
  const requiredRole = process?.roleCode
  const filtered = requiredRole
    ? workers.filter((w) => getWorkerRole(w) === requiredRole)
    : workers
  if (selectedWorkerId && !filtered.some((w) => w._id === selectedWorkerId)) {
    const selected = workers.find((w) => w._id === selectedWorkerId)
    if (selected) return [...filtered, selected]
  }
  return filtered
}

export const buildWorkerMetaFromProcesses = (processes?: WorkerProcess[] | null) => {
  const resolved = resolveWorkerProcesses(processes)
  const meta: Record<string, { workerKey: string; dateKey: string; rateKey: string; field: string; label: string }> = {}
  resolved.forEach((p) => {
    const field = getProcessProductionKey(p)
    meta[p.label] = {
      workerKey: `${field}Worker`,
      dateKey: `${field}Date`,
      rateKey: `${field}Rate`,
      field,
      label: p.label,
    }
  })
  return meta
}

/** Pair active processes (by rate) into twos for PDF/Excel layout. */
export const getActiveWorkerPairs = (
  workerRates?: Partial<LotWorkerRates> | null,
  processes?: WorkerProcess[] | null,
): [string, string | null][] => {
  const active = getActiveProcessesForRates(workerRates ?? {}, processes)
  const pairs: [string, string | null][] = []
  for (let i = 0; i < active.length; i += 2) {
    const a = active[i]
    const b = active[i + 1]
    pairs.push([a.label, b ? b.label : null])
  }
  return pairs
}

export const FIELD_LABELS_FROM_PROCESSES = (processes?: WorkerProcess[] | null): Record<string, string> => {
  const labels: Record<string, string> = {}
  resolveWorkerProcesses(processes).forEach((p) => {
    labels[getProcessProductionKey(p)] = p.label
  })
  return labels
}

/** @deprecated Static labels — prefer FIELD_LABELS_FROM_PROCESSES */
export const FIELD_LABELS: Record<string, string> = {
  front: 'Front', back: 'Back', zip: 'Zip', astar: 'Astar', beltProd: 'Belt',
}

export const DEFAULT_PRODUCTION_ROW: Omit<JobCardProductionRow, 'serialNumber'> = {
  layer: '1', pieces: 0, tukda: 0, color: '', shade: '',
  front: '', frontWorker: '', frontDate: '', frontRate: '',
  back: '', backWorker: '', backDate: '', backRate: '',
  zip: '', zipWorker: '', zipDate: '', zipRate: '',
  zip_code: '', thread_code: '',
  astar: '', astarWorker: '', astarDate: '', astarRate: '',
  beltProd: '', beltProdWorker: '', beltProdDate: '', beltProdRate: '',
  add1: '', add1Worker: '', add1Date: '', add1Rate: '',
  add2: '', add2Worker: '', add2Date: '', add2Rate: '',
}

// Re-export for callers that still import WORKER_META / WORKER_PAIRS
export const WORKER_META = buildWorkerMetaFromProcesses()
export const WORKER_PAIRS: [string, string | null][] = getActiveWorkerPairs(undefined)
