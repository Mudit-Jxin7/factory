import { JobCardProductionRow } from '@/lib/types'

export type WorkerField = 'front' | 'back' | 'zip' | 'astar' | 'beltProd' | 'add1' | 'add2'

export const WORKER_PAIRS: [string, string | null][] = [
  ['Front', 'Back'],
  ['Zip',   'Astar'],
  ['Belt',  'Add1'],
  ['Add2',  null],
]

export const WORKER_META: Record<string, { workerKey: string; dateKey: string; rateKey: string }> = {
  Front: { workerKey: 'frontWorker',    dateKey: 'frontDate',    rateKey: 'frontRate'    },
  Back:  { workerKey: 'backWorker',     dateKey: 'backDate',     rateKey: 'backRate'     },
  Zip:   { workerKey: 'zipWorker',      dateKey: 'zipDate',      rateKey: 'zipRate'      },
  Astar: { workerKey: 'astarWorker',    dateKey: 'astarDate',    rateKey: 'astarRate'    },
  Belt:  { workerKey: 'beltProdWorker', dateKey: 'beltProdDate', rateKey: 'beltProdRate' },
  Add1:  { workerKey: 'add1Worker',     dateKey: 'add1Date',     rateKey: 'add1Rate'     },
  Add2:  { workerKey: 'add2Worker',     dateKey: 'add2Date',     rateKey: 'add2Rate'     },
}

export const FIELD_LABELS: Record<WorkerField, string> = {
  front: 'Front', back: 'Back', zip: 'Zip', astar: 'Astar',
  beltProd: 'Belt', add1: 'Additional 1', add2: 'Additional 2',
}

export const DEFAULT_PRODUCTION_ROW: Omit<JobCardProductionRow, 'serialNumber'> = {
  layer: '1', pieces: 0, color: '', shade: '',
  front: '', frontWorker: '', frontDate: '', frontRate: '',
  back: '', backWorker: '', backDate: '', backRate: '',
  zip: '', zipWorker: '', zipDate: '', zipRate: '',
  zip_code: '', thread_code: '',
  astar: '', astarWorker: '', astarDate: '', astarRate: '',
  beltProd: '', beltProdWorker: '', beltProdDate: '', beltProdRate: '',
  add1: '', add1Worker: '', add1Date: '', add1Rate: '',
  add2: '', add2Worker: '', add2Date: '', add2Rate: '',
}
