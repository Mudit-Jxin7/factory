'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { jobCardsAPI, workersAPI } from '@/lib/api'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './dashboard.css'

interface AnalyticsRow {
  worker_id: number
  worker_name: string
  worker_full_name: string
  date: string
  rate: number
  lotNumber: string
  layer: number
  pieces: number
  total_amount: number
}

export default function WorkerAnalyticsContent() {
  const toast = useToast()
  const analyticsRef = useRef<HTMLDivElement>(null)
  const [jobCards, setJobCards] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [generatingExcel, setGeneratingExcel] = useState(false)
  
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedWorker, setSelectedWorker] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [jobCardsResult, workersResult] = await Promise.all([
        jobCardsAPI.getAllJobCards(),
        workersAPI.getAllWorkers(),
      ])

      if (jobCardsResult.success) {
        setJobCards(jobCardsResult.jobCards || [])
      } else {
        toast.showToast('Error fetching job cards: ' + jobCardsResult.error, 'error')
      }

      if (workersResult.success) {
        setWorkers(workersResult.workers || [])
      } else {
        toast.showToast('Error fetching workers: ' + workersResult.error, 'error')
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.showToast('Error fetching data: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Process job cards to create analytics rows
  const analyticsData = useMemo(() => {
    const rows: AnalyticsRow[] = []

    jobCards.forEach((jobCard: any) => {
      if (!jobCard.productionData || !Array.isArray(jobCard.productionData)) {
        return
      }

      jobCard.productionData.forEach((row: any) => {
        if (!row.worker || !row.date || !row.rate) {
          return
        }

        // Find worker details
        const worker = workers.find((w: any) => w._id === row.worker)
        if (!worker) {
          return
        }

        const pieces = Number(row.pieces) || 0
        const rate = Number(row.rate) || 0
        const total_amount = pieces * rate

        rows.push({
          worker_id: worker.worker_id,
          worker_name: worker.worker_full_name,
          worker_full_name: worker.worker_full_name,
          date: row.date,
          rate: rate,
          lotNumber: jobCard.lotNumber,
          layer: Number(row.layer) || 0,
          pieces: pieces,
          total_amount: total_amount,
        })
      })
    })

    return rows
  }, [jobCards, workers])

  // Filter analytics data
  const filteredData = useMemo(() => {
    let filtered = [...analyticsData]

    // Filter by date range
    if (fromDate) {
      filtered = filtered.filter((row) => row.date >= fromDate)
    }
    if (toDate) {
      filtered = filtered.filter((row) => row.date <= toDate)
    }

    // Filter by worker
    if (selectedWorker) {
      filtered = filtered.filter((row) => {
        const worker = workers.find((w: any) => w._id === selectedWorker)
        return worker && row.worker_id === worker.worker_id
      })
    }

    // Sort by date (newest first), then by worker_id
    return filtered.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date)
      }
      return a.worker_id - b.worker_id
    })
  }, [analyticsData, fromDate, toDate, selectedWorker, workers])

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, row) => ({
        totalPieces: acc.totalPieces + row.pieces,
        totalAmount: acc.totalAmount + row.total_amount,
      }),
      { totalPieces: 0, totalAmount: 0 }
    )
  }, [filteredData])

  const clearFilters = () => {
    setFromDate('')
    setToDate('')
    setSelectedWorker('')
  }

  const exportToPDF = async () => {
    if (!analyticsRef.current) return

    setGeneratingPDF(true)

    try {
      // Hide navigation bar temporarily
      const navBar = document.querySelector('.main-navbar') as HTMLElement
      const originalDisplay = navBar?.style.display
      if (navBar) {
        navBar.style.display = 'none'
      }

      // Clone the element for PDF generation
      const clone = analyticsRef.current.cloneNode(true) as HTMLElement
      clone.style.position = 'absolute'
      clone.style.left = '-9999px'
      clone.style.top = '0'
      document.body.appendChild(clone)

      // Hide filters in PDF
      const filters = clone.querySelector('.filters-section') as HTMLElement
      if (filters) {
        filters.style.display = 'none'
      }

      // Replace all inputs with divs showing their values
      const inputs = clone.querySelectorAll('input, select')
      inputs.forEach((input) => {
        const htmlInput = input as HTMLInputElement | HTMLSelectElement
        const element = input as HTMLElement
        const computedStyle = window.getComputedStyle(element)

        const value = htmlInput.value || ''
        const div = document.createElement('div')
        div.textContent = value
        div.style.cssText = computedStyle.cssText
        div.style.display = 'inline-block'
        div.style.width = computedStyle.width
        div.style.height = computedStyle.height
        div.style.padding = computedStyle.padding
        div.style.border = computedStyle.border
        div.style.borderRadius = computedStyle.borderRadius
        div.style.backgroundColor = computedStyle.backgroundColor
        div.style.color = computedStyle.color
        div.style.fontSize = computedStyle.fontSize
        div.style.fontFamily = computedStyle.fontFamily
        div.style.lineHeight = computedStyle.lineHeight
        div.style.minHeight = computedStyle.minHeight
        div.style.boxSizing = 'border-box'

        element.parentNode?.replaceChild(div, element)
      })

      await new Promise((resolve) => setTimeout(resolve, 50))

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8f9fa',
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
      })

      document.body.removeChild(clone)

      if (navBar) {
        navBar.style.display = originalDisplay || ''
      }

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      const ratio = imgWidth / imgHeight
      const pageWidth = pdfWidth - 20
      const pageHeight = pdfHeight - 20

      let finalWidth = pageWidth
      let finalHeight = finalWidth / ratio

      const marginX = (pdfWidth - finalWidth) / 2
      let positionY = 10

      if (finalHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', marginX, positionY, finalWidth, finalHeight)
      } else {
        const totalPages = Math.ceil(finalHeight / pageHeight)
        let sourceY = 0

        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage()
            positionY = 10
          }

          const remainingHeight = finalHeight - (i * pageHeight)
          const currentPageHeight = Math.min(pageHeight, remainingHeight)
          const sourceHeight = (currentPageHeight / finalHeight) * imgHeight

          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = imgWidth
          pageCanvas.height = sourceHeight
          const ctx = pageCanvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight)
          }

          const pageImgData = pageCanvas.toDataURL('image/png')
          pdf.addImage(pageImgData, 'PNG', marginX, positionY, finalWidth, currentPageHeight)

          sourceY += sourceHeight
        }
      }

      const dateRange = fromDate && toDate ? `_${fromDate}_to_${toDate}` : ''
      const workerName = selectedWorker
        ? `_${workers.find((w: any) => w._id === selectedWorker)?.worker_full_name || 'worker'}`
        : ''
      pdf.save(`WorkerAnalytics${dateRange}${workerName}.pdf`)
      toast.showToast('PDF exported successfully!', 'success')
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      toast.showToast('Error generating PDF: ' + error.message, 'error')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const exportToExcel = () => {
    try {
      setGeneratingExcel(true)

      // Create CSV content
      const headers = [
        'Worker ID',
        'Worker Name',
        'Date',
        'Rate',
        'Lot Number',
        'Layer',
        'Pieces',
        'Total Amount',
      ]

      const rows = filteredData.map((row) => [
        row.worker_id.toString(),
        row.worker_full_name,
        row.date,
        row.rate.toString(),
        row.lotNumber,
        row.layer.toString(),
        row.pieces.toString(),
        row.total_amount.toFixed(2),
      ])

      // Add totals row
      rows.push([
        '',
        'TOTAL',
        '',
        '',
        '',
        '',
        totals.totalPieces.toFixed(2),
        totals.totalAmount.toFixed(2),
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n')

      // Create blob and download
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      const dateRange = fromDate && toDate ? `_${fromDate}_to_${toDate}` : ''
      const workerName = selectedWorker
        ? `_${workers.find((w: any) => w._id === selectedWorker)?.worker_full_name || 'worker'}`
        : ''
      link.setAttribute('download', `WorkerAnalytics${dateRange}${workerName}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.showToast('Excel file exported successfully!', 'success')
    } catch (error: any) {
      console.error('Error generating Excel:', error)
      toast.showToast('Error generating Excel: ' + error.message, 'error')
    } finally {
      setGeneratingExcel(false)
    }
  }

  return (
    <>
      <NavigationBar />
      <div className="dashboard-container" ref={analyticsRef}>
        <div className="dashboard-header">
          <div className="header-title">
            <h1>Worker Analytics</h1>
            <p>Analyze worker performance and earnings</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={exportToPDF}
              disabled={generatingPDF || filteredData.length === 0}
            >
              <span className="btn-icon">📄</span>
              {generatingPDF ? 'Generating PDF...' : 'Export PDF'}
            </button>
            <button
              className="btn btn-primary"
              onClick={exportToExcel}
              disabled={generatingExcel || filteredData.length === 0}
            >
              <span className="btn-icon">📊</span>
              {generatingExcel ? 'Generating Excel...' : 'Export Excel'}
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Filters */}
          <div className="card filters-section" style={{ marginBottom: '20px', padding: '20px', background: '#fff9e6' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>Filters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Worker</label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                  }}
                >
                  <option value="">All Workers</option>
                  {workers.map((worker: any) => (
                    <option key={worker._id} value={worker._id}>
                      {worker.worker_id} - {worker.worker_full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={clearFilters}
                  style={{ padding: '10px 20px', fontSize: '14px', whiteSpace: 'nowrap' }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Analytics Table */}
          <div className="card">
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>Loading analytics...</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2>Worker Analytics ({filteredData.length} records)</h2>
                </div>

                {filteredData.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                    No data found matching the filters
                  </div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="production-table" style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Worker ID</th>
                            <th>Worker Name</th>
                            <th>Date</th>
                            <th>Rate</th>
                            <th>Lot Number</th>
                            <th>Layer</th>
                            <th>Pieces</th>
                            <th>Total Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.map((row, index) => (
                            <tr key={index}>
                              <td style={{ fontWeight: '600', color: '#1a1a1a' }}>{row.worker_id}</td>
                              <td>{row.worker_full_name}</td>
                              <td>{row.date}</td>
                              <td>{row.rate.toFixed(2)}</td>
                              <td style={{ fontWeight: '600', color: '#1a1a1a' }}>{row.lotNumber}</td>
                              <td>{row.layer}</td>
                              <td>{row.pieces.toFixed(2)}</td>
                              <td style={{ fontWeight: '600', color: '#1a1a1a' }}>
                                {row.total_amount.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          {/* Totals Row */}
                          <tr style={{ backgroundColor: '#fff9e6', fontWeight: '600' }}>
                            <td colSpan={6} style={{ textAlign: 'right', padding: '12px' }}>
                              TOTAL:
                            </td>
                            <td style={{ padding: '12px' }}>{totals.totalPieces.toFixed(2)}</td>
                            <td style={{ padding: '12px', color: '#1a1a1a' }}>
                              {totals.totalAmount.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
