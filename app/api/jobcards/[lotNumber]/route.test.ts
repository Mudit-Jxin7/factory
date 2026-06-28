import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockFindOne = vi.fn()
const mockDeleteOne = vi.fn()
const mockLotsDelete = vi.fn()

vi.mock('@/lib/mongodb', () => ({
  default: Promise.resolve({
    db: () => ({
      collection: (name: string) => {
        if (name === 'lots') return { deleteOne: mockLotsDelete }
        // jobcards collection
        return { findOne: mockFindOne, deleteOne: mockDeleteOne, updateOne: vi.fn() }
      },
    }),
  }),
}))

import { DELETE } from './route'

const makeRequest = () =>
  new NextRequest('http://localhost/api/jobcards/L001', { method: 'DELETE' })

const makeParams = (lotNumber = 'L001') => ({ params: { lotNumber } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DELETE /api/jobcards/[lotNumber] — must NOT touch the lots collection', () => {
  it('deletes the job card and leaves the lot untouched', async () => {
    mockFindOne.mockResolvedValue({ _id: 'jc-id', lotNumber: 'L001' })
    mockDeleteOne.mockResolvedValue({ deletedCount: 1 })

    const res = await DELETE(makeRequest(), makeParams())
    const body = await res.json()

    expect(mockDeleteOne).toHaveBeenCalledWith({ lotNumber: 'L001' })
    expect(mockLotsDelete).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 404 when the job card does not exist', async () => {
    mockFindOne.mockResolvedValue(null)

    const res = await DELETE(makeRequest(), makeParams())
    const body = await res.json()

    expect(mockDeleteOne).not.toHaveBeenCalled()
    expect(mockLotsDelete).not.toHaveBeenCalled()
    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('never calls the lots collection under any circumstance', async () => {
    mockFindOne.mockResolvedValue({ _id: 'jc-id', lotNumber: 'L001' })
    mockDeleteOne.mockResolvedValue({ deletedCount: 1 })

    await DELETE(makeRequest(), makeParams())

    expect(mockLotsDelete).not.toHaveBeenCalled()
  })
})
