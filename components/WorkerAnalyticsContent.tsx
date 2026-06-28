'use client'

import { useState, useEffect, useMemo } from 'react'
import { jobCardsAPI, workersAPI } from '@/lib/api'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import ActionBar from './ActionBar'
import AnalyticsFilters from './analytics/AnalyticsFilters'
import AnalyticsTable from './analytics/AnalyticsTable'
import { exportAnalyticsToPDF, exportAnalyticsToExcel } from './analytics/exportUtils'
import './dashboard.css'

type SectionType = 'Front' | 'Back' | 'Zip'

const SECTIONS: { key: SectionType; workerKey: string; dateKey: string; rateKey: string }[] = [
  { key: 'Front', workerKey: 'frontWorker', dateKey: 'frontDate', rateKey: 'frontRate' },
  { key: 'Back',  workerKey: 'backWorker',  dateKey: 'backDate',  rateKey: 'backRate'  },
  { key: 'Zip',   workerKey: 'zipWorker',   dateKey: 'zipDate',   rateKey: 'zipRate'   },
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

  const analyticsData = useMemo(() => {
    const rows: any[] = []
    jobCards.forEach((jobCard: any) => {
      if (!Array.isArray(jobCard.productionData)) return
      jobCard.productionData.forEach((row: any) => {
        const pieces = Number(row.pieces) || 0
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
    if (fromDate) filtered = filtered.filter((row) => row.date >= fromDate)
    if (toDate) filtered = filtered.filter((row) => row.date <= toDate)
    if (selectedWorker) {
      const worker = workers.find((w: any) => w._id === selectedWorker)
      if (worker) filtered = filtered.filter((row) => row.worker_id === worker.worker_id)
    }
    return filtered.sort((a, b) => a.date !== b.date ? b.date.localeCompare(a.date) : a.worker_id - b.worker_id)
  }, [analyticsData, fromDate, toDate, selectedWorker, workers])

  const totals = useMemo(() => filteredData.reduce(
    (acc, row) => ({ totalPieces: acc.totalPieces + row.pieces, totalAmount: acc.totalAmount + row.total_amount }),
    { totalPieces: 0, totalAmount: 0 }
  ), [filteredData])

  const exportParams = { filteredData, workers, fromDate, toDate, selectedWorker, totals }

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
            workers={workers} fromDate={fromDate} toDate={toDate} selectedWorker={selectedWorker}
            onFromDateChange={setFromDate} onToDateChange={setToDate} onWorkerChange={setSelectedWorker}
            onClearFilters={() => { setFromDate(''); setToDate(''); setSelectedWorker('') }}
          />
          <div className="card">
            <AnalyticsTable loading={loading} filteredData={filteredData} allCount={analyticsData.length} totals={totals} />
          </div>
        </div>
      </div>
    </>
  )
}
