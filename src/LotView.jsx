import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { lotsAPI } from './api/api'
import './App.css'

function LotView() {
  const { lotNumber } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [lot, setLot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    fetchLot()
  }, [lotNumber])

  const fetchLot = async () => {
    try {
      setLoading(true)
      const result = await lotsAPI.getLotByNumber(lotNumber)

      if (result.success) {
        setLot(result.lot)
      } else {
        setError(result.error || 'Lot not found')
      }
    } catch (err) {
      setError('Error fetching lot: ' + err.message)
    } finally {
      setLoading(false)
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
          <button className="btn btn-primary" onClick={() => navigate('/')}>
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
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            ← Back to Dashboard
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

        {/* Ratios Section */}
        <div className="card">
          <h2>Ratios</h2>
          <div className="ratios-grid">
            {Object.entries(lot.ratios || {}).map(([key, value]) => (
              <div key={key} className="info-item">
                <label>{key.toUpperCase()}</label>
                <div className="info-value">{value}</div>
              </div>
            ))}
          </div>
          <div className="ratios-summary">
            <strong>
              Sum of Ratios:{' '}
              {Object.values(lot.ratios || {}).reduce(
                (sum, val) => sum + (Number(val) || 0),
                0
              ).toFixed(2)}
            </strong>
          </div>
        </div>

        {/* Production Data Section */}
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
                  lot.productionData.map((row, index) => (
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
                    <td colSpan="8" style={{ textAlign: 'center' }}>
                      No production data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary & Calculations Section */}
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

export default LotView
