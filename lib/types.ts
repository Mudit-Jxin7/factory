export interface Ratios {
  r28: number
  r30: number
  r32: number
  r34: number
  r36: number
  r38: number
  r40: number
  r42: number
  r44: number
}

export interface AdditionalInfo {
  belt: string
  bottom: string
  pasting: string
  bone: string
  hala: string
  ticketPocket: string
  cutting: string
  number: string
  buttonTake: string
  assembly: string
  sealStitch: string
  label: string
  tanki: string
  kaajButton: string
  finishing: string
  addition1: string
  addition2: string
  addition3: string
}

export interface JobCardProductionRow {
  serialNumber: number
  layer: string
  pieces: number
  color: string
  shade: string
  zip_code?: string
  thread_code?: string
  front: string
  frontWorker: string
  frontDate: string
  frontRate: string
  back: string
  backWorker: string
  backDate: string
  backRate: string
  zip: string
  zipWorker: string
  zipDate: string
  zipRate: string
  astar: string
  astarWorker: string
  astarDate: string
  astarRate: string
  beltProd: string
  beltProdWorker: string
  beltProdDate: string
  beltProdRate: string
  add1: string
  add1Worker: string
  add1Date: string
  add1Rate: string
  add2: string
  add2Worker: string
  add2Date: string
  add2Rate: string
}

export interface Worker {
  _id: string
  worker_id: number
  worker_full_name: string
  tbd1?: string
  tbd2?: string
  tbd3?: string
}

export const DEFAULT_RATIOS: Ratios = {
  r28: 0, r30: 0, r32: 0, r34: 0, r36: 0,
  r38: 0, r40: 0, r42: 0, r44: 0,
}

export const DEFAULT_ADDITIONAL_INFO: AdditionalInfo = {
  belt: '', bottom: '', pasting: '', bone: '', hala: '', ticketPocket: '',
  cutting: '', number: '', buttonTake: '', assembly: '', sealStitch: '',
  label: '', tanki: '', kaajButton: '', finishing: '',
  addition1: '', addition2: '', addition3: '',
}
