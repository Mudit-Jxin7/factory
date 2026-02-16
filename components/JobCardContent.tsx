'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { jobCardsAPI, lotsAPI, workersAPI } from '@/lib/api'
import { getColorForShade } from '@/lib/colorUtils'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './dashboard.css'

interface JobCardContentProps {
  lotNumber: string
  isEdit?: boolean
}

export default function JobCardContent({ lotNumber: initialLotNumber, isEdit: initialIsEdit }: JobCardContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const isEditMode = initialIsEdit || searchParams?.get('edit') === 'true'
  
  // Decode lot number to handle URL-encoded spaces and special characters
  const decodedLotNumber = initialLotNumber ? decodeURIComponent(initialLotNumber) : ''
  const [lotNumber, setLotNumber] = useState(decodedLotNumber)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [brand, setBrand] = useState('')
  const [workers, setWorkers] = useState<any[]>([])
  const [ratios, setRatios] = useState({
    r28: 0, r30: 0, r32: 0, r34: 0, r36: 0,
    r38: 0, r40: 0, r42: 0, r44: 0,
  })
  const [productionData, setProductionData] = useState([
    {
      serialNumber: 1,
      layer: '1',
      pieces: 0,
      color: '',
      shade: '',
      front: '',
      frontWorker: '',
      frontDate: '',
      frontRate: '',
      back: '',
      backWorker: '',
      backDate: '',
      backRate: '',
      zip: '',
      zipWorker: '',
      zipDate: '',
      zipRate: '',
      zip_code: '',
      thread_code: '',
    }
  ])
  const [flyWidth, setFlyWidth] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState({
    belt: '',
    bottom: '',
    pasting: '',
    bone: '',
    hala: '',
    ticketPocket: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [loadingLot, setLoadingLot] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const jobCardRef = useRef<HTMLDivElement>(null)

  const [editingWorkerCell, setEditingWorkerCell] = useState<{ rowIndex: number; field: 'front' | 'back' | 'zip' } | null>(null)
  const [popupWorker, setPopupWorker] = useState('')
  const [popupDate, setPopupDate] = useState('')
  const [popupRate, setPopupRate] = useState('')

  const getWorkerName = (workerId: string) => {
    if (!workerId) return '—'
    const w = workers.find((x: { _id: string }) => x._id === workerId)
    return w ? (w.worker_full_name || String(w.worker_id)) : '—'
  }

  const openWorkerPopup = (rowIndex: number, field: 'front' | 'back' | 'zip') => {
    const row = productionData[rowIndex]
    const workerKey = `${field}Worker` as keyof typeof row
    const dateKey = `${field}Date` as keyof typeof row
    const rateKey = `${field}Rate` as keyof typeof row
    setPopupWorker(String(row[workerKey] ?? ''))
    setPopupDate(String(row[dateKey] ?? ''))
    setPopupRate(String(row[rateKey] ?? ''))
    setEditingWorkerCell({ rowIndex, field })
  }

  const saveWorkerPopup = () => {
    if (!editingWorkerCell) return
    const { rowIndex, field } = editingWorkerCell
    setProductionData(prev =>
      prev.map((row, i) =>
        i === rowIndex
          ? {
              ...row,
              [`${field}Worker`]: popupWorker,
              [`${field}Date`]: popupDate,
              [`${field}Rate`]: popupRate,
            }
          : row
      )
    )
    setEditingWorkerCell(null)
  }

  const sumOfRatios = useMemo(() => {
    return Object.values(ratios).reduce((sum, val) => sum + (Number(val) || 0), 0)
  }, [ratios])

  // Fetch workers on mount
  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    try {
      const result = await workersAPI.getAllWorkers()
      if (result.success) {
        setWorkers(result.workers || [])
      }
    } catch (error) {
      console.error('Error fetching workers:', error)
    }
  }

  useEffect(() => {
    if (lotNumber) {
      // Always try to load existing job card first
      setLoading(true)
      jobCardsAPI.getJobCardByLotNumber(lotNumber).then((result) => {
        if (result.success && result.jobCard) {
          // Job card exists, load it
          const jobCard = result.jobCard
          setDate(jobCard.date || '')
          setBrand(jobCard.brand || '')
          setRatios(jobCard.ratios || ratios)
          setProductionData(jobCard.productionData || productionData)
          setFlyWidth(jobCard.flyWidth || '')
          setAdditionalInfo(jobCard.additionalInfo || { belt: '', bottom: '', pasting: '', bone: '', hala: '', ticketPocket: '' })
          setLoading(false)
        } else {
          // No job card exists - show error, job cards can only be edited
          setError('Job card not found for this lot number. Job cards are automatically created when a lot is saved.')
          setLoading(false)
        }
      }).catch((error) => {
        setError('Error loading job card: ' + error.message)
        setLoading(false)
      })
    }
  }, [lotNumber])

  const loadLotData = async () => {
    if (!lotNumber) return
    
    setLoadingLot(true)
    try {
      const result = await lotsAPI.getLotByNumber(lotNumber)
      if (result.success && result.lot) {
        const lot = result.lot
        setDate(lot.date || new Date().toISOString().split('T')[0])
        setBrand(lot.brand || '')
        setRatios(lot.ratios || {
          r28: 0, r30: 0, r32: 0, r34: 0, r36: 0,
          r38: 0, r40: 0, r42: 0, r44: 0,
        })
        
        // Prefill production data from lot
        if (lot.productionData && lot.productionData.length > 0) {
          const prefilledData = lot.productionData.map((row: any, index: number) => ({
            serialNumber: index + 1,
            layer: String(row.layer || '1'),
            pieces: Number(row.pieces || 0),
            color: row.color || '',
            shade: row.shade || '',
            front: '',
            frontWorker: '',
            frontDate: '',
            frontRate: '',
            back: '',
            backWorker: '',
            backDate: '',
            backRate: '',
            zip: '',
            zipWorker: '',
            zipDate: '',
            zipRate: '',
            zip_code: '',
            thread_code: '',
          }))
          setProductionData(prefilledData)
        }
      } else {
        setError('Lot not found. Please enter a valid lot number.')
      }
    } catch (error: any) {
      console.error('Error loading lot:', error)
      setError('Error loading lot: ' + error.message)
    } finally {
      setLoadingLot(false)
    }
  }

  const loadJobCard = async () => {
    if (!lotNumber) return
    
    setLoading(true)
    try {
      const result = await jobCardsAPI.getJobCardByLotNumber(lotNumber)
      if (result.success && result.jobCard) {
        const jobCard = result.jobCard
        setDate(jobCard.date || '')
        setBrand(jobCard.brand || '')
        setRatios(jobCard.ratios || ratios)
        setProductionData(jobCard.productionData || productionData)
        setFlyWidth(jobCard.flyWidth || '')
        setAdditionalInfo(jobCard.additionalInfo || { belt: '', bottom: '', pasting: '', bone: '', hala: '', ticketPocket: '' })
      } else {
        setError('Job card not found')
      }
    } catch (error: any) {
      console.error('Error loading job card:', error)
      setError('Error loading job card: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const addRow = () => {
    const newSerialNumber = productionData.length > 0
      ? Math.max(...productionData.map(row => row.serialNumber)) + 1
      : 1
    
    setProductionData([
      ...productionData,
      {
        serialNumber: newSerialNumber,
        layer: '1',
        pieces: 0,
        color: '',
        shade: '',
        front: '',
        frontWorker: '',
        frontDate: '',
        frontRate: '',
        back: '',
        backWorker: '',
        backDate: '',
        backRate: '',
        zip: '',
        zipWorker: '',
        zipDate: '',
        zipRate: '',
        zip_code: '',
        thread_code: '',
      }
    ])
  }

  const deleteRow = (index: number) => {
    const newData = productionData.filter((_, i) => i !== index)
    const renumberedData = newData.map((row, idx) => ({
      ...row,
      serialNumber: idx + 1
    }))
    setProductionData(renumberedData)
  }

  const updateProductionData = (index: number, field: string, value: string) => {
    const newData = [...productionData]
    newData[index] = {
      ...newData[index],
      [field]: value
    }
    setProductionData(newData)
  }

  const handleSave = async () => {
    if (!lotNumber.trim()) {
      toast.showToast('Please enter a lot number', 'warning')
      return
    }

    setSaving(true)
    try {
      const jobCardData = {
        lotNumber,
        date,
        brand,
        ratios,
        productionData: productionData.map(row => ({
          ...row,
          layer: Number(row.layer) || 1,
          pieces: Number(row.pieces) || 0,
        })),
        flyWidth,
        additionalInfo,
      }

      const result = await jobCardsAPI.updateJobCard(lotNumber, jobCardData)

      if (result.success) {
        toast.showToast('Job card updated successfully!', 'success')
        router.push(`/jobcard/${encodeURIComponent(lotNumber)}?edit=true`)
      } else {
        toast.showToast('Error updating job card: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Error saving job card:', error)
      toast.showToast('Error saving job card: ' + error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const exportToPDF = async () => {
    if (!jobCardRef.current) return

    setGeneratingPDF(true)
    
    try {
      // Hide navigation bar temporarily
      const navBar = document.querySelector('.main-navbar') as HTMLElement
      const originalDisplay = navBar?.style.display
      if (navBar) {
        navBar.style.display = 'none'
      }

      // Clone the element for PDF generation
      const clone = jobCardRef.current.cloneNode(true) as HTMLElement
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

      pdf.save(`JobCard_${lotNumber || 'Production'}_${date || 'Report'}.pdf`)
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      toast.showToast('Error generating PDF: ' + error.message, 'error')
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (loading || loadingLot) {
    return (
      <>
        <NavigationBar />
        <div className="dashboard-container">
          <div className="loading-container">
            <p>Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <NavigationBar />
      <div className="dashboard-container" ref={jobCardRef}>
        <div className="dashboard-header">
        <div className="header-title">
          <h1>{isEditMode ? 'Edit Job Card' : 'View Job Card'}</h1>
          <p>{isEditMode ? 'Edit' : 'View'} job card details for lot {lotNumber}</p>
        </div>
        <div className="header-actions">
          {isEditMode && (
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !lotNumber}>
              <span className="btn-icon">💾</span>
              {saving ? 'Saving...' : 'Update Job Card'}
            </button>
          )}
          <button className="btn btn-primary" onClick={exportToPDF} disabled={generatingPDF}>
            <span className="btn-icon">📄</span>
            {generatingPDF ? 'Generating PDF...' : 'Save as PDF'}
          </button>
          {!isEditMode && (
            <button className="btn btn-primary" onClick={() => router.push(`/jobcard/${encodeURIComponent(lotNumber)}?edit=true`)}>
              <span className="btn-icon">✏️</span>
              Edit Job Card
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => router.push('/jobcards')}>
            <span className="btn-icon">←</span>
            Back to Job Cards
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '24px', background: '#fff5f5', border: '1px solid #ffe0e0' }}>
          <p style={{ color: '#c92a2a', margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="dashboard-content">
        <div className="card">
          <h2>Job Card Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Lot Number</label>
              <input
                type="text"
                value={lotNumber}
                disabled
                style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                value={brand}
                disabled
                style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                placeholder="Enter brand"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Ratios</h2>
          <div className="ratios-grid">
            {Object.keys(ratios).map((ratioKey) => (
              <div key={ratioKey} className="form-group">
                <label>{ratioKey.toUpperCase()}</label>
                <input
                  type="number"
                  value={ratios[ratioKey as keyof typeof ratios]}
                  disabled
                  style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  min="0"
                  step="0.5"
                />
              </div>
            ))}
          </div>
          <div className="ratios-summary">
            <strong>Sum of Ratios: {sumOfRatios.toFixed(2)}</strong>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Production Data</h2>
          </div>
          <div className="table-container">
            <table className="production-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', minWidth: '40px' }}>S.No</th>
                  <th>Layer</th>
                  <th>Pieces</th>
                  <th>Color</th>
                  <th>Shade</th>
                  <th style={{ width: '180px', minWidth: '180px' }}>Front</th>
                  <th style={{ width: '180px', minWidth: '180px' }}>Back</th>
                  <th style={{ width: '180px', minWidth: '180px' }}>Zip</th>
                  <th>Zip Code</th>
                  <th style={{ width: '80px', minWidth: '80px' }}>Thread Code</th>
                </tr>
              </thead>
              <tbody>
                {productionData.map((row, index) => (
                  <tr key={index}>
                    <td style={{ width: '40px', minWidth: '40px', textAlign: 'center' }}>{row.serialNumber}</td>
                    <td>
                      <input
                        type="text"
                        value={row.layer}
                        disabled
                        className="production-table input"
                        style={{ width: '60px', background: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.pieces}
                        disabled
                        className="production-table input"
                        style={{ width: '80px', background: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                    </td>
                    <td>
                      <span style={{ fontSize: '14px', color: '#1a1a1a' }}>{row.color || '—'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', minHeight: '36px' }}>
                        {row.color ? (
                          <div
                            title={row.color}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              backgroundColor: getColorForShade(row.color),
                              border: '1px solid #ccc',
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '14px', color: '#6c757d' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={{ width: '180px', minWidth: '180px' }}>
                      <button
                        type="button"
                        onClick={() => isEditMode && openWorkerPopup(index, 'front')}
                        disabled={!isEditMode}
                        className="tbd-input"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          textAlign: 'left',
                          background: !isEditMode ? '#f8f9fa' : '#fff',
                          cursor: !isEditMode ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {getWorkerName(row.frontWorker ?? '')}
                      </button>
                    </td>
                    <td style={{ width: '180px', minWidth: '180px' }}>
                      <button
                        type="button"
                        onClick={() => isEditMode && openWorkerPopup(index, 'back')}
                        disabled={!isEditMode}
                        className="tbd-input"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          textAlign: 'left',
                          background: !isEditMode ? '#f8f9fa' : '#fff',
                          cursor: !isEditMode ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {getWorkerName(row.backWorker ?? '')}
                      </button>
                    </td>
                    <td style={{ width: '180px', minWidth: '180px' }}>
                      <button
                        type="button"
                        onClick={() => isEditMode && openWorkerPopup(index, 'zip')}
                        disabled={!isEditMode}
                        className="tbd-input"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          textAlign: 'left',
                          background: !isEditMode ? '#f8f9fa' : '#fff',
                          cursor: !isEditMode ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {getWorkerName(row.zipWorker ?? '')}
                      </button>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.zip_code ?? (row as { zip?: string }).zip ?? ''}
                        readOnly
                        disabled
                        className="tbd-input"
                        style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                        placeholder="Zip Code"
                      />
                    </td>
                    <td style={{ width: '80px', minWidth: '80px' }}>
                      <input
                        type="text"
                        value={row.thread_code ?? (row as { thread?: string }).thread ?? ''}
                        readOnly
                        disabled
                        className="tbd-input"
                        style={{ background: '#f8f9fa', cursor: 'not-allowed', width: '100%' }}
                        placeholder="Thread Code"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>Additional Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Fly Width</label>
              <input
                type="text"
                value={flyWidth}
                onChange={(e) => setFlyWidth(e.target.value)}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Enter fly width"
              />
            </div>
            <div className="form-group">
              <label>Belt</label>
              <input
                type="text"
                value={additionalInfo.belt}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, belt: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Belt"
              />
            </div>
            <div className="form-group">
              <label>Bottom</label>
              <input
                type="text"
                value={additionalInfo.bottom}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, bottom: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Bottom"
              />
            </div>
            <div className="form-group">
              <label>Pasting</label>
              <input
                type="text"
                value={additionalInfo.pasting}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, pasting: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Pasting"
              />
            </div>
            <div className="form-group">
              <label>Bone</label>
              <input
                type="text"
                value={additionalInfo.bone}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, bone: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Bone"
              />
            </div>
            <div className="form-group">
              <label>Hala</label>
              <input
                type="text"
                value={additionalInfo.hala}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, hala: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Hala"
              />
            </div>
            <div className="form-group">
              <label>Ticket Pocket</label>
              <input
                type="text"
                value={additionalInfo.ticketPocket}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, ticketPocket: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Ticket Pocket"
              />
            </div>
          </div>
        </div>
      </div>
      </div>

      {editingWorkerCell && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setEditingWorkerCell(null)}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              minWidth: '320px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>
              {editingWorkerCell.field === 'front' ? 'Front' : editingWorkerCell.field === 'back' ? 'Back' : 'Zip'} — Worker / Date / Rate
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Worker</label>
                <select
                  value={popupWorker}
                  onChange={(e) => setPopupWorker(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select worker</option>
                  {workers.map((w: any) => (
                    <option key={w._id} value={w._id}>
                      {w.worker_id} - {w.worker_full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Date</label>
                <input
                  type="date"
                  value={popupDate}
                  onChange={(e) => setPopupDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Rate</label>
                <input
                  type="number"
                  value={popupRate}
                  onChange={(e) => setPopupRate(e.target.value)}
                  placeholder="Rate"
                  step="0.01"
                  min="0"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingWorkerCell(null)}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveWorkerPopup}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
