'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { lotsAPI, jobCardsAPI } from '@/lib/api'
import NavigationBar from './NavigationBar'
import './dashboard.css'

export default function AllLotsContent() {
  const router = useRouter()
  const [allLots, setAllLots] = useState<any[]>([])
  const [loadingLots, setLoadingLots] = useState(true)
  const [deletingLot, setDeletingLot] = useState<string | null>(null)

  useEffect(() => {
    fetchAllLots()
  }, [])

  useEffect(() => {
    if (allLots.length > 0) {
      ensureJobCardsForAllLots()
    }
  }, [allLots])

  const ensureJobCardsForAllLots = async () => {
    // Check all lots in parallel and create missing job cards
    const promises = allLots.map(async (lot) => {
      try {
        const result = await jobCardsAPI.getJobCardByLotNumber(lot.lotNumber)
        if (!result.success || !result.jobCard) {
          // Job card doesn't exist, create it automatically
          await createJobCardFromLot(lot)
        }
      } catch (error) {
        // If check fails, try to create job card
        await createJobCardFromLot(lot)
      }
    })
    
    await Promise.all(promises)
  }

  const createJobCardFromLot = async (lotData: any) => {
    try {
      const jobCardData = {
        lotNumber: lotData.lotNumber,
        date: lotData.date || new Date().toISOString().split('T')[0],
        brand: lotData.brand || '',
        ratios: lotData.ratios || {
          r28: 0, r30: 0, r32: 0, r34: 0, r36: 0,
          r38: 0, r40: 0, r42: 0, r44: 0,
        },
        productionData: (lotData.productionData || []).map((row: any, index: number) => ({
          serialNumber: index + 1,
          layer: Number(row.layer) || 1,
          pieces: Number(row.pieces) || 0,
          color: row.color || '',
          shade: row.shade || '',
          front: '',
          back: '',
          zip: '',
          thread: '',
        })),
        flyWidth: '',
        tbdFields: {
          tbd1: '',
          tbd2: '',
          tbd3: '',
          tbd4: '',
          tbd5: '',
        },
      }

      await jobCardsAPI.createJobCard(jobCardData)
    } catch (error) {
      console.error(`Error auto-creating job card for lot ${lotData.lotNumber}:`, error)
    }
  }

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
    <>
      <NavigationBar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-title">
            <h1>All Lots</h1>
            <p>View and manage all production lots</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={fetchAllLots}>
              <span className="btn-icon">🔄</span>
              Refresh
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
                                className="btn btn-secondary"
                                onClick={() => router.push(`/jobcard/${encodeURIComponent(lot.lotNumber)}`)}
                                style={{ padding: '8px 16px', fontSize: '12px' }}
                              >
                                Job Card
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
    </>
  )
}
