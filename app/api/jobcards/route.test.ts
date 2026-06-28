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

describe('POST /api/jobcards', () => {
  it('creates a new job card when none exists for the lotNumber', async () => {
    mockFindOne.mockResolvedValue(null)
    mockInsertOne.mockResolvedValue({ insertedId: 'abc123' })

    const res = await POST(makeRequest({ lotNumber: 'L001', brand: 'Levis' }))
    const body = await res.json()

    expect(mockFindOne).toHaveBeenCalledWith({ lotNumber: 'L001' })
    expect(mockInsertOne).toHaveBeenCalledOnce()
    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.created).toBe(true)
    expect(body.id).toBe('abc123')
    expect(body.lotNumber).toBe('L001')
  })

  it('does NOT insert a duplicate when a job card already exists for the lotNumber', async () => {
    mockFindOne.mockResolvedValue({ _id: 'existing-id', lotNumber: 'L001' })

    const res = await POST(makeRequest({ lotNumber: 'L001', brand: 'Levis' }))
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

    await POST(makeRequest({ lotNumber: 'L002' }))

    const inserted = mockInsertOne.mock.calls[0][0]
    expect(inserted.createdAt).toBeInstanceOf(Date)
    expect(inserted.updatedAt).toBeInstanceOf(Date)
  })

  it('does not overwrite timestamps on existing job cards (since it returns early)', async () => {
    const originalDate = new Date('2024-01-01')
    mockFindOne.mockResolvedValue({ _id: 'old-id', lotNumber: 'L003', createdAt: originalDate })

    await POST(makeRequest({ lotNumber: 'L003' }))

    expect(mockInsertOne).not.toHaveBeenCalled()
  })

  it('handles a race-condition duplicate key error (code 11000) as a no-op', async () => {
    // findOne returns null (race: both requests pass the check), then insertOne throws 11000
    mockFindOne
      .mockResolvedValueOnce(null)              // initial duplicate check
      .mockResolvedValueOnce({ _id: 'race-id', lotNumber: 'L004' }) // fallback lookup
    const dupError = Object.assign(new Error('duplicate key'), {
      code: 11000,
      keyValue: { lotNumber: 'L004' },
    })
    mockInsertOne.mockRejectedValue(dupError)

    const res = await POST(makeRequest({ lotNumber: 'L004' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.created).toBe(false)
  })

  it('returns 500 on unexpected database error', async () => {
    mockFindOne.mockRejectedValue(new Error('DB connection failed'))

    const res = await POST(makeRequest({ lotNumber: 'L005' }))
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
