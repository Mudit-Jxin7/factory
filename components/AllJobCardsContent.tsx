'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { jobCardsAPI } from '@/lib/api'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import { useConfirm } from './ConfirmProvider'
import JobCardsFilters from './jobcards/JobCardsFilters'
import JobCardsTable from './jobcards/JobCardsTable'
import './dashboard.css'

export default function AllJobCardsContent() {
  const router = useRouter()
  const toast = useToast()
  const { confirm: showConfirm } = useConfirm()
  const [allJobCards, setAllJobCards] = useState<any[]>([])
  const [loadingJobCards, setLoadingJobCards] = useState(true)
  const [deletingJobCard, setDeletingJobCard] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [selectedJobCardIds, setSelectedJobCardIds] = useState<Set<string>>(new Set())
  const [filterLotNumber, setFilterLotNumber] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterBrand, setFilterBrand] = useState('')

  const fetchAllJobCards = async () => {
    setLoadingJobCards(true)
    setSelectedJobCardIds(new Set())
    try {
      const result = await jobCardsAPI.getAllJobCards()
      if (result.success) setAllJobCards(result.jobCards || [])
      else toast.showToast('Error fetching job cards: ' + result.error, 'error')
    } catch (error: any) {
      toast.showToast('Error fetching job cards: ' + error.message, 'error')
    } finally { setLoadingJobCards(false) }
  }

  useEffect(() => { fetchAllJobCards() }, [])

  const handleDeleteJobCard = async (lotNumber: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Job Card',
      message: `Are you sure you want to delete job card for lot "${lotNumber}"? This action cannot be undone.`,
      confirmText: 'Delete', cancelText: 'Cancel', type: 'danger',
    })
    if (!confirmed) return
    setDeletingJobCard(lotNumber)
    try {
      const result = await jobCardsAPI.deleteJobCard(lotNumber)
      if (result.success) { toast.showToast('Job card deleted successfully!', 'success'); fetchAllJobCards() }
      else toast.showToast('Error deleting job card: ' + result.error, 'error')
    } catch (error: any) {
      toast.showToast('Error deleting job card: ' + error.message, 'error')
    } finally { setDeletingJobCard(null) }
  }

  const handleDeleteSelected = async () => {
    const cardsToDelete = filteredJobCards.filter(j => selectedJobCardIds.has(j._id))
    const confirmed = await showConfirm({
      title: 'Delete Selected Job Cards',
      message: `Are you sure you want to delete ${cardsToDelete.length} job card(s)? This action cannot be undone.`,
      confirmText: `Delete ${cardsToDelete.length} Job Card${cardsToDelete.length > 1 ? 's' : ''}`,
      cancelText: 'Cancel',
      type: 'danger',
    })
    if (!confirmed) return

    setBulkDeleting(true)
    let deleted = 0, failed = 0
    for (const jobCard of cardsToDelete) {
      try {
        const result = await jobCardsAPI.deleteJobCard(jobCard.lotNumber)
        if (result.success) deleted++
        else failed++
      } catch { failed++ }
    }
    setBulkDeleting(false)
    setSelectedJobCardIds(new Set())
    fetchAllJobCards()

    if (failed === 0) toast.showToast(`${deleted} job card${deleted > 1 ? 's' : ''} deleted successfully!`, 'success')
    else toast.showToast(`Deleted ${deleted}, failed to delete ${failed}.`, 'error')
  }

  const handleSelectId = (id: string, checked: boolean) => {
    setSelectedJobCardIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedJobCardIds(checked ? new Set(filteredJobCards.map(j => j._id)) : new Set())
  }

  const brandOptions = [...new Set(allJobCards.map((j: any) => j.brand).filter(Boolean))].sort() as string[]

  const filteredJobCards = allJobCards.filter((j: any) =>
    (!filterLotNumber || j.lotNumber?.toLowerCase().includes(filterLotNumber.toLowerCase())) &&
    (!filterDate      || j.date === filterDate) &&
    (!filterBrand     || j.brand === filterBrand)
  )

  const selectedCount = filteredJobCards.filter(j => selectedJobCardIds.has(j._id)).length

  return (
    <>
      <NavigationBar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-title"><h1>All Job Cards</h1><p>View and manage all job cards</p></div>
          <div className="header-actions">
            {selectedCount > 0 && (
              <button
                className="btn btn-logout"
                onClick={handleDeleteSelected}
                disabled={bulkDeleting}
                style={{ minWidth: '180px' }}
              >
                {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedCount})`}
              </button>
            )}
            <button className="btn btn-secondary" onClick={fetchAllJobCards} disabled={bulkDeleting}>
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
              deletingJobCard={deletingJobCard}
              bulkDeleting={bulkDeleting}
              selectedIds={selectedJobCardIds}
              onSelectId={handleSelectId}
              onSelectAll={handleSelectAll}
              onDeleteSelected={handleDeleteSelected}
              onView={(lotNumber) => router.push(`/jobcard/${encodeURIComponent(lotNumber)}`)}
              onDelete={handleDeleteJobCard}
            />
          </div>
        </div>
      </div>
    </>
  )
}
