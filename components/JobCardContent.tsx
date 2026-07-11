'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { jobCardsAPI, workersAPI } from '@/lib/api'
import { JobCardProductionRow, Worker, Ratios, AdditionalInfo, JobCardStatus, DEFAULT_RATIOS, DEFAULT_ADDITIONAL_INFO } from '@/lib/types'
import { canAdminApproveJobCard, canAdminEditJobCard, canAdminViewWorkerPrices, canWorkerEditJobCard, normalizeJobCardStatus } from '@/lib/jobCardStatus'
import JobCardStatusBadge from './jobcards/JobCardStatusBadge'
import NavigationBar from './NavigationBar'
import WorkerNavigationBar from './WorkerNavigationBar'
import { useToast } from './ToastProvider'
import ActionBar, { ActionBarItem } from './ActionBar'
import { WorkerField, DEFAULT_PRODUCTION_ROW } from './jobcard/constants'
import WorkerPopupModal from './jobcard/WorkerPopupModal'
import JobCardRatios from './jobcard/JobCardRatios'
import JobCardProductionTable from './jobcard/JobCardProductionTable'
import JobCardAdditionalInfo from './jobcard/JobCardAdditionalInfo'
import JobCardWorkerPrices from './jobcard/JobCardWorkerPrices'
import { applyWorkerPricesToProduction, getWorkerRateFromPrices, getWorkersAssignedToProduction, sanitizeWorkerPrices, WorkerPrices } from '@/lib/jobCardWorkerPrices'
import { exportJobCardToPDF } from './jobcard/exportToPDF'
import { exportJobCardToExcel } from './jobcard/exportToExcel'
import './dashboard.css'

interface JobCardContentProps {
  lotNumber: string
  isEdit?: boolean
  variant?: 'admin' | 'worker'
}

export default function JobCardContent({ lotNumber: initialLotNumber, isEdit: initialIsEdit, variant = 'admin' }: JobCardContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const isWorker = variant === 'worker'
  const jobCardBasePath = isWorker ? '/worker/jobcard' : '/jobcard'
  const jobCardsListPath = isWorker ? '/worker' : '/jobcards'
  const NavBar = isWorker ? WorkerNavigationBar : NavigationBar
  const isEditMode = initialIsEdit || searchParams?.get('edit') === 'true'
  const decodedLotNumber = initialLotNumber ? decodeURIComponent(initialLotNumber) : ''

  const [status, setStatus] = useState<JobCardStatus>('incomplete')

  const [lotNumber, setLotNumber] = useState(decodedLotNumber)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [brand, setBrand] = useState('')
  const [workers, setWorkers] = useState<Worker[]>([])
  const [ratios, setRatios] = useState<Ratios>(DEFAULT_RATIOS)
  const [productionData, setProductionData] = useState<JobCardProductionRow[]>([{ serialNumber: 1, ...DEFAULT_PRODUCTION_ROW }])
  const [flyWidth, setFlyWidth] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>(DEFAULT_ADDITIONAL_INFO)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [generatingExcel, setGeneratingExcel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingWorkerCell, setEditingWorkerCell] = useState<{ rowIndex: number; field: WorkerField } | null>(null)
  const [popupWorker, setPopupWorker] = useState('')
  const [popupDate, setPopupDate] = useState('')
  const [popupRate, setPopupRate] = useState('')
  const [workerPrices, setWorkerPrices] = useState<WorkerPrices>({})
  const [savingPrices, setSavingPrices] = useState(false)

  const canEdit = isWorker ? canWorkerEditJobCard(status) : canAdminEditJobCard(status)
  const showWorkerPrices = !isWorker && canAdminViewWorkerPrices(status)
  const effectiveEditMode = isEditMode && canEdit
  const effectiveWorkerPricesEdit = showWorkerPrices
  const canApprove = !isWorker && canAdminApproveJobCard(status)

  const sumOfRatios = useMemo(() => Object.values(ratios).reduce((sum, val) => sum + (Number(val) || 0), 0), [ratios])
  const assignedWorkers = useMemo(
    () => getWorkersAssignedToProduction(productionData, workers),
    [productionData, workers],
  )

  const fetchJobCard = useCallback(async (isRefresh = false) => {
    if (!lotNumber) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [result, workersResult] = await Promise.all([
        jobCardsAPI.getJobCardByLotNumber(lotNumber),
        workersAPI.getAllWorkers(),
      ])
      const workerList = workersResult.success ? workersResult.workers || [] : []
      setWorkers(workerList)
      if (result.success && result.jobCard) {
        const jc = result.jobCard
        const prices = jc.workerPrices || {}
        setError(null)
        setDate(jc.date || '')
        setBrand(jc.brand || '')
        setRatios(jc.ratios || DEFAULT_RATIOS)
        setFlyWidth(jc.flyWidth || '')
        setAdditionalInfo({ ...DEFAULT_ADDITIONAL_INFO, ...(jc.additionalInfo || {}) })
        setStatus(normalizeJobCardStatus(jc.status))
        setWorkerPrices(prices)
        setProductionData(
          jc.productionData?.length ? jc.productionData : [{ serialNumber: 1, ...DEFAULT_PRODUCTION_ROW }],
        )
        if (isRefresh) toast.showToast('Job card refreshed', 'success')
      } else {
        setError('Job card not found. Job cards are automatically created when a lot is saved.')
      }
    } catch (err: any) {
      setError('Error loading job card: ' + err.message)
    } finally {
      if (isRefresh) setRefreshing(false)
      else setLoading(false)
    }
  }, [lotNumber, toast])

  useEffect(() => { fetchJobCard() }, [fetchJobCard])

  const today = new Date().toISOString().split('T')[0]

  const openWorkerPopup = (rowIndex: number, field: WorkerField) => {
    const row = productionData[rowIndex]
    const workerMongoId = String((row as any)[`${field}Worker`] ?? '')
    setPopupWorker(workerMongoId)
    setPopupDate(isWorker ? today : String((row as any)[`${field}Date`] ?? '') || today)
    const presetRate = getWorkerRateFromPrices(workerMongoId, workers, workerPrices)
    setPopupRate(presetRate || String((row as any)[`${field}Rate`] ?? ''))
    setEditingWorkerCell({ rowIndex, field })
  }

  const handlePopupWorkerChange = (value: string) => {
    setPopupWorker(value)
    const presetRate = getWorkerRateFromPrices(value, workers, workerPrices)
    setPopupRate(presetRate)
  }

  const saveWorkerPopup = () => {
    if (!editingWorkerCell) return
    const { rowIndex, field } = editingWorkerCell
    const presetRate = getWorkerRateFromPrices(popupWorker, workers, workerPrices)
    setProductionData(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      const rateKey = `${field}Rate`
      return {
        ...row,
        [`${field}Worker`]: popupWorker,
        [`${field}Date`]: isWorker ? today : popupDate,
        [rateKey]: presetRate || (row as any)[rateKey],
      }
    }))
    setEditingWorkerCell(null)
  }

  const handleWorkerPriceChange = (workerId: string, rate: string) => {
    setWorkerPrices((prev) => {
      if (String(rate).trim() === '') {
        const { [workerId]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [workerId]: rate }
    })
  }

  const persistJobCard = async (options?: { pricesOnly?: boolean; nextStatus?: JobCardStatus; successMessage?: string }) => {
    const nextStatus = options?.nextStatus ?? (isWorker ? 'pending_approval' : status)
    const pricesToSave = options?.pricesOnly ? sanitizeWorkerPrices(workerPrices) : workerPrices
    const productionToSave = options?.pricesOnly
      ? applyWorkerPricesToProduction(productionData, pricesToSave, workers)
      : productionData
    if (options?.pricesOnly) {
      setWorkerPrices(pricesToSave)
      setProductionData(productionToSave)
    }
    const result = await jobCardsAPI.updateJobCard(lotNumber, {
      lotNumber, date, brand, ratios,
      productionData: productionToSave.map(row => ({ ...row, layer: Number(row.layer) || 1, pieces: Number(row.pieces) || 0 })),
      flyWidth, additionalInfo,
      ...(options?.pricesOnly ? { workerPrices: pricesToSave } : {}),
      status: nextStatus,
    })
    if (result.success) {
      setStatus(nextStatus)
      toast.showToast(options?.successMessage || 'Job card updated successfully!', 'success')
      if (!options?.pricesOnly) router.push(`${jobCardBasePath}/${encodeURIComponent(lotNumber)}`)
      return true
    }
    toast.showToast('Error updating job card: ' + result.error, 'error')
    return false
  }

  const handleSaveWorkerPrices = async () => {
    if (!showWorkerPrices) return
    setSavingPrices(true)
    try {
      await persistJobCard({ pricesOnly: true, successMessage: 'Worker prices saved successfully!' })
    } finally { setSavingPrices(false) }
  }

  const handleSave = async () => {
    if (!lotNumber.trim()) { toast.showToast('Please enter a lot number', 'warning'); return }
    if (!canEdit) { toast.showToast('This job card cannot be edited', 'warning'); return }
    setSaving(true)
    try {
      const nextStatus: JobCardStatus = isWorker ? 'pending_approval' : status
      const message = isWorker
        ? (status === 'incomplete' ? 'Job card submitted for approval!' : 'Job card updated successfully!')
        : 'Job card updated successfully!'
      await persistJobCard({ nextStatus, successMessage: message })
    } catch (err: any) {
      toast.showToast('Error saving job card: ' + err.message, 'error')
    } finally { setSaving(false) }
  }

  const handleApprove = async () => {
    setSaving(true)
    try {
      const result = await jobCardsAPI.approveJobCard(lotNumber)
      if (result.success) {
        setStatus('complete')
        toast.showToast('Job card approved successfully!', 'success')
        router.push(`${jobCardBasePath}/${encodeURIComponent(lotNumber)}`)
      } else {
        toast.showToast('Error approving job card: ' + result.error, 'error')
      }
    } catch (err: any) {
      toast.showToast('Error approving job card: ' + err.message, 'error')
    } finally { setSaving(false) }
  }

  const handleExportPDF = () => {
    setGeneratingPDF(true)
    try {
      exportJobCardToPDF({ lotNumber, brand, date, ratios, productionData, flyWidth, additionalInfo, workers })
    } catch (err: any) { toast.showToast('Error generating PDF: ' + err.message, 'error') }
    finally { setGeneratingPDF(false) }
  }

  const handleExportExcel = () => {
    setGeneratingExcel(true)
    try {
      exportJobCardToExcel({ lotNumber, brand, date, ratios, productionData, flyWidth, additionalInfo, workers })
      toast.showToast('Excel file exported successfully!', 'success')
    } catch (err: any) { toast.showToast('Error generating Excel: ' + err.message, 'error') }
    finally { setGeneratingExcel(false) }
  }

  if (loading) {
    return (
      <><NavBar />
        <div className="dashboard-container">
          <div className="loading-container"><div className="spinner" /><p>Loading job card&hellip;</p></div>
        </div>
      </>
    )
  }

  return (
    <>
      <NavBar />
      <ActionBar actions={[
        ...(effectiveEditMode ? [{ label: isWorker ? 'Submit for Approval' : 'Update Job Card', shortLabel: 'Save', icon: '💾', onClick: handleSave, disabled: saving || !lotNumber, loading: saving, loadingLabel: 'Saving…' } as ActionBarItem] : []),
        ...(canApprove ? [{ label: 'Approve Job Card', shortLabel: 'Approve', icon: '✅', onClick: handleApprove, disabled: saving, loading: saving, loadingLabel: 'Approving…' } as ActionBarItem] : []),
        ...(!isWorker ? [
          { label: 'Download PDF', shortLabel: 'PDF', icon: '📄', onClick: handleExportPDF, loading: generatingPDF, loadingLabel: '…' },
          { label: 'Download Excel', shortLabel: 'Excel', icon: '📊', onClick: handleExportExcel, loading: generatingExcel, loadingLabel: '…' },
        ] : []),
        ...(!effectiveEditMode && canEdit ? [{ label: 'Edit Job Card', shortLabel: 'Edit', icon: '✏️', onClick: () => router.push(`${jobCardBasePath}/${encodeURIComponent(lotNumber)}?edit=true`) } as ActionBarItem] : []),
        { label: 'Back to Job Cards', shortLabel: 'Back', icon: '←', onClick: () => router.push(jobCardsListPath), variant: 'secondary' as const },
      ]} />
      <div className="dashboard-container job-card-page">
        <div className="dashboard-header">
          <div className="header-title">
            <h1>{effectiveEditMode ? 'Edit Job Card' : 'View Job Card'}</h1>
            <p>{effectiveEditMode ? 'Edit' : 'View'} job card details for lot {lotNumber}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <JobCardStatusBadge
              status={status}
              jobCard={{ productionData }}
              workers={workers}
              variant={isWorker ? 'worker' : 'admin'}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fetchJobCard(true)}
              disabled={refreshing}
              title="Refresh job card"
              aria-label="Refresh job card"
              style={{ padding: '8px 12px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span className="btn-icon" style={{ display: 'inline-block', transform: refreshing ? 'rotate(360deg)' : undefined, transition: 'transform 0.6s linear' }}>🔄</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="card" style={{ marginBottom: '24px', background: '#fff5f5', border: '1px solid #ffe0e0' }}>
            <p style={{ color: '#c92a2a', margin: 0 }}>{error}</p>
          </div>
        )}

        <div className="dashboard-content">
          <div className="card">
            <h2>Job Card Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Lot Number</label>
                <input type="text" value={lotNumber} disabled style={{ background: '#f8f9fa', cursor: 'not-allowed' }} />
              </div>
              <div className="form-group">
                <label>Brand</label>
                <input type="text" value={brand} disabled style={{ background: '#f8f9fa', cursor: 'not-allowed' }} placeholder="Enter brand" />
              </div>
            </div>
          </div>

          <JobCardRatios ratios={ratios} sumOfRatios={sumOfRatios} />
          <JobCardProductionTable
            productionData={productionData} workers={workers}
            isEditMode={effectiveEditMode} onOpenWorkerPopup={openWorkerPopup}
            hideRate={isWorker}
          />
          <JobCardAdditionalInfo
            flyWidth={flyWidth} additionalInfo={additionalInfo} isEditMode={false}
            onFlyWidthChange={() => {}}
            onAdditionalInfoChange={() => {}}
          />
          {showWorkerPrices && (
            <JobCardWorkerPrices
              workers={assignedWorkers}
              workerPrices={workerPrices}
              isEditMode={effectiveWorkerPricesEdit}
              saving={savingPrices}
              onPriceChange={handleWorkerPriceChange}
              onSavePrices={handleSaveWorkerPrices}
            />
          )}
        </div>
      </div>

      {editingWorkerCell && (
        <WorkerPopupModal
          field={editingWorkerCell.field} workers={workers}
          popupWorker={popupWorker} popupDate={popupDate} popupRate={popupRate}
          onWorkerChange={handlePopupWorkerChange} onDateChange={setPopupDate} onRateChange={setPopupRate}
          onSave={saveWorkerPopup} onCancel={() => setEditingWorkerCell(null)}
          hideRate={isWorker}
        />
      )}
    </>
  )
}
