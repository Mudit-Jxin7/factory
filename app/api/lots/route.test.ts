import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockFindOne = vi.fn()
const mockInsertOne = vi.fn()
const mockFind = vi.fn()

vi.mock('@/lib/mongodb', () => ({
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        findOne: (...args: unknown[]) => mockFindOne(...args),
        insertOne: (...args: unknown[]) => mockInsertOne(...args),
        find: () => ({ sort: () => ({ toArray: () => mockFind() }) }),
      }),
    }),
  }),
}))

import { GET, POST } from './route'

const makeRequest = (body: object) =>
  new NextRequest('http://localhost/api/lots', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/lots — lot number uniqueness', () => {
  it('creates a new lot when the lot number does not exist yet', async () => {
    mockFindOne.mockResolvedValue(null)
    mockInsertOne.mockResolvedValue({ insertedId: 'new-id' })

    const res = await POST(makeRequest({ lotNumber: 'L001', brand: 'Levis' }))
    const body = await res.json()

    expect(mockFindOne).toHaveBeenCalledWith({ lotNumber: 'L001' })
    expect(mockInsertOne).toHaveBeenCalledOnce()
    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.lotNumber).toBe('L001')
  })

  it('rejects with 409 when the lot number already exists', async () => {
    mockFindOne.mockResolvedValue({ _id: 'existing', lotNumber: 'L001' })

    const res = await POST(makeRequest({ lotNumber: 'L001', brand: 'Levis' }))
    const body = await res.json()

    expect(mockInsertOne).not.toHaveBeenCalled()
    expect(res.status).toBe(409)
    expect(body.success).toBe(false)
    expect(body.error).toContain('L001')
    expect(body.error).toContain('already exists')
  })

  it('rejects with 400 when lot number is missing', async () => {
    const res = await POST(makeRequest({ brand: 'Levis' }))
    const body = await res.json()

    expect(mockFindOne).not.toHaveBeenCalled()
    expect(mockInsertOne).not.toHaveBeenCalled()
    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/lot number is required/i)
  })

  it('rejects with 400 when lot number is whitespace only', async () => {
    const res = await POST(makeRequest({ lotNumber: '   ' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('handles race-condition duplicate key error (11000) as 409', async () => {
    mockFindOne.mockResolvedValue(null)
    const dupError = Object.assign(new Error('duplicate key'), {
      code: 11000,
      keyValue: { lotNumber: 'L002' },
    })
    mockInsertOne.mockRejectedValue(dupError)

    const res = await POST(makeRequest({ lotNumber: 'L002' }))
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.success).toBe(false)
    expect(body.error).toContain('L002')
  })

  it('sets createdAt and updatedAt on new lots', async () => {
    mockFindOne.mockResolvedValue(null)
    mockInsertOne.mockResolvedValue({ insertedId: 'id' })

    await POST(makeRequest({ lotNumber: 'L003' }))

    const inserted = mockInsertOne.mock.calls[0][0]
    expect(inserted.createdAt).toBeInstanceOf(Date)
    expect(inserted.updatedAt).toBeInstanceOf(Date)
  })

  it('returns 500 on unexpected database errors', async () => {
    mockFindOne.mockRejectedValue(new Error('DB timeout'))

    const res = await POST(makeRequest({ lotNumber: 'L004' }))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('DB timeout')
  })
})

describe('GET /api/lots', () => {
  it('returns all lots sorted by createdAt desc', async () => {
    const lots = [{ lotNumber: 'L002' }, { lotNumber: 'L001' }]
    mockFind.mockResolvedValue(lots)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.lots).toEqual(lots)
  })

  it('returns 500 on database error', async () => {
    mockFind.mockRejectedValue(new Error('Connection refused'))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
  })
})
