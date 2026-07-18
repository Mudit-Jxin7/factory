import { describe, it, expect } from 'vitest'
import {
  buildLockedWorkerCellKeys,
  hasAllRequiredWorkerFields,
  isWorkerCellLocked,
} from './jobCardWorkerCompletion'
import { JobCardProductionRow } from './types'

const emptyRow = (overrides: Partial<JobCardProductionRow> = {}): JobCardProductionRow => ({
  serialNumber: 1,
  layer: '1',
  pieces: 10,
  color: '',
  shade: '',
  front: '', frontWorker: '', frontDate: '', frontRate: '',
  back: '', backWorker: '', backDate: '', backRate: '',
  zip: '', zipWorker: '', zipDate: '', zipRate: '',
  astar: '', astarWorker: '', astarDate: '', astarRate: '',
  beltProd: '', beltProdWorker: '', beltProdDate: '', beltProdRate: '',
  add1: '', add1Worker: '', add1Date: '', add1Rate: '',
  add2: '', add2Worker: '', add2Date: '', add2Rate: '',
  ...overrides,
})

describe('buildLockedWorkerCellKeys', () => {
  it('locks only cells that already have a saved worker', () => {
    const locked = buildLockedWorkerCellKeys([
      emptyRow({ frontWorker: 'w1', frontDate: '2024-01-01', backWorker: 'w2', backDate: '2024-01-02' }),
    ])
    expect(isWorkerCellLocked(locked, 0, 'front')).toBe(true)
    expect(isWorkerCellLocked(locked, 0, 'back')).toBe(true)
    expect(isWorkerCellLocked(locked, 0, 'zip')).toBe(false)
  })
})

describe('hasAllRequiredWorkerFields', () => {
  it('returns true only when all required columns are filled', () => {
    expect(hasAllRequiredWorkerFields([emptyRow({ frontWorker: 'w1' })])).toBe(false)
    expect(hasAllRequiredWorkerFields([emptyRow({
      frontWorker: 'w1', backWorker: 'w2', zipWorker: 'w3', astarWorker: 'w4', beltProdWorker: 'w5',
    })])).toBe(true)
  })
})
