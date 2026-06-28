'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { lotsAPI, jobCardsAPI } from '@/lib/api'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import { useConfirm } from './ConfirmProvider'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import './dashboard.css'

interface LotViewContentProps {
  lotNumber: string
}

export default function LotViewContent({ lotNumber }: LotViewContentProps) {
  const router = useRouter()
  const toast = useToast()
  const { confirm: showConfirm } = useConfirm()
  const [lot, setLot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [generatingExcel, setGeneratingExcel] = useState(false)

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
        worker: '',
        rate: '',
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
          zip_code: '',
          thread_code: '',
        })),
        flyWidth: '',
        additionalInfo: {
          belt: '',
          bottom: '',
          pasting: '',
          bone: '',
          hala: '',
          ticketPocket: '',
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

  const exportToPDF = () => {
    if (!lot) return
    setGeneratingPDF(true)
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const margin = 10

      // ── Title ──────────────────────────────────────────────────────────────
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Lot Details: ${lot.lotNumber}`, pageW / 2, 14, { align: 'center' })

      // ── Lot Information ────────────────────────────────────────────────────
      pdf.setFontSize(11)
      pdf.text('Lot Information', margin, 24)

      const infoRows = [
        ['Lot Number', lot.lotNumber || 'N/A', 'Date', lot.date || 'N/A'],
        ['Fabric', lot.fabric || 'N/A', 'Pattern', lot.pattern || 'N/A'],
        ['Brand', lot.brand || 'N/A', 'Created At', lot.createdAt ? new Date(lot.createdAt).toLocaleString() : 'N/A'],
      ]

      autoTable(pdf, {
        startY: 26,
        margin: { left: margin, right: margin },
        body: infoRows,
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { fontStyle: 'bold', cellWidth: 35 } },
        theme: 'grid',
      })

      // ── Ratios ─────────────────────────────────────────────────────────────
      const afterInfo = (pdf as any).lastAutoTable.finalY + 6
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Ratios', margin, afterInfo)

      const ratioKeys = Object.keys(lot.ratios || {})
      const ratioVals = Object.values(lot.ratios || {}).map(v => String(v))
      const sumOfRatios = Object.values(lot.ratios || {})
        .reduce((s: number, v: any) => s + (Number(v) || 0), 0)
        .toFixed(2)

      autoTable(pdf, {
        startY: afterInfo + 2,
        margin: { left: margin, right: margin },
        head: [ratioKeys.map(k => k.toUpperCase())],
        body: [ratioVals],
        styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        theme: 'grid',
      })

      const afterRatios = (pdf as any).lastAutoTable.finalY + 2
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Sum of Ratios: ${sumOfRatios}`, margin, afterRatios + 4)

      // ── Production Data ────────────────────────────────────────────────────
      const afterRatioSum = afterRatios + 10
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Production Data', margin, afterRatioSum)

      const prodHead = ['S.No', 'Meter', 'Layer', 'Pieces', 'Color', 'Shade', 'TBD2', 'TBD3']
      const prodBody = (lot.productionData || []).map((row: any) => [
        row.serialNumber,
        Number(row.meter || 0),
        Number(row.layer || 1),
        Number(row.pieces || 0).toFixed(2),
        row.color || 'N/A',
        row.shade || 'N/A',
        row.tbd2 || 'N/A',
        row.tbd3 || 'N/A',
      ])

      autoTable(pdf, {
        startY: afterRatioSum + 2,
        margin: { left: margin, right: margin },
        head: [prodHead],
        body: prodBody,
        styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 247, 255] },
        theme: 'grid',
      })

      // ── Summary ────────────────────────────────────────────────────────────
      const afterProd = (pdf as any).lastAutoTable.finalY + 6
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Summary & Calculations', margin, afterProd)

      const grandTotal = Number(
        lot.totalPiecesWithTukda ?? (Number(lot.totalPieces || 0) + Number(lot.tukda?.count || 0))
      ).toFixed(2)

      autoTable(pdf, {
        startY: afterProd + 2,
        margin: { left: margin, right: margin },
        head: [['# Tukda', 'Tukda Size', 'Total Meter', 'Total Pieces', 'Grand Total Pieces', 'Average']],
        body: [[
          lot.tukda?.count || 0,
          lot.tukda?.size || 'N/A',
          Number(lot.totalMeter || 0).toFixed(2),
          Number(lot.totalPieces || 0).toFixed(2),
          grandTotal,
          Number(lot.average || 0).toFixed(4),
        ]],
        styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        theme: 'grid',
      })

      pdf.save(`Lot_${lot.lotNumber || 'Production'}_${lot.date || 'Report'}.pdf`)
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      toast.showToast('Error generating PDF: ' + error.message, 'error')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const exportToExcel = () => {
    if (!lot) return
    setGeneratingExcel(true)
    try {
      const infoRows = [
        ['Lot Number', lot.lotNumber || ''],
        ['Date', lot.date || ''],
        ['Fabric', lot.fabric || ''],
        ['Pattern', lot.pattern || ''],
        ['Brand', lot.brand || ''],
        ['Created At', lot.createdAt ? new Date(lot.createdAt).toLocaleString() : ''],
        [],
        ['Ratios'],
        Object.keys(lot.ratios || {}).map((k: string) => k.toUpperCase()),
        Object.values(lot.ratios || {}).map((v: any) => String(v)),
        [],
      ]

      const prodHeaders = ['S.No', 'Meter', 'Layer', 'Pieces', 'Color', 'Shade', 'TBD2', 'TBD3']
      const prodRows = (lot.productionData || []).map((row: any) => [
        row.serialNumber, Number(row.meter || 0), Number(row.layer || 1),
        Number(row.pieces || 0).toFixed(2), row.color || '', row.shade || '',
        row.tbd2 || '', row.tbd3 || '',
      ])

      const summaryHeaders = ['# Tukda', 'Tukda Size', 'Total Meter', 'Total Pieces', 'Grand Total Pieces', 'Average']
      const grandTotal = Number(lot.totalPiecesWithTukda ?? (Number(lot.totalPieces || 0) + Number(lot.tukda?.count || 0))).toFixed(2)
      const summaryRow = [
        lot.tukda?.count || 0, lot.tukda?.size || '',
        Number(lot.totalMeter || 0).toFixed(2), Number(lot.totalPieces || 0).toFixed(2),
        grandTotal, Number(lot.average || 0).toFixed(4),
      ]

      const allRows = [
        ...infoRows,
        prodHeaders,
        ...prodRows,
        [],
        ['Summary'],
        summaryHeaders,
        summaryRow,
      ]

      const csvContent = allRows.map((row) =>
        (row as any[]).map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      ).join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.setAttribute('href', URL.createObjectURL(blob))
      link.setAttribute('download', `Lot_${lot.lotNumber || 'Production'}_${lot.date || 'Report'}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.showToast('Excel file exported successfully!', 'success')
    } catch (error: any) {
      toast.showToast('Error generating Excel: ' + error.message, 'error')
    } finally {
      setGeneratingExcel(false)
    }
  }

  const handleDeleteLot = async () => {
    if (!lot) return
    
    const confirmed = await showConfirm({
      title: 'Delete Lot',
      message: `Are you sure you want to delete lot "${lot.lotNumber}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    })

    if (!confirmed) {
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
      <div className="dashboard-container">
        <div className="dashboard-header">
        <div className="header-title">
          <h1>Lot Details: {lot.lotNumber}</h1>
          <p>View saved lot production data</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={exportToPDF} disabled={generatingPDF}>
            <span className="btn-icon">📄</span>
            {generatingPDF ? 'Generating...' : 'Download PDF'}
          </button>
          <button className="btn btn-primary" onClick={exportToExcel} disabled={generatingExcel}>
            <span className="btn-icon">📊</span>
            {generatingExcel ? 'Generating...' : 'Download Excel'}
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
