import { describe, it, expect } from 'vitest'
import { applyLotRatesToProduction, getLotRateForField, normalizeLotWorkerRates } from './lotWorkerRates'
import { JobCardProductionRow } from './types'

const row = (overrides: Partial<JobCardProductionRow> = {}): JobCardProductionRow => ({
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

describe('lotWorkerRates', () => {
  it('normalizes missing rate fields to empty strings', () => {
    expect(normalizeLotWorkerRates({ front: '10' })).toEqual({
      front: '10', back: '', zip: '', astar: '', belt: '',
    })
  })

  it('returns the lot rate for a production field', () => {
    expect(getLotRateForField({ belt: '7.5' }, 'beltProd')).toBe('7.5')
    expect(getLotRateForField({ front: '12' }, 'front')).toBe('12')
    expect(getLotRateForField({}, 'add1')).toBe('')
  })

  it('applies lot rates only where a worker is assigned', () => {
    const updated = applyLotRatesToProduction(
      [row({ frontWorker: 'w1', backWorker: '', zipWorker: 'w3' })],
      { front: '10', back: '11', zip: '12', astar: '13', belt: '14' },
    )
    expect(updated[0].frontRate).toBe('10')
    expect(updated[0].backRate).toBe('')
    expect(updated[0].zipRate).toBe('12')
    expect(updated[0].astarRate).toBe('')
    expect(updated[0].beltProdRate).toBe('')
  })
})

describe('areLotWorkerRatesComplete', () => {
  it('requires all five rates to be present and non-negative', async () => {
    const { areLotWorkerRatesComplete, getMissingLotWorkerRateLabels } = await import('./lotWorkerRates')
    expect(areLotWorkerRatesComplete({ front: '10', back: '11', zip: '12', astar: '13', belt: '14' })).toBe(true)
    expect(getMissingLotWorkerRateLabels({ front: '10', back: '', zip: '12', astar: '13', belt: '14' })).toEqual(['Back'])
    expect(areLotWorkerRatesComplete({ front: '10', back: '-1', zip: '12', astar: '13', belt: '14' })).toBe(false)
  })
})
