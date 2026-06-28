import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockLotsFind = vi.fn()
const mockLotsDelete = vi.fn()
const mockJobCardsDelete = vi.fn()
const mockLotsUpdate = vi.fn()

vi.mock('@/lib/mongodb', () => ({
  default: Promise.resolve({
    db: () => ({
      collection: (name: string) => {
        if (name === 'lots') return {
          findOne: mockLotsFind,
          deleteOne: mockLotsDelete,
          updateOne: mockLotsUpdate,
        }
        if (name === 'jobcards') return {
          deleteOne: mockJobCardsDelete,
        }
        return {}
      },
    }),
  }),
}))

import { DELETE, PUT } from './route'

const makeRequest = (method = 'DELETE', body?: object) =>
  new NextRequest('http://localhost/api/lots/L001', {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  })

const makeParams = (lotNumber = 'L001') => ({ params: { lotNumber } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DELETE /api/lots/[lotNumber] — cascade behaviour', () => {
  it('deletes the associated job card when a lot is deleted', async () => {
    mockLotsFind.mockResolvedValue({ _id: 'lot-id', lotNumber: 'L001' })
    mockJobCardsDelete.mockResolvedValue({ deletedCount: 1 })
    mockLotsDelete.mockResolvedValue({ deletedCount: 1 })

    const res = await DELETE(makeRequest(), makeParams())
    const body = await res.json()

    expect(mockJobCardsDelete).toHaveBeenCalledWith({ lotNumber: 'L001' })
    expect(mockLotsDelete).toHaveBeenCalledWith({ lotNumber: 'L001' })
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('deletes the lot even if the job card does not exist', async () => {
    mockLotsFind.mockResolvedValue({ _id: 'lot-id', lotNumber: 'L001' })
    mockJobCardsDelete.mockResolvedValue({ deletedCount: 0 })
    mockLotsDelete.mockResolvedValue({ deletedCount: 1 })

    const res = await DELETE(makeRequest(), makeParams())
    const body = await res.json()

    expect(mockLotsDelete).toHaveBeenCalledOnce()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('deletes the lot even if job card deletion throws', async () => {
    mockLotsFind.mockResolvedValue({ _id: 'lot-id', lotNumber: 'L001' })
    mockJobCardsDelete.mockRejectedValue(new Error('job card DB error'))
    mockLotsDelete.mockResolvedValue({ deletedCount: 1 })

    const res = await DELETE(makeRequest(), makeParams())
    const body = await res.json()

    expect(mockLotsDelete).toHaveBeenCalledOnce()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 404 when the lot does not exist', async () => {
    mockLotsFind.mockResolvedValue(null)

    const res = await DELETE(makeRequest(), makeParams())
    const body = await res.json()

    expect(mockJobCardsDelete).not.toHaveBeenCalled()
    expect(mockLotsDelete).not.toHaveBeenCalled()
    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('decodes URL-encoded lot numbers', async () => {
    mockLotsFind.mockResolvedValue({ _id: 'id', lotNumber: 'L 001/A' })
    mockJobCardsDelete.mockResolvedValue({ deletedCount: 1 })
    mockLotsDelete.mockResolvedValue({ deletedCount: 1 })

    await DELETE(makeRequest(), makeParams('L%20001%2FA'))

    expect(mockJobCardsDelete).toHaveBeenCalledWith({ lotNumber: 'L 001/A' })
    expect(mockLotsDelete).toHaveBeenCalledWith({ lotNumber: 'L 001/A' })
  })
})
