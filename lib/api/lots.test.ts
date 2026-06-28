import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { lotsAPI } from './lots'

const mockJson = vi.fn()
const mockFetch = vi.fn()

const makeResponse = (ok: boolean, data: unknown) => ({
  ok,
  json: vi.fn().mockResolvedValue(data),
})

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('lotsAPI.getAllLots', () => {
  it('calls GET /api/lots and returns parsed JSON', async () => {
    const data = { success: true, lots: [{ lotNumber: 'L001' }] }
    mockFetch.mockResolvedValue({ json: vi.fn().mockResolvedValue(data) })

    const result = await lotsAPI.getAllLots()

    expect(mockFetch).toHaveBeenCalledWith('/api/lots')
    expect(result).toEqual(data)
  })

  it('returns error object when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const result = await lotsAPI.getAllLots()

    expect(result).toEqual({ success: false, error: 'Network error' })
  })
})

describe('lotsAPI.getLotByNumber', () => {
  it('returns data when response.ok is true', async () => {
    const data = { success: true, lot: { lotNumber: 'L001' } }
    mockFetch.mockResolvedValue(makeResponse(true, data))

    const result = await lotsAPI.getLotByNumber('L001')

    expect(mockFetch).toHaveBeenCalledWith('/api/lots/L001')
    expect(result).toEqual(data)
  })

  it('returns failure when response.ok is false', async () => {
    mockFetch.mockResolvedValue(makeResponse(false, { error: 'Not found' }))

    const result = await lotsAPI.getLotByNumber('MISSING')

    expect(result).toEqual({ success: false, error: 'Not found' })
  })

  it('returns generic error message when response.ok is false and no error field', async () => {
    mockFetch.mockResolvedValue(makeResponse(false, {}))

    const result = await lotsAPI.getLotByNumber('MISSING')

    expect(result).toEqual({ success: false, error: 'Lot not found' })
  })

  it('encodes special characters in lot number', async () => {
    mockFetch.mockResolvedValue(makeResponse(true, { success: true }))

    await lotsAPI.getLotByNumber('L 001/A')

    expect(mockFetch).toHaveBeenCalledWith('/api/lots/L%20001%2FA')
  })

  it('returns error object when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'))

    const result = await lotsAPI.getLotByNumber('L001')

    expect(result).toEqual({ success: false, error: 'Connection refused' })
  })
})

describe('lotsAPI.saveLot', () => {
  it('calls POST /api/lots with JSON body', async () => {
    const lotData = { lotNumber: 'L002', brand: 'Levis' }
    mockFetch.mockResolvedValue({ json: vi.fn().mockResolvedValue({ success: true }) })

    await lotsAPI.saveLot(lotData)

    expect(mockFetch).toHaveBeenCalledWith('/api/lots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lotData),
    })
  })
})

describe('lotsAPI.updateLot', () => {
  it('calls PUT /api/lots/:lotNumber with JSON body', async () => {
    const lotData = { brand: 'Wrangler' }
    mockFetch.mockResolvedValue({ json: vi.fn().mockResolvedValue({ success: true }) })

    await lotsAPI.updateLot('L003', lotData)

    expect(mockFetch).toHaveBeenCalledWith('/api/lots/L003', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lotData),
    })
  })
})

describe('lotsAPI.deleteLot', () => {
  it('calls DELETE /api/lots/:lotNumber', async () => {
    mockFetch.mockResolvedValue({ json: vi.fn().mockResolvedValue({ success: true }) })

    await lotsAPI.deleteLot('L003')

    expect(mockFetch).toHaveBeenCalledWith('/api/lots/L003', { method: 'DELETE' })
  })
})
