'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { jobCardsAPI, workersAPI, lotsAPI, workerProcessesAPI } from '@/lib/api'
import {
  JobCardProductionRow, Worker, Ratios, AdditionalInfo, LotWorkerRates, JobCardStatus, WorkerProcess,
  DEFAULT_RATIOS, DEFAULT_ADDITIONAL_INFO, DEFAULT_LOT_WORKER_RATES,
} from '@/lib/types'
import { canAdminEditJobCard, canWorkerEditJobCard, deriveJobCardStatus, normalizeJobCardStatus } from '@/lib/jobCardStatus'
import { hasAllRequiredWorkerFields, buildLockedWorkerCellKeys, isWorkerCellLocked } from '@/lib/jobCardWorkerCompletion'
import { applyLotRatesToProduction, getLotRateForField, normalizeLotWorkerRates } from '@/lib/lotWorkerRates'
import { formatDisplayDate, todayISODateIST } from '@/lib/dateFormat'
import JobCardStatusBadge from './jobcards/JobCardStatusBadge'
import NavigationBar from './NavigationBar'
import WorkerNavigationBar from './WorkerNavigationBar'
import { useToast } from './ToastProvider'
import ActionBar, { ActionBarItem } from './ActionBar'
import { IconSave, IconPdf, IconTable, IconEdit, IconBack, IconRefresh } from './Icons'
import { WorkerField, DEFAULT_PRODUCTION_ROW } from './jobcard/constants'
import WorkerPopupModal from './jobcard/WorkerPopupModal'
import JobCardRatios from './jobcard/JobCardRatios'
import JobCardProductionTable from './jobcard/JobCardProductionTable'
import JobCardAdditionalInfo from './jobcard/JobCardAdditionalInfo'
import LotRatesForm from './dashboard/LotRatesForm'
import { exportJobCardToPDF } from './jobcard/exportToPDF'
import { exportJobCardToExcel } from './jobcard/exportToExcel'
import { normalizeAdditionalInfo } from '@/lib/additionalInfoExport'
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
  const [date, setDate] = useState(todayISODateIST())
  const [brand, setBrand] = useState('')
  const [workers, setWorkers] = useState<Worker[]>([])
  const [ratios, setRatios] = useState<Ratios>(DEFAULT_RATIOS)
  const [productionData, setProductionData] = useState<JobCardProductionRow[]>([
    { serialNumber: 1, ...DEFAULT_PRODUCTION_ROW } as JobCardProductionRow,
  ])
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>(DEFAULT_ADDITIONAL_INFO)
  const [workerRates, setWorkerRates] = useState<LotWorkerRates>(DEFAULT_LOT_WORKER_RATES)
  const [workerProcesses, setWorkerProcesses] = useState<WorkerProcess[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [generatingExcel, setGeneratingExcel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingWorkerCell, setEditingWorkerCell] = useState<{ rowIndex: number; field: WorkerField } | null>(null)
  const [popupWorker, setPopupWorker] = useState('')
  const [popupDate, setPopupDate] = useState('')
  const [lockedWorkerCells, setLockedWorkerCells] = useState<Set<string>>(() => new Set())

  const canEdit = isWorker
    ? canWorkerEditJobCard(status)
    : canAdminEditJobCard(status)
  const effectiveEditMode = isEditMode && canEdit
  const workerFieldsComplete = useMemo(
    () => hasAllRequiredWorkerFields(productionData, workerRates, workerProcesses),
    [productionData, workerRates, workerProcesses],
  )

  const sumOfRatios = useMemo(() => Object.values(ratios).reduce((sum, val) => sum + (Number(val) || 0), 0), [ratios])

  const fetchJobCard = useCallback(async (isRefresh = false) => {
    if (!lotNumber) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [result, workersResult, lotResult, processesResult] = await Promise.all([
        jobCardsAPI.getJobCardByLotNumber(lotNumber),
        workersAPI.getAllWorkers(),
        lotsAPI.getLotByNumber(lotNumber),
        workerProcessesAPI.getAllProcesses(),
      ])
      const workerList = workersResult.success ? workersResult.workers || [] : []
      setWorkers(workerList)
      const processesList: WorkerProcess[] = processesResult.success ? (processesResult.processes || []) : []
      setWorkerProcesses(processesList)

      const lotRates = normalizeLotWorkerRates(
        lotResult.success && lotResult.lot?.workerRates
          ? lotResult.lot.workerRates
          : result.success && result.jobCard?.workerRates
            ? result.jobCard.workerRates
            : {},
        processesList,
      )
      setWorkerRates(lotRates)

      if (result.success && result.jobCard) {
        const jc = result.jobCard
        setError(null)
        setDate(jc.date || '')
        setBrand(jc.brand || '')
        setRatios(jc.ratios || DEFAULT_RATIOS)
        setAdditionalInfo(normalizeAdditionalInfo(jc.additionalInfo, jc.flyWidth))
        setStatus(normalizeJobCardStatus(jc.status))
        const lotRows = lotResult.success && Array.isArray(lotResult.lot?.productionData)
          ? lotResult.lot.productionData
          : []
        const jcRows = jc.productionData?.length ? jc.productionData : [{ serialNumber: 1, ...DEFAULT_PRODUCTION_ROW }]
        // Prefer lot layer/pieces/tukda/color when present so older job cards still show production info
        const rows = jcRows.map((row: JobCardProductionRow, i: number) => {
          const lotRow = lotRows[i] || {}
          return {
            ...row,
            serialNumber: row.serialNumber ?? lotRow.serialNumber ?? i + 1,
            // Lot owns production quantities/colors; job card owns worker assignments
            layer: lotRow.layer != null && String(lotRow.layer) !== '' ? String(lotRow.layer) : String(row.layer ?? '1'),
            pieces: Number(lotRow.pieces ?? row.pieces) || 0,
            tukda: Number(lotRow.tukda ?? row.tukda) || 0,
            color: lotRow.color || row.color || '',
            shade: lotRow.shade || row.shade || '',
            zip_code: lotRow.zip_code || row.zip_code || '',
            thread_code: lotRow.thread_code || row.thread_code || '',
          }
        })
        setProductionData(applyLotRatesToProduction(rows, lotRates, processesList))
        setLockedWorkerCells(isWorker ? buildLockedWorkerCellKeys(rows, lotRates, processesList) : new Set())
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
  }, [lotNumber, toast, isWorker])

  useEffect(() => { fetchJobCard() }, [fetchJobCard])

  const today = todayISODateIST()

  const openWorkerPopup = (rowIndex: number, field: WorkerField) => {
    if (isWorker && isWorkerCellLocked(lockedWorkerCells, rowIndex, field)) {
      toast.showToast('This column is already saved and cannot be changed', 'warning')
      return
    }
    const row = productionData[rowIndex]
    const workerMongoId = String((row as any)[`${field}Worker`] ?? '')
    setPopupWorker(workerMongoId)
    setPopupDate(isWorker ? today : String((row as any)[`${field}Date`] ?? '') || today)
    setEditingWorkerCell({ rowIndex, field })
  }

  const saveWorkerPopup = () => {
    if (!editingWorkerCell) return
    const { rowIndex, field } = editingWorkerCell
    if (isWorker && isWorkerCellLocked(lockedWorkerCells, rowIndex, field)) {
      setEditingWorkerCell(null)
      toast.showToast('This column is already saved and cannot be changed', 'warning')
      return
    }
    const lotRate = getLotRateForField(workerRates, field, workerProcesses)
    setProductionData(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row
      return {
        ...row,
        [`${field}Worker`]: popupWorker,
        [`${field}Date`]: isWorker ? today : popupDate,
        [`${field}Rate`]: popupWorker ? lotRate : '',
      }
    }))
    setEditingWorkerCell(null)
  }

  const persistJobCard = async (options?: { nextStatus?: JobCardStatus; successMessage?: string }) => {
    const productionToSave = applyLotRatesToProduction(productionData, workerRates, workerProcesses)
    const nextStatus = options?.nextStatus ?? deriveJobCardStatus(productionToSave, workerRates, workerProcesses)
    setProductionData(productionToSave)
    const result = await jobCardsAPI.updateJobCard(lotNumber, {
      lotNumber, date, brand, ratios,
      productionData: productionToSave.map(row => ({
        ...row,
        layer: Number(row.layer) || 1,
        pieces: Number(row.pieces) || 0,
        tukda: Number(row.tukda) || 0,
      })),
      flyWidth: additionalInfo.flyWidth, additionalInfo,
      workerRates,
      workerPrices: {},
      status: nextStatus,
    })
    if (result.success) {
      try {
        const lotResult = await lotsAPI.getLotByNumber(lotNumber)
        if (lotResult.success && lotResult.lot) {
          const { _id, ...lotWithoutId } = lotResult.lot
          await lotsAPI.updateLot(lotNumber, {
            ...lotWithoutId,
            flyWidth: additionalInfo.flyWidth,
            additionalInfo,
            workerRates,
          })
        }
      } catch (err) {
        console.error('Error syncing additional info to lot:', err)
      }
      setStatus(nextStatus)
      if (isWorker) setLockedWorkerCells(buildLockedWorkerCellKeys(productionToSave, workerRates, workerProcesses))
      toast.showToast(options?.successMessage || 'Job card updated successfully!', 'success')

      const stillEditable = isWorker
        ? canWorkerEditJobCard(nextStatus)
        : canAdminEditJobCard(nextStatus)
      if (!stillEditable) {
        router.push(`${jobCardBasePath}/${encodeURIComponent(lotNumber)}`)
      } else {
        router.replace(`${jobCardBasePath}/${encodeURIComponent(lotNumber)}?edit=true`)
      }
      return true
    }
    toast.showToast('Error updating job card: ' + result.error, 'error')
    return false
  }

  const handleSave = async () => {
    if (!lotNumber.trim()) { toast.showToast('Please enter a lot number', 'warning'); return }
    if (!canEdit) { toast.showToast('This job card cannot be edited', 'warning'); return }
    setSaving(true)
    try {
      const nextStatus = deriveJobCardStatus(productionData, workerRates, workerProcesses)
      const message = isWorker
        ? (nextStatus === 'complete'
          ? 'Job card completed!'
          : 'Job card saved successfully!')
        : 'Job card updated successfully!'
      await persistJobCard({ nextStatus, successMessage: message })
    } catch (err: any) {
      toast.showToast('Error saving job card: ' + err.message, 'error')
    } finally { setSaving(false) }
  }

  const handleExportPDF = () => {
    setGeneratingPDF(true)
    try {
      exportJobCardToPDF({ lotNumber, brand, date, ratios, productionData, flyWidth: additionalInfo.flyWidth, additionalInfo, workers, workerRates, workerProcesses })
    } catch (err: any) { toast.showToast('Error generating PDF: ' + err.message, 'error') }
    finally { setGeneratingPDF(false) }
  }

  const handleExportExcel = () => {
    setGeneratingExcel(true)
    try {
      exportJobCardToExcel({ lotNumber, brand, date, ratios, productionData, flyWidth: additionalInfo.flyWidth, additionalInfo, workers, workerRates, workerProcesses })
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
        ...(effectiveEditMode ? [{
          label: isWorker
            ? (workerFieldsComplete ? 'Complete Job Card' : 'Save Job Card')
            : 'Update Job Card',
          shortLabel: 'Save',
          icon: <IconSave size={14} />,
          onClick: handleSave,
          disabled: saving || !lotNumber,
          loading: saving,
          loadingLabel: 'Saving…',
        } as ActionBarItem] : []),
        ...(!isWorker ? [
          { label: 'Download PDF', shortLabel: 'PDF', icon: <IconPdf size={14} />, onClick: handleExportPDF, loading: generatingPDF, loadingLabel: '…' },
          { label: 'Download Excel', shortLabel: 'Excel', icon: <IconTable size={14} />, onClick: handleExportExcel, loading: generatingExcel, loadingLabel: '…' },
        ] : []),
        ...(!effectiveEditMode && canEdit ? [{ label: 'Edit Job Card', shortLabel: 'Edit', icon: <IconEdit size={14} />, onClick: () => router.push(`${jobCardBasePath}/${encodeURIComponent(lotNumber)}?edit=true`) } as ActionBarItem] : []),
        { label: 'Back to Job Cards', shortLabel: 'Back', icon: <IconBack size={14} />, onClick: () => router.push(jobCardsListPath), variant: 'secondary' as const },
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
              <span className={`btn-icon${refreshing ? ' spinning' : ''}`}><IconRefresh size={16} /></span>
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
              <div className="form-group">
                <label>Date</label>
                <input type="text" value={formatDisplayDate(date)} disabled style={{ background: '#f8f9fa', cursor: 'not-allowed' }} />
              </div>
            </div>
          </div>

          <JobCardRatios ratios={ratios} sumOfRatios={sumOfRatios} />
          {!isWorker && (
            <LotRatesForm workerRates={workerRates} processes={workerProcesses} isEditMode={false} onRateChange={() => {}} />
          )}
          <JobCardProductionTable
            productionData={productionData} workers={workers}
            isEditMode={effectiveEditMode} onOpenWorkerPopup={openWorkerPopup}
            hideRate={isWorker}
            workerRates={workerRates}
            processes={workerProcesses}
            isCellLocked={
              isWorker
                ? (rowIndex, field) => isWorkerCellLocked(lockedWorkerCells, rowIndex, field)
                : undefined
            }
          />
          <JobCardAdditionalInfo
            additionalInfo={additionalInfo} isEditMode={false}
            onAdditionalInfoChange={() => {}}
          />
        </div>
      </div>

      {editingWorkerCell && (
        <WorkerPopupModal
          field={editingWorkerCell.field} workers={workers}
          processes={workerProcesses}
          fieldLabel={workerProcesses.find((p) => (p.productionKey || p.key) === editingWorkerCell.field)?.label
            || editingWorkerCell.field}
          popupWorker={popupWorker} popupDate={popupDate} popupRate=""
          onWorkerChange={setPopupWorker} onDateChange={setPopupDate} onRateChange={() => {}}
          onSave={saveWorkerPopup} onCancel={() => setEditingWorkerCell(null)}
          hideRate
        />
      )}
    </>
  )
}
