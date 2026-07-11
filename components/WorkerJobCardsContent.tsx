'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { jobCardsAPI } from '@/lib/api'
import WorkerNavigationBar from './WorkerNavigationBar'
import { useToast } from './ToastProvider'
import JobCardsFilters from './jobcards/JobCardsFilters'
import JobCardsTable from './jobcards/JobCardsTable'
import './dashboard.css'

export default function WorkerJobCardsContent() {
  const router = useRouter()
  const toast = useToast()
  const [allJobCards, setAllJobCards] = useState<any[]>([])
  const [loadingJobCards, setLoadingJobCards] = useState(true)
  const [filterLotNumber, setFilterLotNumber] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterBrand, setFilterBrand] = useState('')

  const fetchAllJobCards = async () => {
    setLoadingJobCards(true)
    try {
      const result = await jobCardsAPI.getAllJobCards()
      if (result.success) setAllJobCards(result.jobCards || [])
      else toast.showToast('Error fetching job cards: ' + result.error, 'error')
    } catch (error: any) {
      toast.showToast('Error fetching job cards: ' + error.message, 'error')
    } finally { setLoadingJobCards(false) }
  }

  useEffect(() => { fetchAllJobCards() }, [])

  const brandOptions = [...new Set(allJobCards.map((j: any) => j.brand).filter(Boolean))].sort() as string[]

  const filteredJobCards = allJobCards.filter((j: any) =>
    (!filterLotNumber || j.lotNumber?.toLowerCase().includes(filterLotNumber.toLowerCase())) &&
    (!filterDate      || j.date === filterDate) &&
    (!filterBrand     || j.brand === filterBrand)
  )

  return (
    <>
      <WorkerNavigationBar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-title"><h1>Job Cards</h1><p>View and update job cards</p></div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={fetchAllJobCards}>
              <span className="btn-icon">🔄</span>Refresh
            </button>
          </div>
        </div>
        <div className="dashboard-content">
          <div className="card">
            {!loadingJobCards && (
              <JobCardsFilters
                filterLotNumber={filterLotNumber} filterDate={filterDate} filterBrand={filterBrand}
                brandOptions={brandOptions}
                onLotNumberChange={setFilterLotNumber} onDateChange={setFilterDate} onBrandChange={setFilterBrand}
                onClear={() => { setFilterLotNumber(''); setFilterDate(''); setFilterBrand('') }}
              />
            )}
            <JobCardsTable
              jobCards={filteredJobCards} allCount={allJobCards.length} loading={loadingJobCards}
              onView={(lotNumber) => router.push(`/worker/jobcard/${encodeURIComponent(lotNumber)}`)}
              variant="worker"
            />
          </div>
        </div>
      </div>
    </>
  )
}
