import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreateJobCard = vi.fn()

vi.mock('@/lib/api', () => ({
  jobCardsAPI: {
    createJobCard: (...args: unknown[]) => mockCreateJobCard(...args),
  },
}))

import { createJobCardFromLot } from './jobCardUtils'

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateJobCard.mockResolvedValue({ success: true })
})

describe('createJobCardFromLot', () => {
  it('creates a job card with the correct lot number and brand', async () => {
    const lotData = { lotNumber: 'L001', brand: 'Levis', date: '2024-01-15' }

    await createJobCardFromLot(lotData)

    expect(mockCreateJobCard).toHaveBeenCalledOnce()
    const [payload] = mockCreateJobCard.mock.calls[0]
    expect(payload.lotNumber).toBe('L001')
    expect(payload.brand).toBe('Levis')
    expect(payload.date).toBe('2024-01-15')
  })

  it('defaults worker and rate to empty strings', async () => {
    await createJobCardFromLot({ lotNumber: 'L002' })

    const [payload] = mockCreateJobCard.mock.calls[0]
    expect(payload.worker).toBe('')
    expect(payload.rate).toBe('')
  })

  it('falls back to today\'s date when lot has no date', async () => {
    const today = new Date().toISOString().split('T')[0]

    await createJobCardFromLot({ lotNumber: 'L003' })

    const [payload] = mockCreateJobCard.mock.calls[0]
    expect(payload.date).toBe(today)
  })

  it('uses default ratios when lot has none', async () => {
    await createJobCardFromLot({ lotNumber: 'L004' })

    const [payload] = mockCreateJobCard.mock.calls[0]
    expect(payload.ratios).toEqual({
      r28: 0, r30: 0, r32: 0, r34: 0, r36: 0,
      r38: 0, r40: 0, r42: 0, r44: 0,
    })
  })

  it('preserves lot ratios when provided', async () => {
    const ratios = { r28: 2, r30: 4, r32: 6, r34: 0, r36: 0, r38: 0, r40: 0, r42: 0, r44: 0 }
    await createJobCardFromLot({ lotNumber: 'L005', ratios })

    const [payload] = mockCreateJobCard.mock.calls[0]
    expect(payload.ratios).toEqual(ratios)
  })

  it('maps productionData rows to job card format with serial numbers', async () => {
    const productionData = [
      { layer: '2', pieces: '50', color: 'Blue', shade: 'Light' },
      { layer: '3', pieces: '80', color: 'Red', shade: 'Dark' },
    ]

    await createJobCardFromLot({ lotNumber: 'L006', productionData })

    const [payload] = mockCreateJobCard.mock.calls[0]
    expect(payload.productionData).toHaveLength(2)
    expect(payload.productionData[0]).toMatchObject({
      serialNumber: 1, layer: 2, pieces: 50, color: 'Blue', shade: 'Light',
      front: '', back: '', zip_code: '', thread_code: '',
    })
    expect(payload.productionData[1]).toMatchObject({
      serialNumber: 2, layer: 3, pieces: 80, color: 'Red', shade: 'Dark',
    })
  })

  it('coerces string layer/pieces to numbers', async () => {
    await createJobCardFromLot({
      lotNumber: 'L007',
      productionData: [{ layer: '5', pieces: '120', color: '', shade: '' }],
    })

    const [payload] = mockCreateJobCard.mock.calls[0]
    expect(payload.productionData[0].layer).toBe(5)
    expect(payload.productionData[0].pieces).toBe(120)
  })

  it('defaults layer to 1 and pieces to 0 for invalid values', async () => {
    await createJobCardFromLot({
      lotNumber: 'L008',
      productionData: [{ layer: 'bad', pieces: null, color: '', shade: '' }],
    })

    const [payload] = mockCreateJobCard.mock.calls[0]
    expect(payload.productionData[0].layer).toBe(1)
    expect(payload.productionData[0].pieces).toBe(0)
  })

  it('initializes additionalInfo with empty strings', async () => {
    await createJobCardFromLot({ lotNumber: 'L009' })

    const [payload] = mockCreateJobCard.mock.calls[0]
    expect(payload.additionalInfo).toEqual({
      belt: '', bottom: '', pasting: '', bone: '', hala: '', ticketPocket: '',
    })
  })

  it('does not throw when createJobCard rejects', async () => {
    mockCreateJobCard.mockRejectedValue(new Error('DB error'))

    await expect(createJobCardFromLot({ lotNumber: 'L010' })).resolves.toBeUndefined()
  })
})
