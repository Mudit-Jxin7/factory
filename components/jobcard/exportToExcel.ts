import { Ratios, AdditionalInfo, JobCardProductionRow, Worker, LotWorkerRates } from '@/lib/types'
import { getAdditionalInfoExportRows } from '@/lib/additionalInfoExport'
import { formatDisplayDate } from '@/lib/dateFormat'
import { formatIndianAmount } from '@/lib/indianNumberFormat'
import { WORKER_META, getActiveWorkerPairs } from './constants'

const getWorkerName = (workerId: string, workers: Worker[]) => {
  if (!workerId) return ''
  const w = workers.find((x) => x._id === workerId)
  return w ? (w.worker_full_name || String(w.worker_id)) : ''
}

export const exportJobCardToExcel = (params: {
  lotNumber: string
  brand: string
  date: string
  ratios: Ratios
  productionData: JobCardProductionRow[]
  flyWidth: string
  additionalInfo: AdditionalInfo
  workers: Worker[]
  workerRates?: LotWorkerRates | null
}) => {
  const { lotNumber, brand, date, ratios, productionData, flyWidth, additionalInfo, workers, workerRates } = params
  const workerPairs = getActiveWorkerPairs(workerRates ?? {})
  const displayDate = formatDisplayDate(date)

  const infoRows = [
    ['Lot Number', lotNumber], ['Brand', brand], ['Date', displayDate], [],
    ['Ratios'],
    Object.keys(ratios).map(k => k.toUpperCase()),
    Object.values(ratios).map(v => String(v)), [],
  ]

  const prodRows: any[][] = []
  productionData.forEach((row, idx) => {
    prodRows.push(['S.No', 'Layer', 'Total Pieces', 'Color', 'Zip Code', 'Thread Code'])
    prodRows.push([
      row.serialNumber,
      row.layer,
      `${(Number(row.pieces) || 0) + (Number(row.tukda) || 0)} (${Number(row.pieces) || 0} + ${Number(row.tukda) || 0})`,
      row.color || '',
      row.zip_code || '',
      row.thread_code || '',
    ])
    prodRows.push([])

    workerPairs.forEach(([w1, w2], pIdx) => {
      const m1 = WORKER_META[w1]
      const m2 = w2 ? WORKER_META[w2] : null
      prodRows.push([
        `${w1} Worker`, `${w1} Date`, `${w1} Rate`,
        w2 ? `${w2} Worker` : '', w2 ? `${w2} Date` : '', w2 ? `${w2} Rate` : '',
      ])
      prodRows.push([
        getWorkerName((row as any)[m1.workerKey] ?? '', workers) || '',
        formatDisplayDate((row as any)[m1.dateKey] || ''), formatIndianAmount((row as any)[m1.rateKey] || ''),
        m2 ? getWorkerName((row as any)[m2.workerKey] ?? '', workers) || '' : '',
        m2 ? formatDisplayDate((row as any)[m2.dateKey] || '') : '',
        m2 ? formatIndianAmount((row as any)[m2.rateKey] || '') : '',
      ])
      if (pIdx < workerPairs.length - 1) prodRows.push([])
    })

    if (idx < productionData.length - 1) { prodRows.push([]); prodRows.push([]) }
  })

  const addlRows = getAdditionalInfoExportRows(flyWidth, additionalInfo)
  const allRows = [
    ...infoRows,
    ...prodRows,
    ...(addlRows.length > 0 ? [[], ['Additional Information'], ['Field', 'Value'], ...addlRows] : []),
  ]

  const csvContent = allRows.map((row) =>
    (row as any[]).map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.setAttribute('href', URL.createObjectURL(blob))
  link.setAttribute('download', `JobCard_${lotNumber || 'Production'}_${displayDate || 'Report'}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
