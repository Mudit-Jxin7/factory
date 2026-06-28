'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { lotsAPI } from '@/lib/api'
import { createJobCardFromLot } from '@/lib/jobCardUtils'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import { useConfirm } from './ConfirmProvider'
import ActionBar from './ActionBar'
import LotInfoSection from './lotview/LotInfoSection'
import LotRatiosSection from './lotview/LotRatiosSection'
import LotProductionTable from './lotview/LotProductionTable'
import LotSummarySection from './lotview/LotSummarySection'
import { exportLotViewToPDF, exportLotViewToExcel } from './lotview/exportUtils'
import './dashboard.css'

interface LotViewContentProps {
  lotNumber: string
}

export default function LotViewContent({ lotNumber }: LotViewContentProps) {
  const router = useRouter()
  const toast = useToast()
  const { confirm: showConfirm } = useConfirm()
  const [lot, setLot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [generatingExcel, setGeneratingExcel] = useState(false)

  useEffect(() => {
    const fetchLot = async () => {
      try {
        setLoading(true); setError(null)
        const result = await lotsAPI.getLotByNumber(decodeURIComponent(lotNumber))
        if (result.success && result.lot) setLot(result.lot)
        else setError(result.error || `Lot "${decodeURIComponent(lotNumber)}" not found`)
      } catch (err: any) {
        setError('Error fetching lot: ' + err.message)
      } finally { setLoading(false) }
    }
    fetchLot()
  }, [lotNumber])

  useEffect(() => {
    if (lot) createJobCardFromLot(lot).catch(() => {})
  }, [lot])

  const handleDeleteLot = async () => {
    if (!lot) return
    const confirmed = await showConfirm({
      title: 'Delete Lot',
      message: `Are you sure you want to delete lot "${lot.lotNumber}"? This action cannot be undone.`,
      confirmText: 'Delete', cancelText: 'Cancel', type: 'danger',
    })
    if (!confirmed) return
    setDeleting(true)
    try {
      const result = await lotsAPI.deleteLot(lot.lotNumber)
      if (result.success) { toast.showToast('Lot deleted successfully!', 'success'); router.push('/lots') }
      else toast.showToast('Error deleting lot: ' + result.error, 'error')
    } catch (error: any) {
      toast.showToast('Error deleting lot: ' + error.message, 'error')
    } finally { setDeleting(false) }
  }

  const handleExportPDF = () => {
    if (!lot) return
    setGeneratingPDF(true)
    try { exportLotViewToPDF(lot) }
    catch (err: any) { toast.showToast('Error generating PDF: ' + err.message, 'error') }
    finally { setGeneratingPDF(false) }
  }

  const handleExportExcel = () => {
    if (!lot) return
    setGeneratingExcel(true)
    try { exportLotViewToExcel(lot); toast.showToast('Excel file exported successfully!', 'success') }
    catch (err: any) { toast.showToast('Error generating Excel: ' + err.message, 'error') }
    finally { setGeneratingExcel(false) }
  }

  if (loading) {
    return (
      <><NavigationBar />
        <div className="dashboard-container">
          <div className="loading-container"><div className="spinner" /><p>Loading lot data&hellip;</p></div>
        </div>
      </>
    )
  }

  if (error || !lot) {
    return (
      <><NavigationBar />
        <div className="dashboard-container">
          <div className="error-container">
            <h2>Error</h2><p>{error || 'Lot not found'}</p>
            <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <NavigationBar />
      <ActionBar actions={[
        { label: 'Download PDF', shortLabel: 'PDF', icon: '📄', onClick: handleExportPDF, loading: generatingPDF, loadingLabel: '…' },
        { label: 'Download Excel', shortLabel: 'Excel', icon: '📊', onClick: handleExportExcel, loading: generatingExcel, loadingLabel: '…' },
        { label: 'Back to Dashboard', shortLabel: 'Back', icon: '←', onClick: () => router.push('/dashboard'), variant: 'secondary' as const },
      ]} />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-title">
            <h1>Lot Details: {lot.lotNumber}</h1>
            <p>View saved lot production data</p>
          </div>
        </div>
        <div className="dashboard-content">
          <LotInfoSection lot={lot} />
          <LotRatiosSection ratios={lot.ratios || {}} />
          <LotProductionTable productionData={lot.productionData || []} />
          <LotSummarySection lot={lot} />
        </div>
      </div>
    </>
  )
}
