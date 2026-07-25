'use client'

import { useState, useEffect, useMemo } from 'react'
import { jobCardsAPI, workersAPI, workerProcessesAPI } from '@/lib/api'
import { WorkerProcess } from '@/lib/types'
import { getWorkerRole } from './jobcard/constants'
import { getProcessProductionKey, resolveWorkerProcesses, allWorkerProcesses } from '@/lib/workerProcesses'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import ActionBar from './ActionBar'
import { IconPdf, IconTable } from './Icons'
import AnalyticsFilters from './analytics/AnalyticsFilters'
import AnalyticsTable from './analytics/AnalyticsTable'
import { exportAnalyticsToPDF, exportAnalyticsToExcel } from './analytics/exportUtils'
import { aggregateAnalyticsRows } from '@/lib/analyticsAggregate'
import { todayISODateIST, toISODateIST } from '@/lib/dateFormat'
import './dashboard.css'

export default function WorkerAnalyticsContent() {
  const toast = useToast()
  const [jobCards, setJobCards] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [processes, setProcesses] = useState<WorkerProcess[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [generatingExcel, setGeneratingExcel] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedWorker, setSelectedWorker] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [lotNumber, setLotNumber] = useState('')
  const [appliedFromDate, setAppliedFromDate] = useState('')
  const [appliedToDate, setAppliedToDate] = useState('')
  const [appliedWorker, setAppliedWorker] = useState('')
  const [appliedRole, setAppliedRole] = useState('')
  const [appliedLotNumber, setAppliedLotNumber] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [jcResult, wResult, pResult] = await Promise.all([
          jobCardsAPI.getAllJobCards(),
          workersAPI.getAllWorkers(),
          workerProcessesAPI.getAllProcesses(),
        ])
        if (jcResult.success) setJobCards(jcResult.jobCards || [])
        else toast.showToast('Error fetching job cards: ' + jcResult.error, 'error')
        if (wResult.success) setWorkers(wResult.workers || [])
        else toast.showToast('Error fetching workers: ' + wResult.error, 'error')
        if (pResult.success) setProcesses(pResult.processes || [])
      } catch (error: any) {
        toast.showToast('Error fetching data: ' + error.message, 'error')
      } finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const resolvedProcesses = useMemo(
    () => (processes.length > 0 ? allWorkerProcesses(processes) : resolveWorkerProcesses(processes)),
    [processes],
  )
  const roleOptions = useMemo(() => resolvedProcesses.map((p) => p.label), [resolvedProcesses])
  const roleCodes = useMemo(() => new Set(resolvedProcesses.map((p) => p.roleCode)), [resolvedProcesses])

  const sections = useMemo(
    () => resolvedProcesses.map((p) => {
      const field = getProcessProductionKey(p)
      return {
        key: p.label,
        workerKey: `${field}Worker`,
        dateKey: `${field}Date`,
        rateKey: `${field}Rate`,
      }
    }),
    [resolvedProcesses],
  )

  const eligibleWorkers = useMemo(
    () => workers.filter((w) => roleCodes.has(getWorkerRole(w))),
    [workers, roleCodes],
  )

  const analyticsData = useMemo(() => {
    const rows: any[] = []
    jobCards.forEach((jobCard: any) => {
      if (!Array.isArray(jobCard.productionData)) return
      jobCard.productionData.forEach((row: any) => {
        const pieces = (Number(row.pieces) || 0) + (Number(row.tukda) || 0)
        const layer = Number(row.layer) || 0
        sections.forEach(({ key, workerKey, dateKey, rateKey }) => {
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
  }, [jobCards, workers, sections])

  const lotOptions = useMemo(() => {
    const lots = new Set<string>()
    analyticsData.forEach((row) => {
      const lot = String(row.lotNumber || '').trim()
      if (lot) lots.add(lot)
    })
    return Array.from(lots).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }))
  }, [analyticsData])

  const filteredData = useMemo(() => {
    let filtered = [...analyticsData]
    if (appliedFromDate) filtered = filtered.filter((row) => row.date >= appliedFromDate)
    if (appliedToDate) filtered = filtered.filter((row) => row.date <= appliedToDate)
    if (appliedWorker) {
      const worker = workers.find((w: any) => w._id === appliedWorker)
      if (worker) filtered = filtered.filter((row) => row.worker_id === worker.worker_id)
    }
    if (appliedRole) filtered = filtered.filter((row) => row.section === appliedRole)
    if (appliedLotNumber.trim()) {
      const q = appliedLotNumber.trim().toLowerCase()
      filtered = filtered.filter((row) => row.lotNumber?.toLowerCase().includes(q))
    }
    const aggregated = aggregateAnalyticsRows(filtered)
    return aggregated.sort((a, b) => a.date !== b.date ? b.date.localeCompare(a.date) : a.worker_id - b.worker_id)
  }, [analyticsData, appliedFromDate, appliedToDate, appliedWorker, appliedRole, appliedLotNumber, workers])

  const handleApplyFilters = () => {
    setAppliedFromDate(fromDate)
    setAppliedToDate(toDate)
    setAppliedWorker(selectedWorker)
    setAppliedRole(selectedRole)
    setAppliedLotNumber(lotNumber)
  }

  const handleDateRangePreset = (days: number) => {
    const to = todayISODateIST()
    const toMs = Date.parse(`${to}T12:00:00+05:30`)
    const fromMs = toMs - (days - 1) * 24 * 60 * 60 * 1000
    setFromDate(toISODateIST(new Date(fromMs)))
    setToDate(to)
  }

  const handleClearFilters = () => {
    setFromDate('')
    setToDate('')
    setSelectedWorker('')
    setSelectedRole('')
    setLotNumber('')
    setAppliedFromDate('')
    setAppliedToDate('')
    setAppliedWorker('')
    setAppliedRole('')
    setAppliedLotNumber('')
  }

  const totals = useMemo(() => filteredData.reduce(
    (acc, row) => ({ totalPieces: acc.totalPieces + row.pieces, totalAmount: acc.totalAmount + row.total_amount }),
    { totalPieces: 0, totalAmount: 0 }
  ), [filteredData])

  const exportParams = {
    filteredData, workers,
    fromDate: appliedFromDate, toDate: appliedToDate,
    selectedWorker: appliedWorker, selectedRole: appliedRole,
    lotNumber: appliedLotNumber, totals,
  }

  return (
    <>
      <NavigationBar />
      <ActionBar actions={[
        { label: 'Download PDF', shortLabel: 'PDF', icon: <IconPdf size={14} />, loading: generatingPDF, loadingLabel: '…', disabled: filteredData.length === 0, onClick: () => { setGeneratingPDF(true); try { exportAnalyticsToPDF(exportParams); toast.showToast('PDF exported!', 'success') } catch (e: any) { toast.showToast('Error: ' + e.message, 'error') } finally { setGeneratingPDF(false) } } },
        { label: 'Download Excel', shortLabel: 'Excel', icon: <IconTable size={14} />, loading: generatingExcel, loadingLabel: '…', disabled: filteredData.length === 0, onClick: () => { setGeneratingExcel(true); try { exportAnalyticsToExcel(exportParams); toast.showToast('Excel exported!', 'success') } catch (e: any) { toast.showToast('Error: ' + e.message, 'error') } finally { setGeneratingExcel(false) } } },
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
            workers={eligibleWorkers} lotOptions={lotOptions}
            roleOptions={roleOptions}
            fromDate={fromDate} toDate={toDate}
            selectedWorker={selectedWorker} selectedRole={selectedRole} lotNumber={lotNumber}
            onFromDateChange={setFromDate} onToDateChange={setToDate}
            onWorkerChange={setSelectedWorker} onRoleChange={setSelectedRole}
            onLotNumberChange={setLotNumber}
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
