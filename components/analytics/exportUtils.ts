import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface AnalyticsRow {
  worker_id: number
  worker_full_name: string
  section: string
  date: string
  rate: number
  lotNumber: string
  layer: number
  pieces: number
  total_amount: number
}

interface ExportParams {
  filteredData: AnalyticsRow[]
  workers: any[]
  fromDate: string
  toDate: string
  selectedWorker: string
  totals: { totalPieces: number; totalAmount: number }
}

const getFilename = (base: string, { fromDate, toDate, selectedWorker, workers }: Pick<ExportParams, 'fromDate' | 'toDate' | 'selectedWorker' | 'workers'>) => {
  const dateRange = fromDate && toDate ? `_${fromDate}_to_${toDate}` : ''
  const workerSuffix = selectedWorker ? `_${workers.find((w: any) => w._id === selectedWorker)?.worker_full_name || 'worker'}` : ''
  return `${base}${dateRange}${workerSuffix}`
}

export const exportAnalyticsToPDF = (params: ExportParams) => {
  const { filteredData, workers, fromDate, toDate, selectedWorker, totals } = params
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const margin = 10

  pdf.setFontSize(16); pdf.setFont('helvetica', 'bold')
  pdf.text('Worker Analytics', pageW / 2, 14, { align: 'center' })

  pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
  const filterParts: string[] = []
  if (fromDate) filterParts.push(`From: ${fromDate}`)
  if (toDate) filterParts.push(`To: ${toDate}`)
  if (selectedWorker) {
    const w = workers.find((w: any) => w._id === selectedWorker)
    if (w) filterParts.push(`Worker: ${w.worker_full_name}`)
  }
  if (filterParts.length > 0) pdf.text(filterParts.join('   |   '), pageW / 2, 20, { align: 'center' })

  const head = [['Worker ID', 'Worker Name', 'Section', 'Date', 'Rate', 'Lot Number', 'Layer', 'Pieces', 'Total Amount']]
  const body: any[][] = filteredData.map(row => [row.worker_id, row.worker_full_name, row.section, row.date, row.rate.toFixed(2), row.lotNumber, row.layer, row.pieces.toFixed(2), row.total_amount.toFixed(2)])
  body.push(['', 'TOTAL', '', '', '', '', '', totals.totalPieces.toFixed(2), totals.totalAmount.toFixed(2)])

  autoTable(pdf, {
    startY: filterParts.length > 0 ? 24 : 18, margin: { left: margin, right: margin },
    head, body,
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 247, 255] },
    didParseCell: (data) => {
      if (data.row.index === body.length - 1) { data.cell.styles.fontStyle = 'bold'; data.cell.styles.fillColor = [255, 249, 230] }
    },
    theme: 'grid',
  })

  pdf.save(`${getFilename('WorkerAnalytics', params)}.pdf`)
}

export const exportAnalyticsToExcel = (params: ExportParams) => {
  const { filteredData, workers, fromDate, toDate, selectedWorker, totals } = params
  const selectedWorkerName = selectedWorker ? workers.find((w: any) => w._id === selectedWorker)?.worker_full_name || '' : 'All Workers'

  const filterRows = [['From Date', fromDate || 'All'], ['To Date', toDate || 'All'], ['Worker', selectedWorkerName], []]
  const headers = ['Worker ID', 'Worker Name', 'Front / Back / Zip', 'Date', 'Rate', 'Lot Number', 'Layer', 'Pieces', 'Total Amount']
  const rows = filteredData.map((row) => [row.worker_id.toString(), row.worker_full_name, row.section, row.date, row.rate.toString(), row.lotNumber, row.layer.toString(), row.pieces.toString(), row.total_amount.toFixed(2)])
  rows.push(['', 'TOTAL', '', '', '', '', '', totals.totalPieces.toFixed(2), totals.totalAmount.toFixed(2)])

  const csvContent = [...filterRows.map((r) => r.map((cell) => `"${cell}"`).join(',')), headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.setAttribute('href', URL.createObjectURL(blob))
  link.setAttribute('download', `${getFilename('WorkerAnalytics', params)}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
