'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { lotsAPI, jobCardsAPI, colorsAPI, brandsAPI, patternsAPI, fabricsAPI } from '@/lib/api'
import { getColorForShade } from '@/lib/colorUtils'
import { prepareCloneForPDF, replaceInputsForPDF, scaleCloneFontsForPDF } from '@/lib/pdfUtils'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import './dashboard.css'

export default function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [loadingLot, setLoadingLot] = useState(false)
  const dashboardRef = useRef<HTMLDivElement>(null)
  const [colors, setColors] = useState<any[]>([])
  const [fabrics, setFabrics] = useState<any[]>([])
  const [patterns, setPatterns] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    router.push('/login')
  }
  
  // Lot Information State
  const [lotNumber, setLotNumber] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [fabric, setFabric] = useState('')
  const [pattern, setPattern] = useState('')
  const [brand, setBrand] = useState('')

  // Ratio State (r28, r30, r32, r34, r36, r38, r40, r42, r44)
  const [ratios, setRatios] = useState({
    r28: 0,
    r30: 0,
    r32: 0,
    r34: 0,
    r36: 0,
    r38: 0,
    r40: 0,
    r42: 0,
    r44: 0,
  })

  // Production Data Table State
  const [productionData, setProductionData] = useState([
    {
      serialNumber: 1,
      meter: '',
      layer: '1',
      pieces: 0,
      color: '',
      shade: '',
      zip_code: '',
      thread_code: '',
    }
  ])

  // Tukda State
  const [tukda, setTukda] = useState({
    count: 0,
    size: '28'
  })
  
  const tukdaSizes = ['28', '30', '32', '34', '36', '38', '40', '42', '44']

  // Load colors on mount
  useEffect(() => {
    fetchColors()
    fetchMasterDropdowns()
  }, [])

  // Load lot data for editing
  useEffect(() => {
    const editLotNumber = searchParams?.get('edit')
    if (editLotNumber) {
      loadLotForEdit(editLotNumber)
    }
  }, [searchParams])

  const fetchColors = async () => {
    try {
      const result = await colorsAPI.getAllColors()
      if (result.success) {
        setColors(result.colors || [])
      }
    } catch (error) {
      console.error('Error fetching colors:', error)
    }
  }

  const fetchMasterDropdowns = async () => {
    try {
      const [fabricsResult, patternsResult, brandsResult] = await Promise.all([
        fabricsAPI.getAllFabrics(),
        patternsAPI.getAllPatterns(),
        brandsAPI.getAllBrands(),
      ])

      if (fabricsResult.success) {
        setFabrics(fabricsResult.fabrics || [])
      }
      if (patternsResult.success) {
        setPatterns(patternsResult.patterns || [])
      }
      if (brandsResult.success) {
        setBrands(brandsResult.brands || [])
      }
    } catch (error) {
      console.error('Error fetching dropdown masters:', error)
    }
  }

  const loadLotForEdit = async (lotNumberParam: string) => {
    setLoadingLot(true)
    try {
      const decodedLotNumber = decodeURIComponent(lotNumberParam)
      const result = await lotsAPI.getLotByNumber(decodedLotNumber)
      
      if (result.success && result.lot) {
        const lot = result.lot
        setLotNumber(lot.lotNumber || '')
        setDate(lot.date || new Date().toISOString().split('T')[0])
        setFabric(lot.fabric || '')
        setPattern(lot.pattern || '')
        setBrand(lot.brand || '')
        setRatios(lot.ratios || {
          r28: 0, r30: 0, r32: 0, r34: 0, r36: 0,
          r38: 0, r40: 0, r42: 0, r44: 0,
        })
        setProductionData(lot.productionData && lot.productionData.length > 0 
          ? lot.productionData.map((row: any) => ({
              ...row,
              meter: String(row.meter || ''),
              layer: String(row.layer || '1'),
            }))
          : [{
              serialNumber: 1,
              meter: '',
              layer: '1',
              pieces: 0,
              color: '',
              shade: '',
              zip_code: '',
              thread_code: '',
            }]
        )
        setTukda(lot.tukda || { count: 0, size: '28' })
      } else {
        toast.showToast('Error loading lot: ' + (result.error || 'Lot not found'), 'error')
      }
    } catch (error: any) {
      console.error('Error loading lot for edit:', error)
      toast.showToast('Error loading lot: ' + error.message, 'error')
    } finally {
      setLoadingLot(false)
    }
  }

  const sumOfRatios = useMemo(() => {
    return Object.values(ratios).reduce((sum, val) => sum + (Number(val) || 0), 0)
  }, [ratios])

  const updateProductionData = (index: number, field: string, value: string) => {
    const newData = [...productionData]
    
    if (field === 'layer') {
      if (value === '') {
        newData[index] = {
          ...newData[index],
          [field]: '',
        }
      } else {
        const isValidNatural = /^[1-9][0-9]*$/.test(value) || value === '1'
        if (isValidNatural) {
          const numValue = Number(value)
          if (numValue >= 1 && Number.isInteger(numValue)) {
            newData[index] = {
              ...newData[index],
              [field]: value,
            }
          } else {
            return
          }
        } else {
          return
        }
      }
    } else if (field === 'meter') {
      if (value === '' || value === '0') {
        newData[index] = {
          ...newData[index],
          [field]: '',
        }
      } else {
        const isValidDecimal = /^[0-9]*\.?[0-9]*$/.test(value)
        if (isValidDecimal) {
          newData[index] = {
            ...newData[index],
            [field]: value,
          }
        } else {
          return
        }
      }
    } else if (field === 'color') {
      newData[index] = {
        ...newData[index],
        color: value,
        shade: value,
      }
    } else if (field === 'zip_code' || field === 'thread_code') {
      newData[index] = {
        ...newData[index],
        [field]: value,
      }
    } else {
      newData[index] = {
        ...newData[index],
        [field]: Number(value) || 0,
      }
    }
    
    if (field === 'layer' || field === 'meter') {
      const layerValue = Number(newData[index].layer) || 0
      newData[index].pieces = layerValue * sumOfRatios
    }
    
    setProductionData(newData)
  }

  const addRow = () => {
    const newSerialNumber = productionData.length > 0 
      ? Math.max(...productionData.map(row => row.serialNumber)) + 1 
      : 1
    
    setProductionData([
      ...productionData,
      {
        serialNumber: newSerialNumber,
        meter: '',
        layer: '1',
        pieces: 1 * sumOfRatios,
        color: '',
        shade: '',
        zip_code: '',
        thread_code: '',
      }
    ])
  }

  const deleteRow = (index: number) => {
    const newData = productionData.filter((_, i) => i !== index)
    // Renumber serial numbers sequentially starting from 1
    const renumberedData = newData.map((row, idx) => ({
      ...row,
      serialNumber: idx + 1
    }))
    setProductionData(renumberedData)
  }

  const totalMeter = useMemo(() => {
    return productionData.reduce((sum, row) => sum + (Number(row.meter) || 0), 0)
  }, [productionData])

  const totalPieces = useMemo(() => {
    return productionData.reduce((sum, row) => sum + (Number(row.pieces) || 0), 0)
  }, [productionData])

  const totalPiecesWithTukda = useMemo(() => {
    return totalPieces + (Number(tukda.count) || 0)
  }, [totalPieces, tukda.count])

  const average = useMemo(() => {
    const denominator = totalPieces + (Number(tukda.count) || 0)
    if (denominator === 0) return 0
    return totalMeter / denominator
  }, [totalMeter, totalPieces, tukda.count])

  const updateRatio = (ratioKey: string, value: string) => {
    let numValue = Number(value) || 0
    
    if (numValue > 0 && numValue < 0.5) {
      numValue = 0.5
    } else if (numValue > 0) {
      numValue = Math.round(numValue * 2) / 2
    }
    
    const newRatios = {
      ...ratios,
      [ratioKey]: numValue,
    }
    
    setRatios(newRatios)
    
    const newSumOfRatios = Object.values(newRatios).reduce((sum, val) => sum + (Number(val) || 0), 0)
    
    setProductionData(prevData => 
      prevData.map(row => ({
        ...row,
        pieces: (Number(row.layer) || 0) * newSumOfRatios
      }))
    )
  }

  const saveLot = async () => {
    if (!lotNumber.trim()) {
      toast.showToast('Please enter a lot number', 'warning')
      return
    }

    setSaving(true)
    try {
      const lotData = {
        lotNumber,
        date,
        fabric,
        pattern,
        brand,
        ratios,
        productionData: productionData.map(row => ({
          ...row,
          meter: Number(row.meter) || 0,
          layer: Number(row.layer) || 1,
          color: row.color || '',
          shade: row.shade || '',
          zip_code: row.zip_code || '',
          thread_code: row.thread_code || '',
        })),
        tukda,
        totalMeter,
        totalPieces,
        totalPiecesWithTukda,
        average,
      }

      // Check if we're editing an existing lot
      const editLotNumber = searchParams?.get('edit')
      let result
      
      if (editLotNumber && decodeURIComponent(editLotNumber) === lotNumber) {
        // Update existing lot
        result = await lotsAPI.updateLot(lotNumber, lotData)
        // Sync job card with lot data so they stay in sync
        if (result.success) {
          try {
            const jobCardResult = await jobCardsAPI.getJobCardByLotNumber(lotNumber)
            if (jobCardResult.success && jobCardResult.jobCard) {
              const existing = jobCardResult.jobCard
              const mergedProductionData = productionData.map((lotRow, i) => {
                const existingRow = existing.productionData && existing.productionData[i] ? existing.productionData[i] : {}
                return {
                  ...existingRow,
                  serialNumber: lotRow.serialNumber,
                  layer: Number(lotRow.layer) || 1,
                  pieces: Number(lotRow.pieces) || 0,
                  color: lotRow.color || '',
                  shade: lotRow.shade || '',
                  zip_code: lotRow.zip_code || '',
                  thread_code: lotRow.thread_code || '',
                }
              })
              await jobCardsAPI.updateJobCard(lotNumber, {
                lotNumber,
                date,
                brand: brand,
                ratios,
                productionData: mergedProductionData,
                flyWidth: existing.flyWidth ?? '',
                additionalInfo: existing.additionalInfo ?? { belt: '', bottom: '', pasting: '', bone: '', hala: '', ticketPocket: '' },
              })
            }
          } catch (err) {
            console.error('Error syncing job card with lot:', err)
            // Don't fail the lot update if job card sync fails
          }
        }
      } else {
        // Create new lot
        result = await lotsAPI.saveLot(lotData)
        
        // Auto-create job card when new lot is saved
        if (result.success) {
          try {
            const jobCardData = {
              lotNumber,
              date,
              brand,
              worker: '',
              rate: '',
              ratios,
              productionData: productionData.map(row => ({
                serialNumber: row.serialNumber,
                layer: Number(row.layer) || 1,
                pieces: Number(row.pieces) || 0,
                color: row.color || '',
                shade: row.shade || '',
                front: '',
                back: '',
                zip_code: row.zip_code || '',
                thread_code: row.thread_code || '',
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
            // Don't fail the lot save if job card creation fails
          }
        }
      }

      if (result.success) {
        const isNewLot = !editLotNumber || decodeURIComponent(editLotNumber) !== lotNumber
        const successMessage = isNewLot ? 'Lot saved successfully!' : 'Lot updated successfully!'
        
        // Show success toast
        toast.showToast(successMessage, 'success')
        
        // Navigate based on whether it's a new lot or update
        if (isNewLot) {
          // For new lots, navigate to job card edit page
          router.push(`/jobcard/${encodeURIComponent(lotNumber)}?edit=true`)
        } else {
          // For updates, navigate to lot view
          router.push(`/lot/${lotNumber}`)
        }
      } else {
        toast.showToast('Error saving lot: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Error saving lot:', error)
      toast.showToast('Error saving lot: ' + error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const exportToPDF = async () => {
    if (!dashboardRef.current) return

    setGeneratingPDF(true)
    
    try {
      const headerActions = dashboardRef.current.querySelector('.header-actions') as HTMLElement
      const originalDisplay = headerActions?.style.display
      if (headerActions) {
        headerActions.style.display = 'none'
      }

      // Clone the element for PDF generation
      const clone = dashboardRef.current.cloneNode(true) as HTMLElement
      clone.style.position = 'absolute'
      clone.style.left = '-9999px'
      clone.style.top = '0'
      document.body.appendChild(clone)
      prepareCloneForPDF(clone, dashboardRef.current)
      replaceInputsForPDF(clone)

      await new Promise(resolve => setTimeout(resolve, 50))

      // Increase font sizes for PDF readability (clone only, not the live UI)
      scaleCloneFontsForPDF(clone)

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

      if (headerActions) {
        headerActions.style.display = originalDisplay || ''
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

      pdf.save(`Lot_${lotNumber || 'Production'}_${date || 'Report'}.pdf`)
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      toast.showToast('Error generating PDF: ' + error.message, 'error')
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (loadingLot) {
    return (
      <>
        <NavigationBar />
        <div className="dashboard-container">
          <div className="loading-container">
            <p>Loading lot data for editing...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <NavigationBar />
      <div className="dashboard-container" ref={dashboardRef}>
        <div className="dashboard-header">
          <div className="header-title">
            <h1>{searchParams?.get('edit') ? 'Edit Lot' : 'Lot Production Dashboard'}</h1>
            <p>{searchParams?.get('edit') ? 'Edit existing lot production data' : 'Track and manage production data'}</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={saveLot} disabled={saving || loadingLot}>
              <span className="btn-icon">💾</span>
              {loadingLot ? 'Loading...' : saving ? 'Saving...' : searchParams?.get('edit') ? 'Update Lot' : 'Save Lot'}
            </button>
            <button className="btn btn-primary" onClick={exportToPDF} disabled={generatingPDF}>
              <span className="btn-icon">📄</span>
              {generatingPDF ? 'Generating PDF...' : 'Save as PDF'}
            </button>
          </div>
        </div>

      <div className="dashboard-content">
        <div className="card">
          <h2>Lot Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Lot Number</label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="Enter lot number"
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Fabric</label>
              <select
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
              >
                <option value="">Select fabric</option>
                {fabrics.map((item: any) => (
                  <option key={item._id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Pattern</label>
              <select
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
              >
                <option value="">Select pattern</option>
                {patterns.map((item: any) => (
                  <option key={item._id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Brand</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              >
                <option value="">Select brand</option>
                {brands.map((item: any) => (
                  <option key={item._id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
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
                  onChange={(e) => updateRatio(ratioKey, e.target.value)}
                  min="0.5"
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
            <button className="btn btn-secondary" onClick={addRow}>
              <span className="btn-icon">+</span>
              Add Row
            </button>
          </div>
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
                  <th>Zip Code</th>
                  <th>Thread Code</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {productionData.map((row, index) => (
                  <tr key={index}>
                    <td>{row.serialNumber}</td>
                    <td>
                      <input
                        type="text"
                        value={row.meter}
                        onChange={(e) => updateProductionData(index, 'meter', e.target.value)}
                        onBlur={(e) => {
                          const value = e.target.value
                          const numValue = Number(value)
                          if (value === '' || isNaN(numValue) || numValue < 0) {
                            updateProductionData(index, 'meter', '')
                          } else {
                            updateProductionData(index, 'meter', numValue.toString())
                          }
                        }}
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.layer}
                        onChange={(e) => updateProductionData(index, 'layer', e.target.value)}
                        onBlur={(e) => {
                          const value = e.target.value
                          const numValue = Number(value)
                          if (value === '' || isNaN(numValue) || numValue < 1) {
                            updateProductionData(index, 'layer', '1')
                          } else {
                            const naturalNum = Math.max(1, Math.floor(numValue))
                            updateProductionData(index, 'layer', naturalNum.toString())
                          }
                        }}
                        inputMode="numeric"
                        pattern="[1-9][0-9]*"
                        placeholder="1"
                      />
                    </td>
                    <td className="pieces-cell">{row.pieces.toFixed(2)}</td>
                    <td>
                      <select
                        value={row.color || ''}
                        onChange={(e) => updateProductionData(index, 'color', e.target.value)}
                        className="color-input"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      >
                        <option value="">Select color</option>
                        {colors.map((color: any) => (
                          <option key={color._id} value={color.name}>
                            {color.name}
                          </option>
                        ))}
                      </select>
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
                          <span style={{ fontSize: '16px', color: '#6c757d' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.zip_code || ''}
                        onChange={(e) => updateProductionData(index, 'zip_code', e.target.value)}
                        placeholder="Zip Code"
                        className="tbd-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.thread_code || ''}
                        onChange={(e) => updateProductionData(index, 'thread_code', e.target.value)}
                        placeholder="Thread Code"
                        className="tbd-input"
                      />
                    </td>
                    <td>
                      <button
                        className="btn-delete"
                        onClick={() => deleteRow(index)}
                        disabled={productionData.length === 1}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>Summary & Calculations</h2>
          <div className="tukda-inputs">
            <div className="form-group">
              <label># Tukda</label>
              <input
                type="text"
                value={tukda.count}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || /^[0-9]+$/.test(value)) {
                    setTukda({ ...tukda, count: value === '' ? 0 : Number(value) })
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value
                  const numValue = Number(value)
                  if (value === '' || isNaN(numValue) || numValue < 0) {
                    setTukda({ ...tukda, count: 0 })
                  } else {
                    setTukda({ ...tukda, count: Math.floor(numValue) })
                  }
                }}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Tukda Size</label>
              <select
                value={tukda.size}
                onChange={(e) => setTukda({ ...tukda, size: e.target.value })}
                className="tukda-size-select"
              >
                {tukdaSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="summary-cards-row">
            <div className="summary-card">
              <div className="summary-icon">📏</div>
              <div className="summary-content">
                <div className="summary-label">Total Meter</div>
                <div className="summary-value">{totalMeter.toFixed(2)}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📄</div>
              <div className="summary-content">
                <div className="summary-label">Total Pieces</div>
                <div className="summary-value">{totalPieces.toFixed(2)}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <div className="summary-label">Grand Total Pieces</div>
                <div className="summary-value">{totalPiecesWithTukda.toFixed(2)}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🧮</div>
              <div className="summary-content">
                <div className="summary-label">Average</div>
                <div className="summary-value average-value">{average.toFixed(4)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
