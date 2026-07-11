import { describe, it, expect } from 'vitest'
import { getJobCardDisplayStatus } from '@/lib/jobCardStatus'
import { hasAllProductionRates } from '@/lib/jobCardWorkerPrices'
import { JobCardProductionRow } from '@/lib/types'

const workers = [
  { _id: 'w1', worker_id: 1, worker_full_name: 'Alice' },
  { _id: 'w2', worker_id: 2, worker_full_name: 'Bob' },
]

const productionWithMissingRate: JobCardProductionRow[] = [{
  serialNumber: 1,
  layer: '1',
  pieces: 10,
  color: '',
  shade: '',
  front: '',
  frontWorker: 'w1',
  frontDate: '2024-01-01',
  frontRate: '',
  back: '',
  backWorker: '',
  backDate: '',
  backRate: '',
  zip: '',
  zipWorker: '',
  zipDate: '',
  zipRate: '',
  astar: '',
  astarWorker: '',
  astarDate: '',
  astarRate: '',
  beltProd: '',
  beltProdWorker: '',
  beltProdDate: '',
  beltProdRate: '',
  add1: '',
  add1Worker: '',
  add1Date: '',
  add1Rate: '',
  add2: '',
  add2Worker: '',
  add2Date: '',
  add2Rate: '',
}]

describe('hasAllProductionRates', () => {
  it('returns false when an assigned worker is missing a rate', () => {
    expect(hasAllProductionRates(productionWithMissingRate, {}, workers)).toBe(false)
  })

  it('returns true when all assigned workers have production rates', () => {
    const rows = [{ ...productionWithMissingRate[0], frontRate: '12' }]
    expect(hasAllProductionRates(rows, {}, workers)).toBe(true)
  })

  it('returns true when missing production rates are covered by workerPrices', () => {
    expect(hasAllProductionRates(productionWithMissingRate, { '1': '12' }, workers)).toBe(true)
  })
})

describe('getJobCardDisplayStatus', () => {
  it('shows rate pending to admin for approved cards with missing rates', () => {
    expect(getJobCardDisplayStatus(
      { status: 'complete', productionData: productionWithMissingRate },
      { variant: 'admin' },
      workers,
    )).toBe('rate_pending')
  })

  it('shows complete to admin once all rates are added', () => {
    expect(getJobCardDisplayStatus(
      { status: 'complete', productionData: [{ ...productionWithMissingRate[0], frontRate: '12' }] },
      { variant: 'admin' },
      workers,
    )).toBe('complete')
  })

  it('shows pending approval to worker for submitted cards', () => {
    expect(getJobCardDisplayStatus(
      { status: 'pending_approval', productionData: productionWithMissingRate },
      { variant: 'worker' },
      workers,
    )).toBe('pending_approval')
  })

  it('shows complete to worker for approved cards even when rates are missing', () => {
    expect(getJobCardDisplayStatus(
      { status: 'complete', productionData: productionWithMissingRate },
      { variant: 'worker' },
      workers,
    )).toBe('complete')
  })
})
