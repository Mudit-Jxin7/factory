import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Ratios } from '@/lib/types'

interface ExportParams {
  lotNumber: string
  date: string
  fabric: string
  pattern: string
  brand: string
  ratios: Ratios
  sumOfRatios: number
  productionData: any[]
  tukda: { count: number; size: string }
  totalMeter: number
  totalPieces: number
  totalPiecesWithTukda: number
  average: number
}

export const exportLotToPDF = (params: ExportParams) => {
  const { lotNumber, date, fabric, pattern, brand, ratios, sumOfRatios, productionData, tukda, totalMeter, totalPieces, totalPiecesWithTukda, average } = params
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const margin = 10

  pdf.setFontSize(16); pdf.setFont('helvetica', 'bold')
  pdf.text('Lot Production', pageW / 2, 14, { align: 'center' })
  pdf.setFontSize(11)
  pdf.text('Lot Information', margin, 24)

  autoTable(pdf, {
    startY: 26, margin: { left: margin, right: margin },
    body: [
      ['Lot Number', lotNumber || '—', 'Date', date || '—'],
      ['Fabric', fabric || '—', 'Pattern', pattern || '—'],
      ['Brand', brand || '—', '', ''],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { fontStyle: 'bold', cellWidth: 35 } },
    theme: 'grid',
  })

  const afterInfo = (pdf as any).lastAutoTable.finalY + 6
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.text('Ratios', margin, afterInfo)
  autoTable(pdf, {
    startY: afterInfo + 2, margin: { left: margin, right: margin },
    head: [Object.keys(ratios).map(k => k.toUpperCase())],
    body: [Object.values(ratios).map(v => String(v))],
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    theme: 'grid',
  })

  const afterRatios = (pdf as any).lastAutoTable.finalY + 2
  pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
  pdf.text(`Sum of Ratios: ${sumOfRatios.toFixed(2)}`, margin, afterRatios + 4)

  const afterRatioSum = afterRatios + 10
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.text('Production Data', margin, afterRatioSum)
  autoTable(pdf, {
    startY: afterRatioSum + 2, margin: { left: margin, right: margin },
    head: [['S.No', 'Meter', 'Layer', 'Pieces', 'Color', 'Zip Code', 'Thread Code']],
    body: productionData.map(row => [
      row.serialNumber, row.meter || '0', row.layer,
      Number(row.pieces).toFixed(2), row.color || '—',
      row.zip_code || '—', row.thread_code || '—',
    ]),
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 247, 255] }, theme: 'grid',
  })

  const afterProd = (pdf as any).lastAutoTable.finalY + 6
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.text('Summary & Calculations', margin, afterProd)
  autoTable(pdf, {
    startY: afterProd + 2, margin: { left: margin, right: margin },
    head: [['# Tukda', 'Tukda Size', 'Total Meter', 'Total Pieces', 'Grand Total Pieces', 'Average']],
    body: [[tukda.count, tukda.size, totalMeter.toFixed(2), totalPieces.toFixed(2), totalPiecesWithTukda.toFixed(2), average.toFixed(4)]],
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }, theme: 'grid',
  })

  pdf.save(`Lot_${lotNumber || 'Production'}_${date || 'Report'}.pdf`)
}

export const exportLotToExcel = (params: ExportParams) => {
  const { lotNumber, date, fabric, pattern, brand, ratios, productionData, tukda, totalMeter, totalPieces, totalPiecesWithTukda, average } = params

  const infoRows = [
    ['Lot Number', lotNumber], ['Date', date], ['Fabric', fabric], ['Pattern', pattern], ['Brand', brand], [],
    ['Ratios'], Object.keys(ratios).map(k => k.toUpperCase()), Object.values(ratios).map(v => String(v)), [],
  ]
  const prodHeaders = ['S.No', 'Meter', 'Layer', 'Pieces', 'Color', 'Zip Code', 'Thread Code']
  const prodRows = productionData.map(row => [
    row.serialNumber, row.meter || '0', row.layer, Number(row.pieces).toFixed(2),
    row.color || '', row.zip_code || '', row.thread_code || '',
  ])
  const summaryRow = [tukda.count, tukda.size, totalMeter.toFixed(2), totalPieces.toFixed(2), totalPiecesWithTukda.toFixed(2), average.toFixed(4)]
  const allRows = [...infoRows, prodHeaders, ...prodRows, [], ['Summary'], ['# Tukda', 'Tukda Size', 'Total Meter', 'Total Pieces', 'Grand Total', 'Average'], summaryRow]

  const csvContent = allRows.map((row) =>
    (row as any[]).map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.setAttribute('href', URL.createObjectURL(blob))
  link.setAttribute('download', `Lot_${lotNumber || 'Production'}_${date || 'Report'}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
