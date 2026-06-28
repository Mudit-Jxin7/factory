import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fabricsAPI } from './fabrics'

const mockJson = vi.fn()
const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockResolvedValue({ json: mockJson })
  mockJson.mockResolvedValue({ success: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('fabricsAPI.getAllFabrics', () => {
  it('calls GET /api/fabrics and returns parsed JSON', async () => {
    mockJson.mockResolvedValue({ success: true, fabrics: [{ name: 'Cotton' }] })

    const result = await fabricsAPI.getAllFabrics()

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith('/api/fabrics')
    expect(result).toEqual({ success: true, fabrics: [{ name: 'Cotton' }] })
  })

  it('returns error object when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const result = await fabricsAPI.getAllFabrics()

    expect(result).toEqual({ success: false, error: 'Network error' })
  })
})

describe('fabricsAPI.createFabric', () => {
  it('calls POST /api/fabrics with JSON body', async () => {
    const fabric = { name: 'Denim', code: 'DN01' }
    await fabricsAPI.createFabric(fabric)

    expect(mockFetch).toHaveBeenCalledWith('/api/fabrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fabric),
    })
  })

  it('returns error object when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Server unavailable'))

    const result = await fabricsAPI.createFabric({ name: 'Denim' })

    expect(result).toEqual({ success: false, error: 'Server unavailable' })
  })
})

describe('fabricsAPI.updateFabric', () => {
  it('calls PUT /api/fabrics/:id with JSON body', async () => {
    const id = 'abc123'
    const updates = { name: 'Linen' }
    await fabricsAPI.updateFabric(id, updates)

    expect(mockFetch).toHaveBeenCalledWith(`/api/fabrics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  })

  it('returns error object when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Timeout'))

    const result = await fabricsAPI.updateFabric('id1', {})

    expect(result).toEqual({ success: false, error: 'Timeout' })
  })
})

describe('fabricsAPI.deleteFabric', () => {
  it('calls DELETE /api/fabrics/:id', async () => {
    await fabricsAPI.deleteFabric('abc123')

    expect(mockFetch).toHaveBeenCalledWith('/api/fabrics/abc123', { method: 'DELETE' })
  })

  it('returns error object when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Forbidden'))

    const result = await fabricsAPI.deleteFabric('abc123')

    expect(result).toEqual({ success: false, error: 'Forbidden' })
  })
})
