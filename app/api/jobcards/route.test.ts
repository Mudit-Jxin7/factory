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
  new NextRequest('http://localhost/api/jobcards', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/jobcards — strict one-per-lot enforcement', () => {
  it('creates a job card when none exists for the lot', async () => {
    mockFindOne.mockResolvedValue(null)
    mockInsertOne.mockResolvedValue({ insertedId: 'new-id' })

    const res = await POST(makeRequest({ lotId: 'lot-id-1', lotNumber: 'L001' }))
    const body = await res.json()

    expect(mockInsertOne).toHaveBeenCalledOnce()
    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.created).toBe(true)
  })

  it('checks BOTH lotNumber AND lotId in a single $or query', async () => {
    mockFindOne.mockResolvedValue(null)
    mockInsertOne.mockResolvedValue({ insertedId: 'new-id' })

    await POST(makeRequest({ lotId: 'lot-id-1', lotNumber: 'L001' }))

    expect(mockFindOne).toHaveBeenCalledWith({
      $or: [{ lotNumber: 'L001' }, { lotId: 'lot-id-1' }],
    })
  })

  it('falls back to lotNumber-only query when lotId is absent', async () => {
    mockFindOne.mockResolvedValue(null)
    mockInsertOne.mockResolvedValue({ insertedId: 'new-id' })

    await POST(makeRequest({ lotNumber: 'L001' }))

    expect(mockFindOne).toHaveBeenCalledWith({ $or: [{ lotNumber: 'L001' }] })
  })

  it('blocks creation when a card already exists for the same lotNumber (no lotId caller)', async () => {
    // Simulates: useSaveLot creates card with no lotId, then AllLotsContent tries to create with lotId
    mockFindOne.mockResolvedValue({ _id: 'card-A', lotNumber: 'L001' /* no lotId */ })

    const res = await POST(makeRequest({ lotId: 'lot-id-1', lotNumber: 'L001' }))
    const body = await res.json()

    expect(mockInsertOne).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(body.created).toBe(false)
  })

  it('blocks creation when a card already exists for the same lotId (with lotId caller)', async () => {
    // Simulates: AllLotsContent already created a card, useSaveLot tries again without lotId
    mockFindOne.mockResolvedValue({ _id: 'card-B', lotId: 'lot-id-1', lotNumber: 'L001' })

    const res = await POST(makeRequest({ lotNumber: 'L001' }))
    const body = await res.json()

    expect(mockInsertOne).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(body.created).toBe(false)
  })

  it('returns 400 when lotNumber is missing', async () => {
    const res = await POST(makeRequest({ lotId: 'lot-id-1' }))
    const body = await res.json()

    expect(mockFindOne).not.toHaveBeenCalled()
    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('handles unique index violation (race condition) as a no-op', async () => {
    mockFindOne
      .mockResolvedValueOnce(null)                                         // initial check
      .mockResolvedValueOnce({ _id: 'race-id', lotNumber: 'L002' })        // fallback lookup
    const dupError = Object.assign(new Error('duplicate key'), {
      code: 11000, keyValue: { lotNumber: 'L002' },
    })
    mockInsertOne.mockRejectedValue(dupError)

    const res = await POST(makeRequest({ lotNumber: 'L002' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.created).toBe(false)
  })

  it('sets createdAt and updatedAt on new cards', async () => {
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

describe('GET /api/jobcards', () => {
  it('returns all job cards sorted by createdAt desc', async () => {
    const cards = [{ lotNumber: 'L002' }, { lotNumber: 'L001' }]
    mockFind.mockResolvedValue(cards)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.jobCards).toEqual(cards)
  })

  it('returns 500 on database error', async () => {
    mockFind.mockRejectedValue(new Error('Timeout'))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
  })
})
