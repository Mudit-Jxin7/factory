import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock jspdf and jspdf-autotable before importing the module under test
vi.mock('jspdf', () => {
  class MockJsPDF {
    internal = { pageSize: { getWidth: () => 297 } }
    setFontSize = vi.fn()
    setFont = vi.fn()
    text = vi.fn()
    setFillColor = vi.fn()
    rect = vi.fn()
    save = vi.fn()
  }
  return { default: MockJsPDF }
})

vi.mock('jspdf-autotable', () => ({ default: vi.fn() }))

import { exportAnalyticsToPDF, exportAnalyticsToExcel } from './exportUtils'

const makeRow = (overrides = {}): Parameters<typeof exportAnalyticsToPDF>[0]['filteredData'][0] => ({
  worker_id: 1,
  worker_full_name: 'Alice',
  section: 'Front',
  date: '2024-01-10',
  rate: 10,
  lotNumber: 'L001',
  layer: 2,
  pieces: 100,
  total_amount: 1000,
  ...overrides,
})

const makeWorker = (overrides = {}) => ({
  _id: 'w1',
  worker_id: 1,
  worker_full_name: 'Alice',
  ...overrides,
})

const baseParams = {
  filteredData: [makeRow()],
  workers: [makeWorker()],
  fromDate: '2024-01-01',
  toDate: '2024-01-31',
  selectedWorker: 'w1',
  totals: { totalPieces: 100, totalAmount: 1000 },
}

describe('exportAnalyticsToPDF', () => {
  it('does not throw with normal params', () => {
    expect(() => exportAnalyticsToPDF(baseParams)).not.toThrow()
  })

  it('does not throw when filteredData is empty', () => {
    expect(() =>
      exportAnalyticsToPDF({ ...baseParams, filteredData: [], totals: { totalPieces: 0, totalAmount: 0 } })
    ).not.toThrow()
  })

  it('does not throw when no worker is selected', () => {
    expect(() =>
      exportAnalyticsToPDF({ ...baseParams, selectedWorker: '' })
    ).not.toThrow()
  })

  it('does not throw when date range is empty', () => {
    expect(() =>
      exportAnalyticsToPDF({ ...baseParams, fromDate: '', toDate: '' })
    ).not.toThrow()
  })
})

describe('exportAnalyticsToExcel', () => {
  let appendedLink: HTMLAnchorElement | null = null
  let blobContent: string | null = null

  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    })

    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        appendedLink = originalCreateElement('a')
        vi.spyOn(appendedLink, 'click').mockImplementation(() => {})
        return appendedLink
      }
      return originalCreateElement(tag)
    })

    const OrigBlob = globalThis.Blob
    vi.stubGlobal('Blob', function (parts: string[], opts: BlobPropertyBag) {
      blobContent = parts.join('')
      return new OrigBlob(parts, opts)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    appendedLink = null
    blobContent = null
  })

  it('triggers a CSV download with the .csv extension', () => {
    exportAnalyticsToExcel(baseParams)

    expect(appendedLink?.getAttribute('download')).toMatch(/\.csv$/)
  })

  it('filename contains date range when both dates are provided', () => {
    exportAnalyticsToExcel(baseParams)

    expect(appendedLink?.getAttribute('download')).toContain('2024-01-01_to_2024-01-31')
  })

  it('filename contains worker name when a worker is selected', () => {
    exportAnalyticsToExcel(baseParams)

    expect(appendedLink?.getAttribute('download')).toContain('Alice')
  })

  it('filename has no date segment when both dates are empty', () => {
    exportAnalyticsToExcel({ ...baseParams, fromDate: '', toDate: '', selectedWorker: '' })

    const download = appendedLink?.getAttribute('download') ?? ''
    expect(download).not.toContain('_to_')
    expect(download).toMatch(/^WorkerAnalytics\.csv$/)
  })

  it('CSV contains filter metadata rows', () => {
    exportAnalyticsToExcel(baseParams)

    expect(blobContent).toContain('"From Date"')
    expect(blobContent).toContain('"To Date"')
    expect(blobContent).toContain('"Worker"')
  })

  it('CSV contains correct header columns', () => {
    exportAnalyticsToExcel(baseParams)

    expect(blobContent).toContain('Worker ID,Worker Name,Front / Back / Zip,Date,Rate,Lot Number,Layer,Pieces,Total Amount')
  })

  it('CSV contains a TOTAL row', () => {
    exportAnalyticsToExcel(baseParams)

    expect(blobContent).toContain('"TOTAL"')
    expect(blobContent).toContain('"100.00"')
    expect(blobContent).toContain('"1000.00"')
  })

  it('CSV rows contain data from filteredData', () => {
    exportAnalyticsToExcel(baseParams)

    expect(blobContent).toContain('"Alice"')
    expect(blobContent).toContain('"L001"')
    expect(blobContent).toContain('"Front"')
  })

  it('includes BOM character for Excel UTF-8 compatibility', () => {
    exportAnalyticsToExcel(baseParams)

    expect(blobContent?.startsWith('\uFEFF')).toBe(true)
  })

  it('does not throw when filteredData is empty', () => {
    expect(() =>
      exportAnalyticsToExcel({ ...baseParams, filteredData: [], totals: { totalPieces: 0, totalAmount: 0 } })
    ).not.toThrow()
  })
})
