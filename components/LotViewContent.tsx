'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { lotsAPI, jobCardsAPI } from '@/lib/api'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './dashboard.css'

interface LotViewContentProps {
  lotNumber: string
}

export default function LotViewContent({ lotNumber }: LotViewContentProps) {
  const router = useRouter()
  const toast = useToast()
  const [lot, setLot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const lotViewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchLot()
  }, [lotNumber])

  useEffect(() => {
    if (lot) {
      ensureJobCardExists()
    }
  }, [lot])

  const fetchLot = async () => {
    try {
      setLoading(true)
      setError(null)
      // Decode URL-encoded lot number
      const decodedLotNumber = decodeURIComponent(lotNumber)
      console.log('Fetching lot:', decodedLotNumber)
      const result = await lotsAPI.getLotByNumber(decodedLotNumber)

      if (result.success && result.lot) {
        setLot(result.lot)
      } else {
        setError(result.error || `Lot "${decodedLotNumber}" not found`)
      }
    } catch (err: any) {
      console.error('Error fetching lot:', err)
      setError('Error fetching lot: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const ensureJobCardExists = async () => {
    if (!lot) return
    try {
      const result = await jobCardsAPI.getJobCardByLotNumber(lot.lotNumber)
      if (!result.success || !result.jobCard) {
        // Job card doesn't exist, create it automatically
        await createJobCardFromLot(lot)
      }
    } catch (error) {
      // If check fails, try to create job card
      await createJobCardFromLot(lot)
    }
  }

  const createJobCardFromLot = async (lotData: any) => {
    try {
      const jobCardData = {
        lotNumber: lotData.lotNumber,
        date: lotData.date || new Date().toISOString().split('T')[0],
        brand: lotData.brand || '',
        ratios: lotData.ratios || {
          r28: 0, r30: 0, r32: 0, r34: 0, r36: 0,
          r38: 0, r40: 0, r42: 0, r44: 0,
        },
        productionData: (lotData.productionData || []).map((row: any, index: number) => ({
          serialNumber: index + 1,
          layer: Number(row.layer) || 1,
          pieces: Number(row.pieces) || 0,
          color: row.color || '',
          shade: row.shade || '',
          front: '',
          back: '',
          zip: '',
          thread: '',
        })),
        flyWidth: '',
        tbdFields: {
          tbd1: '',
          tbd2: '',
          tbd3: '',
          tbd4: '',
          tbd5: '',
        },
      }

      await jobCardsAPI.createJobCard(jobCardData)
    } catch (error) {
      console.error('Error auto-creating job card:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    router.push('/login')
  }

  const exportToPDF = async () => {
    if (!lotViewRef.current) return

    setGeneratingPDF(true)
    
    try {
      // Hide navigation bar temporarily
      const navBar = document.querySelector('.main-navbar') as HTMLElement
      const originalDisplay = navBar?.style.display
      if (navBar) {
        navBar.style.display = 'none'
      }

      // Clone the element for PDF generation
      const clone = lotViewRef.current.cloneNode(true) as HTMLElement
      clone.style.position = 'absolute'
      clone.style.left = '-9999px'
      clone.style.top = '0'
      document.body.appendChild(clone)

      // Replace all inputs with divs showing their values (empty if no value)
      const inputs = clone.querySelectorAll('input, textarea, select')
      inputs.forEach((input) => {
        const htmlInput = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        const element = input as HTMLElement
        const computedStyle = window.getComputedStyle(element)
        
        // Get the actual value (empty string if empty, no placeholder)
        const value = htmlInput.value || ''
        
        // Create a div to replace the input
        const div = document.createElement('div')
        div.textContent = value // Empty string if no value
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
        
        // Replace input with div
        element.parentNode?.replaceChild(div, element)
      })

      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 50))

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8f9fa',
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
      })

      // Remove clone
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

      pdf.save(`Lot_${lot.lotNumber || 'Production'}_${lot.date || 'Report'}.pdf`)
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      toast.showToast('Error generating PDF: ' + error.message, 'error')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleDeleteLot = async () => {
    if (!lot) return
    
    if (!confirm(`Are you sure you want to delete lot "${lot.lotNumber}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const result = await lotsAPI.deleteLot(lot.lotNumber)
      if (result.success) {
        toast.showToast('Lot deleted successfully!', 'success')
        router.push('/lots')
      } else {
        toast.showToast('Error deleting lot: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Error deleting lot:', error)
      toast.showToast('Error deleting lot: ' + error.message, 'error')
    } finally {
      setDeleting(false)
    }
  }


  if (loading) {
    return (
      <>
        <NavigationBar />
        <div className="dashboard-container">
          <div className="loading-container">
            <p>Loading lot data...</p>
          </div>
        </div>
      </>
    )
  }

  if (error || !lot) {
    return (
      <>
        <NavigationBar />
        <div className="dashboard-container">
          <div className="error-container">
            <h2>Error</h2>
            <p>{error || 'Lot not found'}</p>
            <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <NavigationBar />
      <div className="dashboard-container" ref={lotViewRef}>
        <div className="dashboard-header">
        <div className="header-title">
          <h1>Lot Details: {lot.lotNumber}</h1>
          <p>View saved lot production data</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={exportToPDF} disabled={generatingPDF}>
            <span className="btn-icon">📄</span>
            {generatingPDF ? 'Generating PDF...' : 'Save as PDF'}
          </button>
          <button className="btn btn-secondary" onClick={() => router.push('/dashboard')}>
            <span className="btn-icon">←</span>
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="card">
          <h2>Lot Information</h2>
          <div className="form-grid">
            <div className="info-item">
              <label>Lot Number</label>
              <div className="info-value">{lot.lotNumber || 'N/A'}</div>
            </div>
            <div className="info-item">
              <label>Date</label>
              <div className="info-value">{lot.date || 'N/A'}</div>
            </div>
            <div className="info-item">
              <label>Fabric</label>
              <div className="info-value">{lot.fabric || 'N/A'}</div>
            </div>
            <div className="info-item">
              <label>Pattern</label>
              <div className="info-value">{lot.pattern || 'N/A'}</div>
            </div>
            <div className="info-item">
              <label>Brand</label>
              <div className="info-value">{lot.brand || 'N/A'}</div>
            </div>
            {lot.createdAt && (
              <div className="info-item">
                <label>Created At</label>
                <div className="info-value">
                  {new Date(lot.createdAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2>Ratios</h2>
          <div className="ratios-grid">
            {Object.entries(lot.ratios || {}).map(([key, value]) => (
              <div key={key} className="info-item">
                <label>{key.toUpperCase()}</label>
                <div className="info-value">{String(value)}</div>
              </div>
            ))}
          </div>
          <div className="ratios-summary">
            <strong>
              Sum of Ratios:{' '}
              {Object.values(lot.ratios || {}).reduce(
                (sum: number, val: any) => sum + (Number(val) || 0),
                0
              ).toFixed(2)}
            </strong>
          </div>
        </div>

        <div className="card">
          <h2>Production Data</h2>
          <div className="table-container">
            <table className="production-table">
              <thead>
                <tr>
                  <th>Serial Number</th>
                  <th>Meter</th>
                  <th>Layer</th>
                  <th>Pieces</th>
                  <th>Color</th>
                  <th>Shade</th>
                  <th>TBD2</th>
                  <th>TBD3</th>
                </tr>
              </thead>
              <tbody>
                {lot.productionData && lot.productionData.length > 0 ? (
                  lot.productionData.map((row: any, index: number) => (
                    <tr key={index}>
                      <td>{row.serialNumber}</td>
                      <td>{Number(row.meter) || 0}</td>
                      <td>{Number(row.layer) || 1}</td>
                      <td className="pieces-cell">
                        {Number(row.pieces || 0).toFixed(2)}
                      </td>
                      <td>{row.color || 'N/A'}</td>
                      <td>{row.shade || 'N/A'}</td>
                      <td>{row.tbd2 || 'N/A'}</td>
                      <td>{row.tbd3 || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#6c757d', padding: '40px' }}>
                      No production data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>Summary & Calculations</h2>
          <div className="summary-grid">
            <div className="info-item">
              <label># Tukda</label>
              <div className="info-value">{lot.tukda?.count || 0}</div>
            </div>
            <div className="info-item">
              <label>Tukda Size</label>
              <div className="info-value">{lot.tukda?.size || 'N/A'}</div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📏</div>
              <div className="summary-content">
                <div className="summary-label">Total Meter</div>
                <div className="summary-value">
                  {Number(lot.totalMeter || 0).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📄</div>
              <div className="summary-content">
                <div className="summary-label">Total Pieces</div>
                <div className="summary-value">
                  {Number(lot.totalPieces || 0).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <div className="summary-label">Grand Total Pieces</div>
                <div className="summary-value">
                  {Number(lot.totalPiecesWithTukda || (lot.totalPieces || 0) + (lot.tukda?.count || 0)).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🧮</div>
              <div className="summary-content">
                <div className="summary-label">Average</div>
                <div className="summary-value average-value">
                  {Number(lot.average || 0).toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
