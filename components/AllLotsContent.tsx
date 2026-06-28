'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { lotsAPI } from '@/lib/api'
import { createJobCardFromLot } from '@/lib/jobCardUtils'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import { useConfirm } from './ConfirmProvider'
import LotsFilters from './lots/LotsFilters'
import LotsTable from './lots/LotsTable'
import './dashboard.css'

export default function AllLotsContent() {
  const router = useRouter()
  const toast = useToast()
  const { confirm: showConfirm } = useConfirm()
  const [allLots, setAllLots] = useState<any[]>([])
  const [loadingLots, setLoadingLots] = useState(true)
  const [deletingLot, setDeletingLot] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(new Set())
  const [filterDate, setFilterDate] = useState('')
  const [filterLotNumber, setFilterLotNumber] = useState('')
  const [filterFabric, setFilterFabric] = useState('')
  const [filterPattern, setFilterPattern] = useState('')
  const [filterBrand, setFilterBrand] = useState('')

  const fetchAllLots = async () => {
    setLoadingLots(true)
    setSelectedLotIds(new Set())
    try {
      const result = await lotsAPI.getAllLots()
      if (result.success) setAllLots(result.lots || [])
      else toast.showToast('Error fetching lots: ' + result.error, 'error')
    } catch (error: any) {
      toast.showToast('Error fetching lots: ' + error.message, 'error')
    } finally { setLoadingLots(false) }
  }

  useEffect(() => { fetchAllLots() }, [])

  useEffect(() => {
    if (allLots.length > 0) {
      Promise.all(allLots.map((lot) => createJobCardFromLot(lot))).catch(() => {})
    }
  }, [allLots])

  const handleDeleteLot = async (lotNumber: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Lot',
      message: `Are you sure you want to delete lot "${lotNumber}"? This action cannot be undone.`,
      confirmText: 'Delete', cancelText: 'Cancel', type: 'danger',
    })
    if (!confirmed) return
    setDeletingLot(lotNumber)
    try {
      const result = await lotsAPI.deleteLot(lotNumber)
      if (result.success) { toast.showToast('Lot deleted successfully!', 'success'); fetchAllLots() }
      else toast.showToast('Error deleting lot: ' + result.error, 'error')
    } catch (error: any) {
      toast.showToast('Error deleting lot: ' + error.message, 'error')
    } finally { setDeletingLot(null) }
  }

  const handleDeleteSelected = async () => {
    const lotsToDelete = filteredLots.filter(l => selectedLotIds.has(l._id))
    const confirmed = await showConfirm({
      title: 'Delete Selected Lots',
      message: `Are you sure you want to delete ${lotsToDelete.length} lot(s)? Their job cards will also be deleted. This action cannot be undone.`,
      confirmText: `Delete ${lotsToDelete.length} Lot${lotsToDelete.length > 1 ? 's' : ''}`,
      cancelText: 'Cancel',
      type: 'danger',
    })
    if (!confirmed) return

    setBulkDeleting(true)
    let deleted = 0, failed = 0
    for (const lot of lotsToDelete) {
      try {
        const result = await lotsAPI.deleteLot(lot.lotNumber)
        if (result.success) deleted++
        else failed++
      } catch { failed++ }
    }
    setBulkDeleting(false)
    setSelectedLotIds(new Set())
    fetchAllLots()

    if (failed === 0) toast.showToast(`${deleted} lot${deleted > 1 ? 's' : ''} deleted successfully!`, 'success')
    else toast.showToast(`Deleted ${deleted}, failed to delete ${failed}.`, 'error')
  }

  const handleSelectId = (id: string, checked: boolean) => {
    setSelectedLotIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedLotIds(checked ? new Set(filteredLots.map(l => l._id)) : new Set())
  }

  const filteredLots = allLots.filter((lot: any) =>
    (!filterDate      || lot.date      === filterDate) &&
    (!filterLotNumber || lot.lotNumber?.toLowerCase().includes(filterLotNumber.toLowerCase())) &&
    (!filterFabric    || lot.fabric    === filterFabric) &&
    (!filterPattern   || lot.pattern   === filterPattern) &&
    (!filterBrand     || lot.brand     === filterBrand)
  )

  const fabricOptions  = [...new Set(allLots.map((l: any) => l.fabric).filter(Boolean))].sort() as string[]
  const patternOptions = [...new Set(allLots.map((l: any) => l.pattern).filter(Boolean))].sort() as string[]
  const brandOptions   = [...new Set(allLots.map((l: any) => l.brand).filter(Boolean))].sort() as string[]

  const selectedCount = filteredLots.filter(l => selectedLotIds.has(l._id)).length

  return (
    <>
      <NavigationBar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-title"><h1>All Lots</h1><p>View and manage all production lots</p></div>
          <div className="header-actions">
            {selectedCount > 0 && (
              <button
                className="btn btn-logout"
                onClick={handleDeleteSelected}
                disabled={bulkDeleting}
                style={{ minWidth: '160px' }}
              >
                {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedCount})`}
              </button>
            )}
            <button className="btn btn-secondary" onClick={fetchAllLots} disabled={bulkDeleting}>
              <span className="btn-icon">🔄</span>Refresh
            </button>
          </div>
        </div>
        <div className="dashboard-content">
          <div className="card">
            {!loadingLots && (
              <LotsFilters
                filterDate={filterDate} filterLotNumber={filterLotNumber}
                filterFabric={filterFabric} filterPattern={filterPattern} filterBrand={filterBrand}
                fabricOptions={fabricOptions} patternOptions={patternOptions} brandOptions={brandOptions}
                onDateChange={setFilterDate} onLotNumberChange={setFilterLotNumber}
                onFabricChange={setFilterFabric} onPatternChange={setFilterPattern} onBrandChange={setFilterBrand}
                onClear={() => { setFilterDate(''); setFilterLotNumber(''); setFilterFabric(''); setFilterPattern(''); setFilterBrand('') }}
              />
            )}
            <LotsTable
              lots={filteredLots} allCount={allLots.length} loading={loadingLots}
              deletingLot={deletingLot}
              selectedIds={selectedLotIds}
              onSelectId={handleSelectId}
              onSelectAll={handleSelectAll}
              onView={(lotNumber) => router.push(`/lot/${lotNumber}`)}
              onDelete={handleDeleteLot}
            />
          </div>
        </div>
      </div>
    </>
  )
}
