import { describe, it, expect } from 'vitest'
import { getJobCardDisplayStatus } from '@/lib/jobCardStatus'
import { hasAllProductionRates } from '@/lib/jobCardWorkerPrices'
import { JobCardProductionRow } from '@/lib/types'

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
  it('returns false when no workers are assigned', () => {
    expect(hasAllProductionRates([])).toBe(false)
  })

  it('returns false when an assigned worker is missing a production rate', () => {
    expect(hasAllProductionRates(productionWithMissingRate)).toBe(false)
  })

  it('returns true when all assigned workers have production rates', () => {
    const rows = [{ ...productionWithMissingRate[0], frontRate: '12' }]
    expect(hasAllProductionRates(rows)).toBe(true)
  })

  it('returns true when each unique assigned worker has a production rate across multiple slots', () => {
    const rows = [{
      ...productionWithMissingRate[0],
      frontRate: '12',
      backWorker: 'w1',
      backDate: '2024-01-01',
      backRate: '',
    }]
    expect(hasAllProductionRates(rows)).toBe(true)
  })

  it('returns false when one of multiple assigned workers is missing a production rate', () => {
    const rows = [{
      ...productionWithMissingRate[0],
      frontRate: '12',
      backWorker: 'w2',
      backDate: '2024-01-01',
      backRate: '',
    }]
    expect(hasAllProductionRates(rows)).toBe(false)
  })
})

describe('getJobCardDisplayStatus', () => {
  it('shows rate pending to admin for approved cards with no assigned workers', () => {
    expect(getJobCardDisplayStatus(
      { status: 'complete', productionData: [] },
      { variant: 'admin' },
    )).toBe('rate_pending')
  })

  it('shows rate pending to admin for approved cards with missing production rates', () => {
    expect(getJobCardDisplayStatus(
      { status: 'complete', productionData: productionWithMissingRate },
      { variant: 'admin' },
    )).toBe('rate_pending')
  })

  it('shows complete to admin once all production rates are saved', () => {
    expect(getJobCardDisplayStatus(
      { status: 'complete', productionData: [{ ...productionWithMissingRate[0], frontRate: '12' }] },
      { variant: 'admin' },
    )).toBe('complete')
  })

  it('shows pending approval to worker for submitted cards', () => {
    expect(getJobCardDisplayStatus(
      { status: 'pending_approval', productionData: productionWithMissingRate },
      { variant: 'worker' },
    )).toBe('pending_approval')
  })

  it('shows complete to worker for approved cards even when production rates are missing', () => {
    expect(getJobCardDisplayStatus(
      { status: 'complete', productionData: productionWithMissingRate },
      { variant: 'worker' },
    )).toBe('complete')
  })
})
