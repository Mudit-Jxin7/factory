import { JobCardProductionRow, LotWorkerRates, Worker, WorkerRole } from '@/lib/types'
import { getActiveWorkerFields } from '@/lib/lotWorkerRates'

export type WorkerField = 'front' | 'back' | 'zip' | 'astar' | 'beltProd'

export const FIELD_TO_ROLE: Partial<Record<WorkerField, WorkerRole>> = {
  front: 'FRONT',
  back: 'BACK',
  zip: 'ZIP',
  astar: 'ASTAR',
  beltProd: 'BELT',
}

export const getWorkerRole = (worker: Pick<Worker, 'role' | 'tbd1'>) => worker.role || worker.tbd1 || ''

export const filterWorkersForField = (workers: Worker[], field: WorkerField, selectedWorkerId = '') => {
  const requiredRole = FIELD_TO_ROLE[field]
  const filtered = requiredRole
    ? workers.filter((w) => getWorkerRole(w) === requiredRole)
    : workers
  if (selectedWorkerId && !filtered.some((w) => w._id === selectedWorkerId)) {
    const selected = workers.find((w) => w._id === selectedWorkerId)
    if (selected) return [...filtered, selected]
  }
  return filtered
}

export const WORKER_PAIRS: [string, string | null][] = [
  ['Front', 'Back'],
  ['Zip',   'Astar'],
  ['Belt',  null],
]

export const WORKER_META: Record<string, { workerKey: string; dateKey: string; rateKey: string; field: WorkerField }> = {
  Front: { workerKey: 'frontWorker',    dateKey: 'frontDate',    rateKey: 'frontRate',    field: 'front' },
  Back:  { workerKey: 'backWorker',     dateKey: 'backDate',     rateKey: 'backRate',     field: 'back' },
  Zip:   { workerKey: 'zipWorker',      dateKey: 'zipDate',      rateKey: 'zipRate',      field: 'zip' },
  Astar: { workerKey: 'astarWorker',    dateKey: 'astarDate',    rateKey: 'astarRate',    field: 'astar' },
  Belt:  { workerKey: 'beltProdWorker', dateKey: 'beltProdDate', rateKey: 'beltProdRate', field: 'beltProd' },
}

/** Worker pairs limited to roles that have a lot rate set. */
export const getActiveWorkerPairs = (
  workerRates?: Partial<LotWorkerRates> | null,
): [string, string | null][] => {
  const active = new Set(getActiveWorkerFields(workerRates ?? {}))
  const pairs: [string, string | null][] = []
  for (const [w1, w2] of WORKER_PAIRS) {
    const a1 = active.has(WORKER_META[w1].field)
    const a2 = w2 ? active.has(WORKER_META[w2].field) : false
    if (a1 && a2) pairs.push([w1, w2])
    else if (a1) pairs.push([w1, null])
    else if (a2 && w2) pairs.push([w2, null])
  }
  return pairs
}

export const FIELD_LABELS: Record<WorkerField, string> = {
  front: 'Front', back: 'Back', zip: 'Zip', astar: 'Astar',
  beltProd: 'Belt',
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
