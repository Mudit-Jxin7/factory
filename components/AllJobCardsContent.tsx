'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { jobCardsAPI } from '@/lib/api'
import NavigationBar from './NavigationBar'
import './dashboard.css'

export default function AllJobCardsContent() {
  const router = useRouter()
  const [allJobCards, setAllJobCards] = useState<any[]>([])
  const [loadingJobCards, setLoadingJobCards] = useState(true)
  const [deletingJobCard, setDeletingJobCard] = useState<string | null>(null)

  useEffect(() => {
    fetchAllJobCards()
  }, [])

  const fetchAllJobCards = async () => {
    setLoadingJobCards(true)
    try {
      const result = await jobCardsAPI.getAllJobCards()
      if (result.success) {
        setAllJobCards(result.jobCards || [])
      } else {
        alert('Error fetching job cards: ' + result.error)
      }
    } catch (error: any) {
      console.error('Error fetching job cards:', error)
      alert('Error fetching job cards: ' + error.message)
    } finally {
      setLoadingJobCards(false)
    }
  }

  const handleViewJobCard = (lotNumber: string) => {
    router.push(`/jobcard/${lotNumber}`)
  }


  const handleDeleteJobCard = async (lotNumber: string) => {
    if (!confirm(`Are you sure you want to delete job card for lot "${lotNumber}"? This action cannot be undone.`)) {
      return
    }

    setDeletingJobCard(lotNumber)
    try {
      const result = await jobCardsAPI.deleteJobCard(lotNumber)
      if (result.success) {
        alert('Job card deleted successfully!')
        fetchAllJobCards()
      } else {
        alert('Error deleting job card: ' + result.error)
      }
    } catch (error: any) {
      console.error('Error deleting job card:', error)
      alert('Error deleting job card: ' + error.message)
    } finally {
      setDeletingJobCard(null)
    }
  }

  return (
    <>
      <NavigationBar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-title">
            <h1>All Job Cards</h1>
            <p>View and manage all job cards</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={fetchAllJobCards}>
              <span className="btn-icon">🔄</span>
              Refresh
            </button>
          </div>
        </div>

      <div className="dashboard-content">
        <div className="card">
          {loadingJobCards ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p>Loading job cards...</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2>All Job Cards ({allJobCards.length})</h2>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="production-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Lot Number</th>
                      <th>Date</th>
                      <th>Brand</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allJobCards.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#6c757d', fontSize: '16px' }}>
                          No job cards found
                        </td>
                      </tr>
                    ) : (
                      allJobCards.map((jobCard: any) => (
                        <tr key={jobCard._id || jobCard.lotNumber}>
                          <td style={{ fontWeight: '600', color: '#1a1a1a' }}>{jobCard.lotNumber || '-'}</td>
                          <td>{jobCard.date || '-'}</td>
                          <td>{jobCard.brand || '-'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleViewJobCard(jobCard.lotNumber)}
                                style={{ padding: '8px 16px', fontSize: '12px' }}
                              >
                                View
                              </button>
                              <button
                                className="btn btn-primary"
                                onClick={() => router.push(`/jobcard/${encodeURIComponent(jobCard.lotNumber)}`)}
                                style={{ padding: '8px 16px', fontSize: '12px' }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-logout"
                                onClick={() => handleDeleteJobCard(jobCard.lotNumber)}
                                disabled={deletingJobCard === jobCard.lotNumber}
                                style={{ padding: '8px 16px', fontSize: '12px' }}
                              >
                                {deletingJobCard === jobCard.lotNumber ? 'Deleting...' : 'Delete'}
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
