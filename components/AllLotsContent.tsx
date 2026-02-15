'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { lotsAPI } from '@/lib/api'
import './dashboard.css'

export default function AllLotsContent() {
  const router = useRouter()
  const [allLots, setAllLots] = useState<any[]>([])
  const [loadingLots, setLoadingLots] = useState(true)
  const [deletingLot, setDeletingLot] = useState<string | null>(null)

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
  )
}
