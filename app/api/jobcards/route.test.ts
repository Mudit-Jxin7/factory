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

describe('POST /api/jobcards — dedup by lotId (lot numbers are not unique)', () => {
  it('deduplicates by lotId when the field is present', async () => {
    mockFindOne.mockResolvedValue(null)
    mockInsertOne.mockResolvedValue({ insertedId: 'abc123' })

    await POST(makeRequest({ lotId: 'mongo-id-1', lotNumber: 'L001' }))

    // Must query by lotId, not lotNumber
    expect(mockFindOne).toHaveBeenCalledWith({ lotId: 'mongo-id-1' })
  })

  it('falls back to lotNumber dedup for legacy cards without lotId', async () => {
    mockFindOne.mockResolvedValue(null)
    mockInsertOne.mockResolvedValue({ insertedId: 'abc123' })

    await POST(makeRequest({ lotNumber: 'L001' }))

    expect(mockFindOne).toHaveBeenCalledWith({ lotNumber: 'L001' })
  })

  it('creates a new job card when none exists for the lotId', async () => {
    mockFindOne.mockResolvedValue(null)
    mockInsertOne.mockResolvedValue({ insertedId: 'abc123' })

    const res = await POST(makeRequest({ lotId: 'mongo-id-1', lotNumber: 'L001', brand: 'Levis' }))
    const body = await res.json()

    expect(mockInsertOne).toHaveBeenCalledOnce()
    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.created).toBe(true)
    expect(body.id).toBe('abc123')
  })

  it('allows two job cards with the same lotNumber but different lotIds', async () => {
    // First lot with lotId=A creates a card
    mockFindOne.mockResolvedValue(null)
    mockInsertOne.mockResolvedValue({ insertedId: 'card-A' })
    const resA = await POST(makeRequest({ lotId: 'lot-id-A', lotNumber: 'L001' }))
    expect((await resA.json()).created).toBe(true)

    // Second lot with lotId=B and the same lotNumber L001 should ALSO create a card
    vi.clearAllMocks()
    mockFindOne.mockResolvedValue(null)
    mockInsertOne.mockResolvedValue({ insertedId: 'card-B' })
    const resB = await POST(makeRequest({ lotId: 'lot-id-B', lotNumber: 'L001' }))
    expect((await resB.json()).created).toBe(true)
    expect(mockInsertOne).toHaveBeenCalledOnce()
  })

  it('does NOT insert a duplicate when a job card already exists for the lotId', async () => {
    mockFindOne.mockResolvedValue({ _id: 'existing-id', lotId: 'mongo-id-1', lotNumber: 'L001' })

    const res = await POST(makeRequest({ lotId: 'mongo-id-1', lotNumber: 'L001' }))
    const body = await res.json()

    expect(mockInsertOne).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.created).toBe(false)
    expect(body.id).toBe('existing-id')
  })

  it('sets createdAt and updatedAt timestamps on new job cards', async () => {
    mockFindOne.mockResolvedValue(null)
    mockInsertOne.mockResolvedValue({ insertedId: 'new-id' })

    await POST(makeRequest({ lotId: 'mongo-id-2', lotNumber: 'L002' }))

    const inserted = mockInsertOne.mock.calls[0][0]
    expect(inserted.createdAt).toBeInstanceOf(Date)
    expect(inserted.updatedAt).toBeInstanceOf(Date)
  })

  it('does not insert when the existing card is found (timestamps preserved)', async () => {
    mockFindOne.mockResolvedValue({ _id: 'old-id', lotId: 'mongo-id-3', createdAt: new Date('2024-01-01') })

    await POST(makeRequest({ lotId: 'mongo-id-3', lotNumber: 'L003' }))

    expect(mockInsertOne).not.toHaveBeenCalled()
  })

  it('returns 500 on unexpected database error', async () => {
    mockFindOne.mockRejectedValue(new Error('DB connection failed'))

    const res = await POST(makeRequest({ lotId: 'mongo-id-4', lotNumber: 'L004' }))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('DB connection failed')
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
    expect(body.error).toBe('Timeout')
  })
})
