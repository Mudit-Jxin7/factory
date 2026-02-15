'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { lotsAPI, jobCardsAPI } from '@/lib/api'
import NavigationBar from './NavigationBar'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './dashboard.css'

export default function AllLotsContent() {
  const router = useRouter()
  const [allLots, setAllLots] = useState<any[]>([])
  const [loadingLots, setLoadingLots] = useState(true)
  const [deletingLot, setDeletingLot] = useState<string | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const allLotsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAllLots()
  }, [])

  useEffect(() => {
    if (allLots.length > 0) {
      ensureJobCardsForAllLots()
    }
  }, [allLots])

  const ensureJobCardsForAllLots = async () => {
    // Check all lots in parallel and create missing job cards
    const promises = allLots.map(async (lot) => {
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
    })
    
    await Promise.all(promises)
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
      console.error(`Error auto-creating job card for lot ${lotData.lotNumber}:`, error)
    }
  }

  const fetchAllLots = async () => {
    setLoadingLots(true)
    try {
      const result = await lotsAPI.getAllLots()
      if (result.success) {
        setAllLots(result.lots || [])
      } else {
        alert('Error fetching lots: ' + result.error)
      }
    } catch (error: any) {
      console.error('Error fetching lots:', error)
      alert('Error fetching lots: ' + error.message)
    } finally {
      setLoadingLots(false)
    }
  }

  const handleViewLot = (lotNumber: string) => {
    router.push(`/lot/${lotNumber}`)
  }


  const handleDeleteLot = async (lotNumber: string) => {
    if (!confirm(`Are you sure you want to delete lot "${lotNumber}"? This action cannot be undone.`)) {
      return
    }

    setDeletingLot(lotNumber)
    try {
      const result = await lotsAPI.deleteLot(lotNumber)
      if (result.success) {
        alert('Lot deleted successfully!')
        // Refresh the list
        fetchAllLots()
      } else {
        alert('Error deleting lot: ' + result.error)
      }
    } catch (error: any) {
      console.error('Error deleting lot:', error)
      alert('Error deleting lot: ' + error.message)
    } finally {
      setDeletingLot(null)
    }
  }

  const exportToPDF = async () => {
    if (!allLotsRef.current) return

    setGeneratingPDF(true)
    
    try {
      // Hide navigation bar temporarily
      const navBar = document.querySelector('.main-navbar') as HTMLElement
      const originalDisplay = navBar?.style.display
      if (navBar) {
        navBar.style.display = 'none'
      }

      // Clone the element for PDF generation
      const clone = allLotsRef.current.cloneNode(true) as HTMLElement
      clone.style.position = 'absolute'
      clone.style.left = '-9999px'
      clone.style.top = '0'
      document.body.appendChild(clone)

      // Hide header actions in PDF
      const headerActions = clone.querySelector('.header-actions') as HTMLElement
      if (headerActions) {
        headerActions.style.display = 'none'
      }
      
      // Hide action buttons column in PDF
      const actionHeaders = clone.querySelectorAll('th')
      actionHeaders.forEach((th) => {
        if (th.textContent?.trim() === 'Actions') {
          (th as HTMLElement).style.display = 'none'
        }
      })
      const rows = clone.querySelectorAll('tbody tr')
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td')
        if (cells.length > 0) {
          // Hide the last cell (Actions column)
          (cells[cells.length - 1] as HTMLElement).style.display = 'none'
        }
      })

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

      pdf.save(`AllLots_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF: ' + error.message)
    } finally {
      setGeneratingPDF(false)
    }
  }


  return (
    <>
      <NavigationBar />
      <div className="dashboard-container" ref={allLotsRef}>
        <div className="dashboard-header">
          <div className="header-title">
            <h1>All Lots</h1>
            <p>View and manage all production lots</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={exportToPDF} disabled={generatingPDF}>
              <span className="btn-icon">📄</span>
              {generatingPDF ? 'Generating PDF...' : 'Save as PDF'}
            </button>
            <button className="btn btn-secondary" onClick={fetchAllLots}>
              <span className="btn-icon">🔄</span>
              Refresh
            </button>
          </div>
        </div>

      <div className="dashboard-content">
        <div className="card">
          {loadingLots ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p>Loading lots...</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2>All Lots ({allLots.length})</h2>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="production-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Lot Number</th>
                      <th>Date</th>
                      <th>Fabric</th>
                      <th>Pattern</th>
                      <th>Brand</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLots.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6c757d', fontSize: '16px' }}>
                          No lots found
                        </td>
                      </tr>
                    ) : (
                      allLots.map((lot: any) => (
                        <tr key={lot._id || lot.lotNumber}>
                          <td style={{ fontWeight: '600', color: '#1a1a1a' }}>{lot.lotNumber || '-'}</td>
                          <td>{lot.date || '-'}</td>
                          <td>{lot.fabric || '-'}</td>
                          <td>{lot.pattern || '-'}</td>
                          <td>{lot.brand || '-'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleViewLot(lot.lotNumber)}
                                style={{ padding: '8px 16px', fontSize: '12px' }}
                              >
                                View
                              </button>
                              <button
                                className="btn btn-primary"
                                onClick={() => router.push(`/dashboard?edit=${encodeURIComponent(lot.lotNumber)}`)}
                                style={{ padding: '8px 16px', fontSize: '12px' }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => router.push(`/jobcard/${encodeURIComponent(lot.lotNumber)}`)}
                                style={{ padding: '8px 16px', fontSize: '12px' }}
                              >
                                Job Card
                              </button>
                              <button
                                className="btn btn-logout"
                                onClick={() => handleDeleteLot(lot.lotNumber)}
                                disabled={deletingLot === lot.lotNumber}
                                style={{ padding: '8px 16px', fontSize: '12px' }}
                              >
                                {deletingLot === lot.lotNumber ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </>
  )
}
