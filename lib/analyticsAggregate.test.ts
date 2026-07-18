import { describe, it, expect } from 'vitest'
import { aggregateAnalyticsRows, AnalyticsRow } from './analyticsAggregate'

const row = (overrides: Partial<AnalyticsRow> = {}): AnalyticsRow => ({
  worker_id: 2,
  worker_full_name: 'Bob',
  section: 'Back',
  date: '2024-01-10',
  rate: 30,
  lotNumber: 'L001',
  layer: 1,
  pieces: 10,
  total_amount: 300,
  ...overrides,
})

describe('aggregateAnalyticsRows', () => {
  it('collapses the same worker + lot + section into one row', () => {
    const aggregated = aggregateAnalyticsRows([
      row({ pieces: 10, layer: 1, total_amount: 300, date: '2024-01-12' }),
      row({ pieces: 20, layer: 2, total_amount: 600, date: '2024-01-10' }),
      row({ pieces: 5, layer: 1, total_amount: 150, date: '2024-01-11' }),
    ])

    expect(aggregated).toHaveLength(1)
    expect(aggregated[0]).toMatchObject({
      worker_id: 2,
      lotNumber: 'L001',
      section: 'Back',
      pieces: 35,
      layer: 4,
      total_amount: 1050,
      rate: 30,
      date: '2024-01-10',
    })
  })

  it('keeps separate rows for different lots or sections', () => {
    const aggregated = aggregateAnalyticsRows([
      row({ section: 'Back', lotNumber: 'L001' }),
      row({ section: 'Front', lotNumber: 'L001', pieces: 8, total_amount: 240 }),
      row({ section: 'Back', lotNumber: 'L002', pieces: 4, total_amount: 120 }),
    ])

    expect(aggregated).toHaveLength(3)
  })
})
