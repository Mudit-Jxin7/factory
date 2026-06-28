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
  const [filterDate, setFilterDate] = useState('')
  const [filterLotNumber, setFilterLotNumber] = useState('')
  const [filterFabric, setFilterFabric] = useState('')
  const [filterPattern, setFilterPattern] = useState('')
  const [filterBrand, setFilterBrand] = useState('')

  const fetchAllLots = async () => {
    setLoadingLots(true)
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

  return (
    <>
      <NavigationBar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-title"><h1>All Lots</h1><p>View and manage all production lots</p></div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={fetchAllLots}><span className="btn-icon">🔄</span>Refresh</button>
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
              onView={(lotNumber) => router.push(`/lot/${lotNumber}`)}
              onDelete={handleDeleteLot}
            />
          </div>
        </div>
      </div>
    </>
  )
}
