'use client'

import { useState, useEffect, useMemo } from 'react'
import { jobCardsAPI, workersAPI } from '@/lib/api'
import { WORKER_ROLES } from '@/lib/types'
import { getWorkerRole } from './jobcard/constants'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import ActionBar from './ActionBar'
import AnalyticsFilters from './analytics/AnalyticsFilters'
import AnalyticsTable from './analytics/AnalyticsTable'
import { exportAnalyticsToPDF, exportAnalyticsToExcel } from './analytics/exportUtils'
import { aggregateAnalyticsRows } from '@/lib/analyticsAggregate'
import './dashboard.css'

type SectionType = 'Front' | 'Back' | 'Zip' | 'Astar' | 'Belt'

const SECTIONS: { key: SectionType; workerKey: string; dateKey: string; rateKey: string }[] = [
  { key: 'Front', workerKey: 'frontWorker', dateKey: 'frontDate', rateKey: 'frontRate' },
  { key: 'Back',  workerKey: 'backWorker',  dateKey: 'backDate',  rateKey: 'backRate'  },
  { key: 'Zip',   workerKey: 'zipWorker',   dateKey: 'zipDate',   rateKey: 'zipRate'   },
  { key: 'Astar', workerKey: 'astarWorker', dateKey: 'astarDate', rateKey: 'astarRate' },
  { key: 'Belt',  workerKey: 'beltProdWorker', dateKey: 'beltProdDate', rateKey: 'beltProdRate' },
]

export default function WorkerAnalyticsContent() {
  const toast = useToast()
  const [jobCards, setJobCards] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [generatingExcel, setGeneratingExcel] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedWorker, setSelectedWorker] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [appliedFromDate, setAppliedFromDate] = useState('')
  const [appliedToDate, setAppliedToDate] = useState('')
  const [appliedWorker, setAppliedWorker] = useState('')
  const [appliedRole, setAppliedRole] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [jcResult, wResult] = await Promise.all([jobCardsAPI.getAllJobCards(), workersAPI.getAllWorkers()])
        if (jcResult.success) setJobCards(jcResult.jobCards || [])
        else toast.showToast('Error fetching job cards: ' + jcResult.error, 'error')
        if (wResult.success) setWorkers(wResult.workers || [])
        else toast.showToast('Error fetching workers: ' + wResult.error, 'error')
      } catch (error: any) {
        toast.showToast('Error fetching data: ' + error.message, 'error')
      } finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const eligibleWorkers = useMemo(
    () => workers.filter((w) => WORKER_ROLES.includes(getWorkerRole(w) as typeof WORKER_ROLES[number])),
    [workers],
  )

  const analyticsData = useMemo(() => {
    const rows: any[] = []
    jobCards.forEach((jobCard: any) => {
      if (!Array.isArray(jobCard.productionData)) return
      jobCard.productionData.forEach((row: any) => {
        const pieces = (Number(row.pieces) || 0) + (Number(row.tukda) || 0)
        const layer = Number(row.layer) || 0
        SECTIONS.forEach(({ key, workerKey, dateKey, rateKey }) => {
          const workerId = row[workerKey]
          const date = row[dateKey]
          const rateVal = row[rateKey]
          if (!workerId || !date || rateVal === undefined || rateVal === null || rateVal === '') return
          const worker = workers.find((w: any) => w._id === workerId)
          if (!worker) return
          const rate = Number(rateVal) || 0
          rows.push({
            worker_id: worker.worker_id, worker_name: worker.worker_full_name,
            worker_full_name: worker.worker_full_name, section: key,
            date: String(date).split('T')[0], rate, lotNumber: jobCard.lotNumber || '',
            layer, pieces, total_amount: pieces * rate,
          })
        })
      })
    })
    return rows
  }, [jobCards, workers])

  const filteredData = useMemo(() => {
    let filtered = [...analyticsData]
    if (appliedFromDate) filtered = filtered.filter((row) => row.date >= appliedFromDate)
    if (appliedToDate) filtered = filtered.filter((row) => row.date <= appliedToDate)
    if (appliedWorker) {
      const worker = workers.find((w: any) => w._id === appliedWorker)
      if (worker) filtered = filtered.filter((row) => row.worker_id === worker.worker_id)
    }
    if (appliedRole) filtered = filtered.filter((row) => row.section === appliedRole)
    const aggregated = aggregateAnalyticsRows(filtered)
    return aggregated.sort((a, b) => a.date !== b.date ? b.date.localeCompare(a.date) : a.worker_id - b.worker_id)
  }, [analyticsData, appliedFromDate, appliedToDate, appliedWorker, appliedRole, workers])

  const handleApplyFilters = () => {
    setAppliedFromDate(fromDate)
    setAppliedToDate(toDate)
    setAppliedWorker(selectedWorker)
    setAppliedRole(selectedRole)
  }

  const handleDateRangePreset = (days: number) => {
    const to = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - (days - 1))
    const formatLocal = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    setFromDate(formatLocal(from))
    setToDate(formatLocal(to))
  }

  const handleClearFilters = () => {
    setFromDate('')
    setToDate('')
    setSelectedWorker('')
    setSelectedRole('')
    setAppliedFromDate('')
    setAppliedToDate('')
    setAppliedWorker('')
    setAppliedRole('')
  }

  const totals = useMemo(() => filteredData.reduce(
    (acc, row) => ({ totalPieces: acc.totalPieces + row.pieces, totalAmount: acc.totalAmount + row.total_amount }),
    { totalPieces: 0, totalAmount: 0 }
  ), [filteredData])

  const exportParams = {
    filteredData, workers,
    fromDate: appliedFromDate, toDate: appliedToDate,
    selectedWorker: appliedWorker, selectedRole: appliedRole, totals,
  }

  return (
    <>
      <NavigationBar />
      <ActionBar actions={[
        { label: 'Download PDF', shortLabel: 'PDF', icon: '📄', loading: generatingPDF, loadingLabel: '…', disabled: filteredData.length === 0, onClick: () => { setGeneratingPDF(true); try { exportAnalyticsToPDF(exportParams); toast.showToast('PDF exported!', 'success') } catch (e: any) { toast.showToast('Error: ' + e.message, 'error') } finally { setGeneratingPDF(false) } } },
        { label: 'Download Excel', shortLabel: 'Excel', icon: '📊', loading: generatingExcel, loadingLabel: '…', disabled: filteredData.length === 0, onClick: () => { setGeneratingExcel(true); try { exportAnalyticsToExcel(exportParams); toast.showToast('Excel exported!', 'success') } catch (e: any) { toast.showToast('Error: ' + e.message, 'error') } finally { setGeneratingExcel(false) } } },
      ]} />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-title">
            <h1>Worker Analytics</h1>
            <p>Analyze worker performance and earnings</p>
          </div>
        </div>
        <div className="dashboard-content">
          <AnalyticsFilters
            workers={eligibleWorkers} fromDate={fromDate} toDate={toDate}
            selectedWorker={selectedWorker} selectedRole={selectedRole}
            onFromDateChange={setFromDate} onToDateChange={setToDate}
            onWorkerChange={setSelectedWorker} onRoleChange={setSelectedRole}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            onDateRangePreset={handleDateRangePreset}
          />
          <div className="card">
            <AnalyticsTable loading={loading} filteredData={filteredData} allCount={analyticsData.length} totals={totals} />
          </div>
        </div>
      </div>
    </>
  )
}
