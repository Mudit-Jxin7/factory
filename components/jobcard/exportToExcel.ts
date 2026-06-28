import { Ratios, AdditionalInfo, JobCardProductionRow, Worker } from '@/lib/types'
import { WORKER_PAIRS, WORKER_META } from './constants'

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
}) => {
  const { lotNumber, brand, date, ratios, productionData, flyWidth, additionalInfo, workers } = params

  const infoRows = [
    ['Lot Number', lotNumber], ['Brand', brand], ['Date', date], [],
    ['Ratios'],
    Object.keys(ratios).map(k => k.toUpperCase()),
    Object.values(ratios).map(v => String(v)), [],
  ]

  const prodRows: any[][] = []
  productionData.forEach((row, idx) => {
    prodRows.push(['S.No', 'Layer', 'Pieces', 'Color', 'Zip Code', 'Thread Code'])
    prodRows.push([row.serialNumber, row.layer, row.pieces, row.color || '', row.zip_code || '', row.thread_code || ''])
    prodRows.push([])

    WORKER_PAIRS.forEach(([w1, w2], pIdx) => {
      const m1 = WORKER_META[w1]
      const m2 = w2 ? WORKER_META[w2] : null
      prodRows.push([
        `${w1} Worker`, `${w1} Date`, `${w1} Rate`,
        w2 ? `${w2} Worker` : '', w2 ? `${w2} Date` : '', w2 ? `${w2} Rate` : '',
      ])
      prodRows.push([
        getWorkerName((row as any)[m1.workerKey] ?? '', workers) || '',
        (row as any)[m1.dateKey] || '', (row as any)[m1.rateKey] || '',
        m2 ? getWorkerName((row as any)[m2.workerKey] ?? '', workers) || '' : '',
        m2 ? (row as any)[m2.dateKey] || '' : '',
        m2 ? (row as any)[m2.rateKey] || '' : '',
      ])
      if (pIdx < WORKER_PAIRS.length - 1) prodRows.push([])
    })

    if (idx < productionData.length - 1) { prodRows.push([]); prodRows.push([]) }
  })

  const addlRows = [
    ['Fly Width', flyWidth],
    ...Object.entries(additionalInfo).map(([k, v]) => [
      k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()), v
    ])
  ]

  const allRows = [...infoRows, ...prodRows, [], ['Additional Information'], ['Field', 'Value'], ...addlRows]

  const csvContent = allRows.map((row) =>
    (row as any[]).map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.setAttribute('href', URL.createObjectURL(blob))
  link.setAttribute('download', `JobCard_${lotNumber || 'Production'}_${date || 'Report'}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
