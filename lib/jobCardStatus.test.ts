import { describe, it, expect } from 'vitest'
import {
  canAdminEditJobCard,
  canWorkerEditJobCard,
  deriveJobCardStatus,
  getJobCardDisplayStatus,
  normalizeJobCardStatus,
} from '@/lib/jobCardStatus'
import { applyWorkerPricesToProduction, hasAllProductionRates } from '@/lib/jobCardWorkerPrices'
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

const fullyAssignedRow: JobCardProductionRow = {
  ...productionWithMissingRate[0],
  backWorker: 'w2',
  backDate: '2024-01-02',
  zipWorker: 'w3',
  zipDate: '2024-01-02',
  astarWorker: 'w4',
  astarDate: '2024-01-02',
  beltProdWorker: 'w5',
  beltProdDate: '2024-01-02',
}

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

describe('applyWorkerPricesToProduction', () => {
  const workers = [{ _id: 'w1', worker_id: 1, worker_full_name: 'Alice' }]

  it('clears production row rates when the worker price is empty', () => {
    const rows = [{ ...productionWithMissingRate[0], frontRate: '12' }]
    const updated = applyWorkerPricesToProduction(rows, {}, workers)
    expect(updated[0].frontRate).toBe('')
  })

  it('writes worker prices into matching production row rates on save', () => {
    const updated = applyWorkerPricesToProduction(productionWithMissingRate, { '1': '15' }, workers)
    expect(updated[0].frontRate).toBe('15')
  })
})

describe('deriveJobCardStatus', () => {
  it('returns incomplete when no required fields are filled', () => {
    const rows = [{ ...productionWithMissingRate[0], frontWorker: '', frontDate: '' }]
    expect(deriveJobCardStatus(rows)).toBe('incomplete')
  })

  it('returns in_progress when some required fields are filled', () => {
    expect(deriveJobCardStatus(productionWithMissingRate)).toBe('in_progress')
  })

  it('returns complete when all required fields are filled', () => {
    expect(deriveJobCardStatus([fullyAssignedRow])).toBe('complete')
  })
})

describe('normalizeJobCardStatus', () => {
  it('maps legacy pending_approval to complete', () => {
    expect(normalizeJobCardStatus('pending_approval')).toBe('complete')
  })

  it('keeps the three current statuses', () => {
    expect(normalizeJobCardStatus('incomplete')).toBe('incomplete')
    expect(normalizeJobCardStatus('in_progress')).toBe('in_progress')
    expect(normalizeJobCardStatus('complete')).toBe('complete')
  })
})

describe('access rules', () => {
  it('allows workers to edit incomplete and in-progress cards only', () => {
    expect(canWorkerEditJobCard('incomplete')).toBe(true)
    expect(canWorkerEditJobCard('in_progress')).toBe(true)
    expect(canWorkerEditJobCard('complete')).toBe(false)
    expect(canWorkerEditJobCard('pending_approval')).toBe(false)
  })

  it('allows admins to edit complete cards only, including previously filled columns', () => {
    expect(canAdminEditJobCard('incomplete')).toBe(false)
    expect(canAdminEditJobCard('in_progress')).toBe(false)
    expect(canAdminEditJobCard('complete')).toBe(true)
    expect(canAdminEditJobCard('pending_approval')).toBe(true)
    expect(canAdminEditJobCard('incomplete', [fullyAssignedRow])).toBe(true)
  })

  it('blocks workers when all required fields are filled even if status is not saved yet', () => {
    expect(canWorkerEditJobCard('incomplete', [fullyAssignedRow])).toBe(false)
  })
})

describe('getJobCardDisplayStatus', () => {
  it('shows complete for stored complete cards', () => {
    expect(getJobCardDisplayStatus(
      { status: 'complete', productionData: productionWithMissingRate },
      { variant: 'admin' },
    )).toBe('complete')
  })

  it('shows in progress when required fields are partially filled', () => {
    expect(getJobCardDisplayStatus(
      { status: 'incomplete', productionData: productionWithMissingRate },
      { variant: 'worker' },
    )).toBe('in_progress')
  })

  it('shows complete when all required fields are filled even if stored status is incomplete', () => {
    expect(getJobCardDisplayStatus(
      { status: 'incomplete', productionData: [fullyAssignedRow] },
      { variant: 'worker' },
    )).toBe('complete')
  })

  it('shows incomplete when no required fields are filled', () => {
    const rows = [{ ...productionWithMissingRate[0], frontWorker: '', frontDate: '' }]
    expect(getJobCardDisplayStatus(
      { status: 'incomplete', productionData: rows },
      { variant: 'worker' },
    )).toBe('incomplete')
  })

  it('shows complete for legacy pending approval cards', () => {
    expect(getJobCardDisplayStatus(
      { status: 'pending_approval', productionData: productionWithMissingRate },
      { variant: 'worker' },
    )).toBe('complete')
  })
})
