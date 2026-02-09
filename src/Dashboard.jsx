import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { lotsAPI } from './api/api'
import jsPDF from 'jspdf'
import './App.css'

function Dashboard() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [saving, setSaving] = useState(false)

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

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPos = 15
    const margin = 14
    const cardPadding = 5
    
    // Helper function to draw colored card
    const drawCard = (x, y, width, height, title, color = [255, 255, 255]) => {
      // Card background
      doc.setFillColor(color[0], color[1], color[2])
      doc.roundedRect(x, y, width, height, 3, 3, 'F')
      
      // Card border
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      doc.roundedRect(x, y, width, height, 3, 3)
      
      // Title background
      if (title) {
        doc.setFillColor(59, 130, 246) // Blue header
        doc.roundedRect(x, y, width, 8, 3, 3, 'F')
        // Draw white rectangle to cover bottom rounded corners
        doc.setFillColor(color[0], color[1], color[2])
        doc.rect(x, y + 5, width, 3, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont(undefined, 'bold')
        doc.text(title, x + cardPadding, y + 5.5)
        doc.setTextColor(0, 0, 0)
        doc.setFont(undefined, 'normal')
        y += 10
      }
      
      return y
    }
    
    // Helper function to add new page if needed
    const checkNewPage = (requiredHeight) => {
      if (yPos + requiredHeight > pageHeight - 20) {
        doc.addPage()
        yPos = 15
        return true
      }
      return false
    }
    
    // Header with gradient-like effect
    doc.setFillColor(59, 130, 246) // Blue
    doc.rect(0, 0, pageWidth, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont(undefined, 'bold')
    doc.text('Lot Production Dashboard', pageWidth / 2, 15, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text('Production Data Report', pageWidth / 2, 22, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    yPos = 30
    
    // Lot Information Card
    checkNewPage(50)
    const lotCardY = yPos
    yPos = drawCard(margin, yPos, pageWidth - 2 * margin, 50, 'Lot Information', [255, 255, 255])
    
    doc.setFontSize(10)
    const lotInfo = [
      { label: 'Lot Number', value: lotNumber || 'N/A' },
      { label: 'Date', value: date || 'N/A' },
      { label: 'Fabric', value: fabric || 'N/A' },
      { label: 'Pattern', value: pattern || 'N/A' },
      { label: 'Brand', value: brand || 'N/A' }
    ]
    
    let xOffset = margin + cardPadding
    const colWidth = (pageWidth - 2 * margin - 2 * cardPadding) / 2
    lotInfo.forEach((item, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = xOffset + col * colWidth
      const y = yPos + row * 8
      
      doc.setTextColor(100, 100, 100)
      doc.setFontSize(9)
      doc.text(item.label + ':', x, y)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      doc.text(item.value, x + 35, y)
    })
    yPos = lotCardY + 50 + 10
    
    // Ratios Card
    checkNewPage(60)
    const ratiosCardY = yPos
    yPos = drawCard(margin, yPos, pageWidth - 2 * margin, 60, 'Ratios', [255, 255, 255])
    
    doc.setFontSize(9)
    const ratioEntries = Object.entries(ratios)
    const ratiosPerRow = 3
    const ratioBoxWidth = (pageWidth - 2 * margin - 2 * cardPadding) / ratiosPerRow
    
    ratioEntries.forEach(([key, value], index) => {
      const col = index % ratiosPerRow
      const row = Math.floor(index / ratiosPerRow)
      const x = margin + cardPadding + col * ratioBoxWidth
      const y = yPos + row * 7
      
      // Ratio box with light blue background
      doc.setFillColor(240, 248, 255)
      doc.roundedRect(x, y - 4, ratioBoxWidth - 5, 6, 2, 2, 'F')
      
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'bold')
      doc.text(key.toUpperCase(), x + 2, y)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(59, 130, 246)
      doc.text(value.toString(), x + ratioBoxWidth - 15, y)
    })
    
    // Sum of ratios
    const sumOfRatiosValue = Object.values(ratios).reduce((sum, val) => sum + (Number(val) || 0), 0)
    yPos = ratiosCardY + 60 - 8
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(margin + cardPadding, yPos, pageWidth - 2 * margin - 2 * cardPadding, 6, 2, 2, 'F')
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, 'bold')
    doc.text(`Sum of Ratios: ${sumOfRatiosValue.toFixed(2)}`, pageWidth / 2, yPos + 4, { align: 'center' })
    doc.setFont(undefined, 'normal')
    yPos = ratiosCardY + 60 + 10
    
    // Production Data Table Card
    checkNewPage(40 + productionData.length * 6)
    const tableCardY = yPos
    const tableHeight = 15 + productionData.length * 6
    yPos = drawCard(margin, yPos, pageWidth - 2 * margin, tableHeight, 'Production Data', [255, 255, 255])
    
    // Table header with blue background
    doc.setFillColor(59, 130, 246)
    doc.rect(margin + cardPadding, yPos - 2, pageWidth - 2 * margin - 2 * cardPadding, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont(undefined, 'bold')
    
    const colWidths = [20, 40, 30, 40]
    const headers = ['S.No', 'Meter', 'Layer', 'Pieces']
    let x = margin + cardPadding + 5
    headers.forEach((header, i) => {
      doc.text(header, x, yPos + 4)
      x += colWidths[i]
    })
    
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, 'normal')
    yPos += 6
    
    // Table rows with alternating colors
    productionData.forEach((row, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251)
        doc.rect(margin + cardPadding, yPos - 3, pageWidth - 2 * margin - 2 * cardPadding, 5, 'F')
      }
      
      x = margin + cardPadding + 5
      const rowData = [
        row.serialNumber.toString(),
        (Number(row.meter) || 0).toString(),
        (Number(row.layer) || 1).toString(),
        Number(row.pieces || 0).toFixed(2)
      ]
      
      rowData.forEach((data, i) => {
        doc.text(data, x, yPos + 2)
        x += colWidths[i]
      })
      yPos += 5
    })
    yPos = tableCardY + tableHeight + 10
    
    // Summary & Calculations Card
    checkNewPage(50)
    const summaryCardY = yPos
    yPos = drawCard(margin, yPos, pageWidth - 2 * margin, 50, 'Summary & Calculations', [255, 255, 255])
    
    // Summary items in grid
    const summaryItems = [
      { label: '# Tukda', value: `${tukda.count} (Size: ${tukda.size})`, color: [255, 255, 255] },
      { label: 'Total Meter', value: totalMeter.toFixed(2), color: [240, 248, 255], icon: '📏' },
      { label: 'Total Pieces', value: totalPieces.toFixed(2), color: [240, 248, 255], icon: '📄' },
      { label: 'Average', value: average.toFixed(4), color: [220, 252, 231], icon: '🧮' }
    ]
    
    const summaryColWidth = (pageWidth - 2 * margin - 2 * cardPadding - 10) / 2
    summaryItems.forEach((item, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = margin + cardPadding + col * (summaryColWidth + 10)
      const y = yPos + row * 20
      
      // Summary card background
      doc.setFillColor(item.color[0], item.color[1], item.color[2])
      doc.roundedRect(x, y, summaryColWidth, 18, 3, 3, 'F')
      doc.setDrawColor(200, 200, 200)
      doc.roundedRect(x, y, summaryColWidth, 18, 3, 3)
      
      // Icon and text
      if (item.icon) {
        doc.setFontSize(14)
        doc.text(item.icon, x + 5, y + 8)
      }
      
      doc.setTextColor(100, 100, 100)
      doc.setFontSize(8)
      doc.text(item.label.toUpperCase(), x + (item.icon ? 12 : 5), y + 5)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      const textColor = item.label === 'Average' ? [16, 185, 129] : [0, 0, 0] // Green for average
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text(item.value, x + (item.icon ? 12 : 5), y + 12)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
    })
    
    // Footer
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
    
    // Save PDF
    doc.save(`Lot_${lotNumber || 'Production'}_${date || 'Report'}.pdf`)
  }

  return (
    <div className="dashboard-container">
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
          <button className="btn btn-primary" onClick={exportToPDF}>
            <span className="btn-icon">📄</span>
            Save as PDF
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
