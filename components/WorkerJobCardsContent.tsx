'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { jobCardsAPI } from '@/lib/api'
import WorkerNavigationBar from './WorkerNavigationBar'
import { useToast } from './ToastProvider'
import JobCardsFilters from './jobcards/JobCardsFilters'
import JobCardsTable from './jobcards/JobCardsTable'
import { getJobCardDisplayStatus } from '@/lib/jobCardStatus'
import './dashboard.css'

export default function WorkerJobCardsContent() {
  const router = useRouter()
  const toast = useToast()
  const [allJobCards, setAllJobCards] = useState<any[]>([])
  const [loadingJobCards, setLoadingJobCards] = useState(true)
  const [filterLotNumber, setFilterLotNumber] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchAllJobCards = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoadingJobCards(true)
    try {
      const result = await jobCardsAPI.getAllJobCards()
      if (result.success) {
        setAllJobCards(result.jobCards || [])
        if (isRefresh) toast.showToast('Job cards refreshed', 'success')
      } else toast.showToast('Error fetching job cards: ' + result.error, 'error')
    } catch (error: any) {
      toast.showToast('Error fetching job cards: ' + error.message, 'error')
    } finally {
      if (isRefresh) setRefreshing(false)
      else setLoadingJobCards(false)
    }
  }

  useEffect(() => { fetchAllJobCards() }, [])

  const brandOptions = [...new Set(allJobCards.map((j: any) => j.brand).filter(Boolean))].sort() as string[]

  const filteredJobCards = allJobCards.filter((j: any) =>
    (!filterLotNumber || j.lotNumber?.toLowerCase().includes(filterLotNumber.toLowerCase())) &&
    (!filterDate      || j.date === filterDate) &&
    (!filterBrand     || j.brand === filterBrand) &&
    (!filterStatus    || getJobCardDisplayStatus(j, { variant: 'worker' }) === filterStatus)
  )

  return (
    <>
      <WorkerNavigationBar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-title"><h1>Job Cards</h1><p>View and update job cards</p></div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => fetchAllJobCards(true)} disabled={refreshing}>
              <span className="btn-icon">🔄</span>Refresh
            </button>
          </div>
        </div>
        <div className="dashboard-content">
          <div className="card">
            {!loadingJobCards && (
              <JobCardsFilters
                filterLotNumber={filterLotNumber} filterDate={filterDate} filterBrand={filterBrand} filterStatus={filterStatus}
                brandOptions={brandOptions}
                onLotNumberChange={setFilterLotNumber} onDateChange={setFilterDate} onBrandChange={setFilterBrand}
                onStatusChange={setFilterStatus}
                onClear={() => { setFilterLotNumber(''); setFilterDate(''); setFilterBrand(''); setFilterStatus('') }}
              />
            )}
            <JobCardsTable
              jobCards={filteredJobCards} allCount={allJobCards.length} loading={loadingJobCards}
              onRefresh={() => fetchAllJobCards(true)}
              refreshing={refreshing}
              onView={(lotNumber) => router.push(`/worker/jobcard/${encodeURIComponent(lotNumber)}`)}
              variant="worker"
            />
          </div>
        </div>
      </div>
    </>
  )
}
