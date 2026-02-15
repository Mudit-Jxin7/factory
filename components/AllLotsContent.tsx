'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { lotsAPI } from '@/lib/api'
import './dashboard.css'

export default function AllLotsContent() {
  const router = useRouter()
  const [allLots, setAllLots] = useState<any[]>([])
  const [loadingLots, setLoadingLots] = useState(true)

  useEffect(() => {
    fetchAllLots()
  }, [])

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

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    router.push('/login')
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-title">
          <h1>All Lots</h1>
          <p>View and manage all production lots</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleBackToDashboard}>
            <span className="btn-icon">←</span>
            Back to Dashboard
          </button>
          <button className="btn btn-logout" onClick={handleLogout}>
            <span className="btn-icon">🚪</span>
            Logout
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
                <button className="btn btn-secondary" onClick={fetchAllLots}>
                  <span className="btn-icon">🔄</span>
                  Refresh
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Lot Number</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Fabric</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Pattern</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Brand</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLots.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                          No lots found
                        </td>
                      </tr>
                    ) : (
                      allLots.map((lot: any) => (
                        <tr 
                          key={lot._id || lot.lotNumber} 
                          style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '12px', fontWeight: '500' }}>{lot.lotNumber || '-'}</td>
                          <td style={{ padding: '12px' }}>{lot.date || '-'}</td>
                          <td style={{ padding: '12px' }}>{lot.fabric || '-'}</td>
                          <td style={{ padding: '12px' }}>{lot.pattern || '-'}</td>
                          <td style={{ padding: '12px' }}>{lot.brand || '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleViewLot(lot.lotNumber)}
                                style={{ padding: '6px 12px', fontSize: '14px' }}
                              >
                                View
                              </button>
                              <button
                                className="btn btn-primary"
                                onClick={() => router.push(`/dashboard?edit=${encodeURIComponent(lot.lotNumber)}`)}
                                style={{ padding: '6px 12px', fontSize: '14px' }}
                              >
                                Edit
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
  )
}
