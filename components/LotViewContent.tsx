'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { lotsAPI } from '@/lib/api'
import './dashboard.css'

interface LotViewContentProps {
  lotNumber: string
}

export default function LotViewContent({ lotNumber }: LotViewContentProps) {
  const router = useRouter()
  const [lot, setLot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchLot()
  }, [lotNumber])

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

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    router.push('/login')
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
        alert('Lot deleted successfully!')
        router.push('/lots')
      } else {
        alert('Error deleting lot: ' + result.error)
      }
    } catch (error: any) {
      console.error('Error deleting lot:', error)
      alert('Error deleting lot: ' + error.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <p>Loading lot data...</p>
        </div>
      </div>
    )
  }

  if (error || !lot) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'Lot not found'}</p>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-title">
          <h1>Lot Details: {lot.lotNumber}</h1>
          <p>View saved lot production data</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => router.push(`/dashboard?edit=${encodeURIComponent(lot.lotNumber)}`)}>
            <span className="btn-icon">✏️</span>
            Edit Lot
          </button>
          <button 
            className="btn btn-logout" 
            onClick={handleDeleteLot}
            disabled={deleting}
          >
            <span className="btn-icon">🗑️</span>
            {deleting ? 'Deleting...' : 'Delete Lot'}
          </button>
          <button className="btn btn-secondary" onClick={() => router.push('/dashboard')}>
            ← Back to Dashboard
          </button>
          <button className="btn btn-logout" onClick={handleLogout}>
            <span className="btn-icon">🚪</span>
            Logout
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
  )
}
