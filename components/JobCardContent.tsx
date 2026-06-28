'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { jobCardsAPI, lotsAPI, workersAPI } from '@/lib/api'
import { JobCardProductionRow, Worker, Ratios, AdditionalInfo, DEFAULT_RATIOS, DEFAULT_ADDITIONAL_INFO } from '@/lib/types'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import ActionBar, { ActionBarItem } from './ActionBar'
import { WorkerField, DEFAULT_PRODUCTION_ROW } from './jobcard/constants'
import WorkerPopupModal from './jobcard/WorkerPopupModal'
import JobCardRatios from './jobcard/JobCardRatios'
import JobCardProductionTable from './jobcard/JobCardProductionTable'
import JobCardAdditionalInfo from './jobcard/JobCardAdditionalInfo'
import { exportJobCardToPDF } from './jobcard/exportToPDF'
import { exportJobCardToExcel } from './jobcard/exportToExcel'
import './dashboard.css'

interface JobCardContentProps {
  lotNumber: string
  isEdit?: boolean
}

export default function JobCardContent({ lotNumber: initialLotNumber, isEdit: initialIsEdit }: JobCardContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const isEditMode = initialIsEdit || searchParams?.get('edit') === 'true'
  const decodedLotNumber = initialLotNumber ? decodeURIComponent(initialLotNumber) : ''

  const [lotNumber, setLotNumber] = useState(decodedLotNumber)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [brand, setBrand] = useState('')
  const [workers, setWorkers] = useState<Worker[]>([])
  const [ratios, setRatios] = useState<Ratios>(DEFAULT_RATIOS)
  const [productionData, setProductionData] = useState<JobCardProductionRow[]>([{ serialNumber: 1, ...DEFAULT_PRODUCTION_ROW }])
  const [flyWidth, setFlyWidth] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>(DEFAULT_ADDITIONAL_INFO)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [generatingExcel, setGeneratingExcel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingWorkerCell, setEditingWorkerCell] = useState<{ rowIndex: number; field: WorkerField } | null>(null)
  const [popupWorker, setPopupWorker] = useState('')
  const [popupDate, setPopupDate] = useState('')
  const [popupRate, setPopupRate] = useState('')

  const sumOfRatios = useMemo(() => Object.values(ratios).reduce((sum, val) => sum + (Number(val) || 0), 0), [ratios])

  useEffect(() => { workersAPI.getAllWorkers().then(r => { if (r.success) setWorkers(r.workers || []) }) }, [])

  useEffect(() => {
    if (!lotNumber) return
    setLoading(true)
    jobCardsAPI.getJobCardByLotNumber(lotNumber).then((result) => {
      if (result.success && result.jobCard) {
        const jc = result.jobCard
        setDate(jc.date || '')
        setBrand(jc.brand || '')
        setRatios(jc.ratios || DEFAULT_RATIOS)
        setProductionData(jc.productionData || productionData)
        setFlyWidth(jc.flyWidth || '')
        setAdditionalInfo(jc.additionalInfo || DEFAULT_ADDITIONAL_INFO)
      } else {
        setError('Job card not found. Job cards are automatically created when a lot is saved.')
      }
      setLoading(false)
    }).catch((err) => { setError('Error loading job card: ' + err.message); setLoading(false) })
  }, [lotNumber])

  const openWorkerPopup = (rowIndex: number, field: WorkerField) => {
    const row = productionData[rowIndex]
    setPopupWorker(String((row as any)[`${field}Worker`] ?? ''))
    setPopupDate(String((row as any)[`${field}Date`] ?? ''))
    setPopupRate(String((row as any)[`${field}Rate`] ?? ''))
    setEditingWorkerCell({ rowIndex, field })
  }

  const saveWorkerPopup = () => {
    if (!editingWorkerCell) return
    const { rowIndex, field } = editingWorkerCell
    setProductionData(prev => prev.map((row, i) => i === rowIndex
      ? { ...row, [`${field}Worker`]: popupWorker, [`${field}Date`]: popupDate, [`${field}Rate`]: popupRate }
      : row
    ))
    setEditingWorkerCell(null)
  }

  const handleSave = async () => {
    if (!lotNumber.trim()) { toast.showToast('Please enter a lot number', 'warning'); return }
    setSaving(true)
    try {
      const result = await jobCardsAPI.updateJobCard(lotNumber, {
        lotNumber, date, brand, ratios,
        productionData: productionData.map(row => ({ ...row, layer: Number(row.layer) || 1, pieces: Number(row.pieces) || 0 })),
        flyWidth, additionalInfo,
      })
      if (result.success) {
        toast.showToast('Job card updated successfully!', 'success')
        router.push(`/jobcard/${encodeURIComponent(lotNumber)}?edit=true`)
      } else {
        toast.showToast('Error updating job card: ' + result.error, 'error')
      }
    } catch (err: any) {
      toast.showToast('Error saving job card: ' + err.message, 'error')
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
      <><NavigationBar />
        <div className="dashboard-container">
          <div className="loading-container"><div className="spinner" /><p>Loading job card&hellip;</p></div>
        </div>
      </>
    )
  }

  return (
    <>
      <NavigationBar />
      <ActionBar actions={[
        ...(isEditMode ? [{ label: 'Update Job Card', shortLabel: 'Save', icon: '💾', onClick: handleSave, disabled: saving || !lotNumber, loading: saving, loadingLabel: 'Saving…' } as ActionBarItem] : []),
        { label: 'Download PDF', shortLabel: 'PDF', icon: '📄', onClick: handleExportPDF, loading: generatingPDF, loadingLabel: '…' },
        { label: 'Download Excel', shortLabel: 'Excel', icon: '📊', onClick: handleExportExcel, loading: generatingExcel, loadingLabel: '…' },
        ...(!isEditMode ? [{ label: 'Edit Job Card', shortLabel: 'Edit', icon: '✏️', onClick: () => router.push(`/jobcard/${encodeURIComponent(lotNumber)}?edit=true`) } as ActionBarItem] : []),
        { label: 'Back to Job Cards', shortLabel: 'Back', icon: '←', onClick: () => router.push('/jobcards'), variant: 'secondary' as const },
      ]} />
      <div className="dashboard-container job-card-page">
        <div className="dashboard-header">
          <div className="header-title">
            <h1>{isEditMode ? 'Edit Job Card' : 'View Job Card'}</h1>
            <p>{isEditMode ? 'Edit' : 'View'} job card details for lot {lotNumber}</p>
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
            isEditMode={isEditMode} onOpenWorkerPopup={openWorkerPopup}
          />
          <JobCardAdditionalInfo
            flyWidth={flyWidth} additionalInfo={additionalInfo} isEditMode={isEditMode}
            onFlyWidthChange={setFlyWidth}
            onAdditionalInfoChange={(key, value) => setAdditionalInfo(prev => ({ ...prev, [key]: value }))}
          />
        </div>
      </div>

      {editingWorkerCell && (
        <WorkerPopupModal
          field={editingWorkerCell.field} workers={workers}
          popupWorker={popupWorker} popupDate={popupDate} popupRate={popupRate}
          onWorkerChange={setPopupWorker} onDateChange={setPopupDate} onRateChange={setPopupRate}
          onSave={saveWorkerPopup} onCancel={() => setEditingWorkerCell(null)}
        />
      )}
    </>
  )
}
