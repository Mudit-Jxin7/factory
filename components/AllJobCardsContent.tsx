'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { jobCardsAPI } from '@/lib/api'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import { useConfirm } from './ConfirmProvider'
import './dashboard.css'

export default function AllJobCardsContent() {
  const router = useRouter()
  const toast = useToast()
  const { confirm: showConfirm } = useConfirm()
  const [allJobCards, setAllJobCards] = useState<any[]>([])
  const [loadingJobCards, setLoadingJobCards] = useState(true)
  const [deletingJobCard, setDeletingJobCard] = useState<string | null>(null)
  const [filterLotNumber, setFilterLotNumber] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterBrand, setFilterBrand] = useState('')

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
        toast.showToast('Error fetching job cards: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Error fetching job cards:', error)
      toast.showToast('Error fetching job cards: ' + error.message, 'error')
    } finally {
      setLoadingJobCards(false)
    }
  }

  const handleViewJobCard = (lotNumber: string) => {
    router.push(`/jobcard/${encodeURIComponent(lotNumber)}`)
  }

  const brandOptions = [...new Set(allJobCards.map((j: any) => j.brand).filter(Boolean))].sort()

  const filteredJobCards = allJobCards.filter((j: any) => {
    const matchesLot   = !filterLotNumber || (j.lotNumber && j.lotNumber.toLowerCase().includes(filterLotNumber.toLowerCase()))
    const matchesDate  = !filterDate      || (j.date && j.date === filterDate)
    const matchesBrand = !filterBrand     || (j.brand && j.brand === filterBrand)
    return matchesLot && matchesDate && matchesBrand
  })

  const clearFilters = () => {
    setFilterLotNumber('')
    setFilterDate('')
    setFilterBrand('')
  }


  const handleDeleteJobCard = async (lotNumber: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Job Card',
      message: `Are you sure you want to delete job card for lot "${lotNumber}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    })

    if (!confirmed) {
      return
    }

    setDeletingJobCard(lotNumber)
    try {
      const result = await jobCardsAPI.deleteJobCard(lotNumber)
      if (result.success) {
        toast.showToast('Job card deleted successfully!', 'success')
        fetchAllJobCards()
      } else {
        toast.showToast('Error deleting job card: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Error deleting job card:', error)
      toast.showToast('Error deleting job card: ' + error.message, 'error')
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
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2>All Job Cards</h2>
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
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="skeleton-row">
                        <td><div className="skeleton-cell" style={{ width: '75%' }} /></td>
                        <td><div className="skeleton-cell" style={{ width: '65%' }} /></td>
                        <td><div className="skeleton-cell" style={{ width: '55%' }} /></td>
                        <td><div className="skeleton-cell" style={{ width: '85%', margin: '0 auto' }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2>All Job Cards ({filteredJobCards.length} of {allJobCards.length})</h2>
              </div>

              {/* Filters */}
              <div className="card" style={{ marginBottom: '20px', padding: '20px', background: '#fff9e6' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>Filters</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ marginBottom: '8px', display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>Lot Number</label>
                    <input
                      type="text"
                      value={filterLotNumber}
                      onChange={(e) => setFilterLotNumber(e.target.value)}
                      placeholder="Search lot number…"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', backgroundColor: '#fff' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ marginBottom: '8px', display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>Date</label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', backgroundColor: '#fff' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ marginBottom: '8px', display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>Brand</label>
                    <select
                      value={filterBrand}
                      onChange={(e) => setFilterBrand(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', backgroundColor: '#fff' }}
                    >
                      <option value="">All Brands</option>
                      {brandOptions.map((b: string) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'end' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={clearFilters}
                      style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
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
                    {filteredJobCards.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#6c757d', fontSize: '18px' }}>
                          {allJobCards.length === 0 ? 'No job cards found' : 'No job cards match the filters'}
                        </td>
                      </tr>
                    ) : (
                      filteredJobCards.map((jobCard: any) => (
                        <tr key={jobCard._id || jobCard.lotNumber}>
                          <td style={{ fontWeight: '600', color: '#1a1a1a' }}>{jobCard.lotNumber || '-'}</td>
                          <td>{jobCard.date || '-'}</td>
                          <td>{jobCard.brand || '-'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleViewJobCard(jobCard.lotNumber)}
                                style={{ padding: '8px 16px', fontSize: '14px' }}
                              >
                                View
                              </button>
                              <button
                                className="btn btn-primary"
                                onClick={() => router.push(`/jobcard/${encodeURIComponent(jobCard.lotNumber)}?edit=true`)}
                                style={{ padding: '8px 16px', fontSize: '14px' }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-logout"
                                onClick={() => handleDeleteJobCard(jobCard.lotNumber)}
                                disabled={deletingJobCard === jobCard.lotNumber}
                                style={{ padding: '8px 16px', fontSize: '14px' }}
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
