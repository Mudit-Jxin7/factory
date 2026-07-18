import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDisplayDate } from '@/lib/dateFormat'
import { formatIndianAmount } from '@/lib/indianNumberFormat'

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
  selectedRole?: string
  totals: { totalPieces: number; totalAmount: number }
}

interface WorkerGroup {
  worker_id: number
  worker_full_name: string
  rows: AnalyticsRow[]
  totalPieces: number
  totalAmount: number
}

const TABLE_HEAD = [['Section', 'Date', 'Rate', 'Lot Number', 'Layer', 'Total Pieces', 'Total Amount']]

const getFilename = (base: string, { fromDate, toDate, selectedWorker, selectedRole, workers }: Pick<ExportParams, 'fromDate' | 'toDate' | 'selectedWorker' | 'selectedRole' | 'workers'>) => {
  const dateRange = fromDate && toDate ? `_${formatDisplayDate(fromDate)}_to_${formatDisplayDate(toDate)}` : ''
  const workerSuffix = selectedWorker ? `_${workers.find((w: any) => w._id === selectedWorker)?.worker_full_name || 'worker'}` : ''
  const roleSuffix = selectedRole ? `_${selectedRole}` : ''
  return `${base}${dateRange}${workerSuffix}${roleSuffix}`
}

const groupRowsByWorker = (filteredData: AnalyticsRow[]): WorkerGroup[] => {
  const map = new Map<number, WorkerGroup>()
  filteredData.forEach((row) => {
    const existing = map.get(row.worker_id)
    if (!existing) {
      map.set(row.worker_id, {
        worker_id: row.worker_id,
        worker_full_name: row.worker_full_name,
        rows: [row],
        totalPieces: row.pieces,
        totalAmount: row.total_amount,
      })
      return
    }
    existing.rows.push(row)
    existing.totalPieces += row.pieces
    existing.totalAmount += row.total_amount
  })
  return [...map.values()].sort((a, b) => a.worker_id - b.worker_id)
}

const buildWorkerTableBody = (group: WorkerGroup) => {
  const body: (string | number)[][] = group.rows.map((row) => [
    row.section,
    formatDisplayDate(row.date),
    formatIndianAmount(row.rate),
    row.lotNumber,
    row.layer,
    row.pieces.toFixed(2),
    formatIndianAmount(row.total_amount),
  ])
  body.push(['', '', '', '', 'TOTAL', group.totalPieces.toFixed(2), formatIndianAmount(group.totalAmount)])
  return body
}

export const exportAnalyticsToPDF = (params: ExportParams) => {
  const { filteredData, workers, fromDate, toDate, selectedWorker, selectedRole, totals } = params
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 10

  pdf.setFontSize(16); pdf.setFont('helvetica', 'bold')
  pdf.text('Worker Analytics', pageW / 2, 14, { align: 'center' })

  pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
  const filterParts: string[] = []
  if (fromDate) filterParts.push(`From: ${formatDisplayDate(fromDate)}`)
  if (toDate) filterParts.push(`To: ${formatDisplayDate(toDate)}`)
  const selectedWorkerObj = selectedWorker ? workers.find((w: any) => w._id === selectedWorker) : null
  if (selectedWorkerObj) filterParts.push(`Worker: ${selectedWorkerObj.worker_full_name}`)
  if (selectedRole) filterParts.push(`Role: ${selectedRole}`)
  if (filterParts.length > 0) pdf.text(filterParts.join('   |   '), pageW / 2, 20, { align: 'center' })

  let cursorY = filterParts.length > 0 ? 26 : 20
  const groups = groupRowsByWorker(filteredData)

  if (groups.length === 0) {
    pdf.setFontSize(11)
    pdf.text('No data found matching the filters', pageW / 2, cursorY + 10, { align: 'center' })
    pdf.save(`${getFilename('WorkerAnalytics', params)}.pdf`)
    return
  }

  groups.forEach((group, index) => {
    if (cursorY > pageH - 40) {
      pdf.addPage()
      cursorY = 16
    }

    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
    pdf.text(`Worker ID: ${group.worker_id}  —  ${group.worker_full_name}`, margin, cursorY)
    cursorY += 3

    const body = buildWorkerTableBody(group)
    autoTable(pdf, {
      startY: cursorY, margin: { left: margin, right: margin },
      head: TABLE_HEAD,
      body,
      styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 247, 255] },
      didParseCell: (data) => {
        if (data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [255, 249, 230]
        }
      },
      theme: 'grid',
    })

    cursorY = ((pdf as any).lastAutoTable?.finalY ?? cursorY + 30) + (index < groups.length - 1 ? 10 : 8)
  })

  if (cursorY > pageH - 20) {
    pdf.addPage()
    cursorY = 16
  }
  pdf.setFontSize(10); pdf.setFont('helvetica', 'bold')
  pdf.text(
    `Grand Total — Pieces: ${totals.totalPieces.toFixed(2)}   |   Amount: ${formatIndianAmount(totals.totalAmount)}`,
    margin,
    cursorY + 4,
  )

  pdf.save(`${getFilename('WorkerAnalytics', params)}.pdf`)
}

export const exportAnalyticsToExcel = (params: ExportParams) => {
  const { filteredData, workers, fromDate, toDate, selectedWorker, selectedRole, totals } = params
  const selectedWorkerObj = selectedWorker ? workers.find((w: any) => w._id === selectedWorker) : null
  const selectedWorkerName = selectedWorkerObj?.worker_full_name || 'All Workers'

  const filterRows: string[][] = [
    ['From Date', fromDate ? formatDisplayDate(fromDate) : 'All'],
    ['To Date', toDate ? formatDisplayDate(toDate) : 'All'],
    ['Worker', selectedWorkerName],
    ['Role', selectedRole || 'All'],
    [],
  ]

  const groups = groupRowsByWorker(filteredData)
  const dataRows: string[][] = []

  groups.forEach((group, index) => {
    if (index > 0) dataRows.push([])
    dataRows.push([`Worker ID: ${group.worker_id}`, group.worker_full_name])
    dataRows.push(['Section', 'Date', 'Rate', 'Lot Number', 'Layer', 'Total Pieces', 'Total Amount'])
    group.rows.forEach((row) => {
      dataRows.push([
        row.section,
        formatDisplayDate(row.date),
        formatIndianAmount(row.rate),
        row.lotNumber,
        String(row.layer),
        row.pieces.toFixed(2),
        formatIndianAmount(row.total_amount),
      ])
    })
    dataRows.push(['', '', '', '', 'TOTAL', group.totalPieces.toFixed(2), formatIndianAmount(group.totalAmount)])
  })

  dataRows.push([])
  dataRows.push(['', '', '', '', 'GRAND TOTAL', totals.totalPieces.toFixed(2), formatIndianAmount(totals.totalAmount)])

  const csvContent = [...filterRows, ...dataRows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.setAttribute('href', URL.createObjectURL(blob))
  link.setAttribute('download', `${getFilename('WorkerAnalytics', params)}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
