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
  const selectedWorkerObj = selectedWorker ? workers.find((w: any) => w._id === selectedWorker) : null
  if (selectedWorkerObj) filterParts.push(`Worker: ${selectedWorkerObj.worker_full_name}`)
  if (filterParts.length > 0) pdf.text(filterParts.join('   |   '), pageW / 2, 20, { align: 'center' })

  let tableStartY = filterParts.length > 0 ? 24 : 18

  // Worker detail block (only when a single worker is selected)
  if (selectedWorkerObj) {
    const detailLines: string[] = [
      `Worker ID: ${selectedWorkerObj.worker_id}   |   Name: ${selectedWorkerObj.worker_full_name}`,
    ]
    const tbdParts: string[] = []
    if (selectedWorkerObj.tbd1) tbdParts.push(`TBD1: ${selectedWorkerObj.tbd1}`)
    if (selectedWorkerObj.tbd2) tbdParts.push(`TBD2: ${selectedWorkerObj.tbd2}`)
    if (selectedWorkerObj.tbd3) tbdParts.push(`TBD3: ${selectedWorkerObj.tbd3}`)
    if (tbdParts.length > 0) detailLines.push(tbdParts.join('   |   '))

    pdf.setFillColor(230, 244, 255)
    const blockH = detailLines.length * 5 + 5
    pdf.rect(margin, tableStartY, pageW - margin * 2, blockH, 'F')
    pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold')
    detailLines.forEach((line, i) => {
      pdf.text(line, pageW / 2, tableStartY + 4 + i * 5, { align: 'center' })
    })
    pdf.setFont('helvetica', 'normal')
    tableStartY += blockH + 2
  }

  const head = [['Worker ID', 'Worker Name', 'Section', 'Date', 'Rate', 'Lot Number', 'Layer', 'Pieces', 'Total Amount']]
  const body: any[][] = filteredData.map(row => [row.worker_id, row.worker_full_name, row.section, row.date, row.rate.toFixed(2), row.lotNumber, row.layer, row.pieces.toFixed(2), row.total_amount.toFixed(2)])
  body.push(['', 'TOTAL', '', '', '', '', '', totals.totalPieces.toFixed(2), totals.totalAmount.toFixed(2)])

  autoTable(pdf, {
    startY: tableStartY, margin: { left: margin, right: margin },
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
  const selectedWorkerObj = selectedWorker ? workers.find((w: any) => w._id === selectedWorker) : null
  const selectedWorkerName = selectedWorkerObj?.worker_full_name || 'All Workers'

  const filterRows: string[][] = [
    ['From Date', fromDate || 'All'],
    ['To Date', toDate || 'All'],
    ['Worker', selectedWorkerName],
  ]

  if (selectedWorkerObj) {
    filterRows.push(['Worker ID', String(selectedWorkerObj.worker_id)])
    if (selectedWorkerObj.tbd1) filterRows.push(['TBD1', selectedWorkerObj.tbd1])
    if (selectedWorkerObj.tbd2) filterRows.push(['TBD2', selectedWorkerObj.tbd2])
    if (selectedWorkerObj.tbd3) filterRows.push(['TBD3', selectedWorkerObj.tbd3])
  }

  filterRows.push([])

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
