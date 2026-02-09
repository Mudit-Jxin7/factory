import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { lotsAPI } from './api/api'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './App.css'

function Dashboard() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [saving, setSaving] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const dashboardRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
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
      meter: '', // Empty string for text input
      layer: '1', // Natural number minimum (as string for text input)
      pieces: 0,
      color: '', // Color input
      shade: '', // Shade input
      tbd2: '', // TBD2 input
      tbd3: '', // TBD3 input
    }
  ])

  // Tukda State
  const [tukda, setTukda] = useState({
    count: 0,
    size: '28' // Default size
  })
  
  // Tukda size options
  const tukdaSizes = ['28', '30', '32', '34', '36', '38', '40', '42', '44']

  // Calculate sum of ratio colors
  const sumOfRatios = useMemo(() => {
    return Object.values(ratios).reduce((sum, val) => sum + (Number(val) || 0), 0)
  }, [ratios])

  // Update pieces when layer or ratios change
  const updateProductionData = (index, field, value) => {
    const newData = [...productionData]
    
    // For layer, enforce natural numbers only (positive integers >= 1)
    if (field === 'layer') {
      // Allow empty string for typing
      if (value === '') {
        newData[index] = {
          ...newData[index],
          [field]: '',
        }
      } else {
        // Check if it's a valid natural number format (positive integer >= 1)
        // Allow digits only, must start with 1-9 or be just "1"
        const isValidNatural = /^[1-9][0-9]*$/.test(value) || value === '1'
        if (isValidNatural) {
          const numValue = Number(value)
          if (numValue >= 1 && Number.isInteger(numValue)) {
            newData[index] = {
              ...newData[index],
              [field]: value, // Keep as string to allow typing
            }
          } else {
            // Invalid value, keep previous value
            return
          }
        } else {
          // Invalid value, keep previous value
          return
        }
      }
    } else if (field === 'meter') {
      // For meter, allow any positive decimal value
      // Store as string to allow free-form decimal input
      if (value === '' || value === '0') {
        newData[index] = {
          ...newData[index],
          [field]: '',
        }
      } else {
        // Check if it's a valid positive number format
        // Allow decimal numbers (including numbers starting with . like .5)
        const isValidDecimal = /^[0-9]*\.?[0-9]*$/.test(value)
        if (isValidDecimal) {
          newData[index] = {
            ...newData[index],
            [field]: value, // Keep as string to allow typing decimals
          }
        } else {
          // Invalid value, keep previous value
          return
        }
      }
    } else if (field === 'color' || field === 'shade' || field === 'tbd2' || field === 'tbd3') {
      // For text fields (color, shade, tbd2, tbd3), allow any text input
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
    
    // Recalculate pieces: layer * sum of ratio colors
    if (field === 'layer' || field === 'meter') {
      const layerValue = Number(newData[index].layer) || 0
      newData[index].pieces = layerValue * sumOfRatios
    }
    
    setProductionData(newData)
  }

  // Add new row
  const addRow = () => {
    const newSerialNumber = productionData.length > 0 
      ? Math.max(...productionData.map(row => row.serialNumber)) + 1 
      : 1
    
    setProductionData([
      ...productionData,
      {
        serialNumber: newSerialNumber,
        meter: '', // Empty string for text input
        layer: '1', // Default to 1 (natural number minimum, as string)
        pieces: 1 * sumOfRatios, // layer defaults to 1
        color: '', // Color input
        shade: '', // Shade input
        tbd2: '', // TBD2 input
        tbd3: '', // TBD3 input
      }
    ])
  }

  // Delete row
  const deleteRow = (index) => {
    setProductionData(productionData.filter((_, i) => i !== index))
  }

  // Calculate totals
  const totalMeter = useMemo(() => {
    return productionData.reduce((sum, row) => sum + (Number(row.meter) || 0), 0)
  }, [productionData])

  const totalPieces = useMemo(() => {
    return productionData.reduce((sum, row) => sum + (Number(row.pieces) || 0), 0)
  }, [productionData])

  // Calculate average
  const average = useMemo(() => {
    const denominator = totalPieces + (Number(tukda.count) || 0)
    if (denominator === 0) return 0
    return totalMeter / denominator
  }, [totalMeter, totalPieces, tukda.count])

  // Update ratios
  const updateRatio = (ratioKey, value) => {
    let numValue = Number(value) || 0
    
    // Enforce minimum of 0.5 and round to nearest 0.5
    if (numValue > 0 && numValue < 0.5) {
      numValue = 0.5
    } else if (numValue > 0) {
      // Round to nearest 0.5
      numValue = Math.round(numValue * 2) / 2
    }
    
    const newRatios = {
      ...ratios,
      [ratioKey]: numValue,
    }
    
    setRatios(newRatios)
    
    // Calculate new sum of ratios
    const newSumOfRatios = Object.values(newRatios).reduce((sum, val) => sum + (Number(val) || 0), 0)
    
    // Recalculate pieces for all rows when ratios change
    setProductionData(prevData => 
      prevData.map(row => ({
        ...row,
        pieces: (Number(row.layer) || 0) * newSumOfRatios
      }))
    )
  }

  // Save lot to MongoDB
  const saveLot = async () => {
    if (!lotNumber.trim()) {
      alert('Please enter a lot number')
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
          tbd2: row.tbd2 || '',
          tbd3: row.tbd3 || '',
        })),
        tukda,
        totalMeter,
        totalPieces,
        average,
      }

      const result = await lotsAPI.saveLot(lotData)

      if (result.success) {
        alert('Lot saved successfully!')
        // Navigate to view the saved lot
        navigate(`/lot/${lotNumber}`)
      } else {
        alert('Error saving lot: ' + result.error)
      }
    } catch (error) {
      console.error('Error saving lot:', error)
      alert('Error saving lot: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // Export to PDF - captures the exact page as rendered
  const exportToPDF = async () => {
    if (!dashboardRef.current) return

    setGeneratingPDF(true)
    
    try {
      // Hide action buttons temporarily
      const headerActions = dashboardRef.current.querySelector('.header-actions')
      const originalDisplay = headerActions?.style.display
      if (headerActions) {
        headerActions.style.display = 'none'
      }

      // Capture the dashboard as canvas
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#f5f5f5',
        windowWidth: dashboardRef.current.scrollWidth,
        windowHeight: dashboardRef.current.scrollHeight,
      })

      // Restore buttons
      if (headerActions) {
        headerActions.style.display = originalDisplay || ''
      }

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Calculate PDF dimensions
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      // Calculate aspect ratio and fit to page width
      const ratio = imgWidth / imgHeight
      const pageWidth = pdfWidth - 20 // 10mm margin on each side
      const pageHeight = pdfHeight - 20
      
      let finalWidth = pageWidth
      let finalHeight = finalWidth / ratio

      const marginX = (pdfWidth - finalWidth) / 2
      let positionY = 10

      // If content fits on one page
      if (finalHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', marginX, positionY, finalWidth, finalHeight)
      } else {
        // Content is taller than one page - split across multiple pages
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

          // Create a canvas for this page section
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = imgWidth
          pageCanvas.height = sourceHeight
          const ctx = pageCanvas.getContext('2d')
          ctx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight)

          const pageImgData = pageCanvas.toDataURL('image/png')
          pdf.addImage(pageImgData, 'PNG', marginX, positionY, finalWidth, currentPageHeight)

          sourceY += sourceHeight
        }
      }

      // Save PDF
      pdf.save(`Lot_${lotNumber || 'Production'}_${date || 'Report'}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF: ' + error.message)
    } finally {
      setGeneratingPDF(false)
    }
  }

  return (
    <div className="dashboard-container" ref={dashboardRef}>
      <div className="dashboard-header">
        <div className="header-title">
          <h1>Lot Production Dashboard</h1>
          <p>Track and manage production data</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={saveLot} disabled={saving}>
            <span className="btn-icon">💾</span>
            {saving ? 'Saving...' : 'Save Lot'}
          </button>
          <button className="btn btn-primary" onClick={exportToPDF} disabled={generatingPDF}>
            <span className="btn-icon">📄</span>
            {generatingPDF ? 'Generating PDF...' : 'Save as PDF'}
          </button>
          <button className="btn btn-logout" onClick={handleLogout}>
            <span className="btn-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Lot Information Section */}
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
              <input
                type="text"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="Enter fabric"
              />
            </div>
            <div className="form-group">
              <label>Pattern</label>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter pattern"
              />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Enter brand"
              />
            </div>
          </div>
        </div>

        {/* Ratios Section */}
        <div className="card">
          <h2>Ratios</h2>
          <div className="ratios-grid">
            {Object.keys(ratios).map((ratioKey) => (
              <div key={ratioKey} className="form-group">
                <label>{ratioKey.toUpperCase()}</label>
                <input
                  type="number"
                  value={ratios[ratioKey]}
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

        {/* Production Data Section */}
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
                  <th>TBD2</th>
                  <th>TBD3</th>
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
                            // Normalize the value
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
                            // Ensure it's a natural number (positive integer >= 1)
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
                      <input
                        type="text"
                        value={row.color || ''}
                        onChange={(e) => updateProductionData(index, 'color', e.target.value)}
                        placeholder="Enter color"
                        className="color-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.shade || ''}
                        onChange={(e) => updateProductionData(index, 'shade', e.target.value)}
                        placeholder="Enter shade"
                        className="tbd-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.tbd2 || ''}
                        onChange={(e) => updateProductionData(index, 'tbd2', e.target.value)}
                        placeholder="TBD2"
                        className="tbd-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.tbd3 || ''}
                        onChange={(e) => updateProductionData(index, 'tbd3', e.target.value)}
                        placeholder="TBD3"
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

        {/* Summary & Calculations Section */}
        <div className="card">
          <h2>Summary & Calculations</h2>
          <div className="summary-grid">
            <div className="form-group">
              <label># Tukda</label>
              <input
                type="text"
                value={tukda.count}
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow positive integers
                  if (value === '' || /^[0-9]+$/.test(value)) {
                    setTukda({ ...tukda, count: value === '' ? '' : value })
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value
                  const numValue = Number(value)
                  if (value === '' || isNaN(numValue) || numValue < 0) {
                    setTukda({ ...tukda, count: '0' })
                  } else {
                    setTukda({ ...tukda, count: Math.floor(numValue).toString() })
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
  )
}

export default Dashboard
