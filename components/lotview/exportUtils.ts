import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Ratios, DEFAULT_RATIOS } from '@/lib/types'
import { buildAdditionalInfoPdfBody, getAdditionalInfoExportRows } from '@/lib/additionalInfoExport'
import { aggregatePiecesByColor } from '@/lib/colorPieces'
import { formatDisplayDate, formatDisplayDateTime } from '@/lib/dateFormat'

const ratioKeys = Object.keys(DEFAULT_RATIOS) as (keyof Ratios)[]

export const exportLotViewToPDF = (lot: any) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const margin = 10
  const productionData = lot.productionData || []
  const ratios: Ratios = { ...DEFAULT_RATIOS, ...(lot.ratios || {}) }
  const sumOfRatios = ratioKeys.reduce((sum, k) => sum + (Number(ratios[k]) || 0), 0)
  const totalTukda = productionData.reduce((sum: number, row: any) => sum + (Number(row.tukda) || 0), 0)
  const tukdaCount = totalTukda || Number(lot.tukda?.count || 0)
  const tukdaSize = lot.tukda?.size || '—'
  const totalMeter = Number(lot.totalMeter || 0)
  const totalPieces = Number(lot.totalPieces || 0)
  const totalPiecesWithTukda = Number(lot.totalPiecesWithTukda ?? (totalPieces + tukdaCount))
  const average = Number(lot.average || 0)

  pdf.setFontSize(16); pdf.setFont('helvetica', 'bold')
  pdf.text(`Lot Details: ${lot.lotNumber}`, pageW / 2, 14, { align: 'center' })
  pdf.setFontSize(11)
  pdf.text('Lot Information', margin, 24)

  autoTable(pdf, {
    startY: 26, margin: { left: margin, right: margin },
    body: [
      ['Lot Number', lot.lotNumber || 'N/A', 'Date', formatDisplayDate(lot.date, 'N/A')],
      ['Fabric', lot.fabric || 'N/A', 'Pattern', lot.pattern || 'N/A'],
      ['Brand', lot.brand || 'N/A', 'Created At', lot.createdAt ? formatDisplayDateTime(lot.createdAt, 'N/A') : 'N/A'],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { fontStyle: 'bold', cellWidth: 35 } },
    theme: 'grid',
  })

  let y = (pdf as any).lastAutoTable.finalY + 6
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.text('Ratios', margin, y)
  autoTable(pdf, {
    startY: y + 2, margin: { left: margin, right: margin },
    head: [[...ratioKeys.map(k => k.toUpperCase()), 'SUM']],
    body: [[...ratioKeys.map(k => String(ratios[k] ?? 0)), sumOfRatios.toFixed(2)]],
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    theme: 'grid',
  })

  y = (pdf as any).lastAutoTable.finalY + 6
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.text('Production Data', margin, y)
  autoTable(pdf, {
    startY: y + 2, margin: { left: margin, right: margin },
    head: [['S.No', 'Meter', 'Layer', 'Pieces', 'Tukda', 'Total Pieces', 'Color', 'Shade', 'Zip Code', 'Thread Code']],
    body: productionData.map((row: any) => {
      const rowTotalPieces = Number(row.pieces || 0) + Number(row.tukda || 0)
      return [row.serialNumber, Number(row.meter || 0), Number(row.layer || 1), Number(row.pieces || 0).toFixed(2), Number(row.tukda || 0), rowTotalPieces.toFixed(2), row.color || 'N/A', row.shade || 'N/A', row.zip_code || 'N/A', row.thread_code || 'N/A']
    }),
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 247, 255] }, theme: 'grid',
  })

  y = (pdf as any).lastAutoTable.finalY + 6
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.text('Summary & Calculations', margin, y)
  autoTable(pdf, {
    startY: y + 2, margin: { left: margin, right: margin },
    body: [
      ['# Tukda', String(tukdaCount), 'Tukda Size', tukdaSize],
      ['Total Meter', totalMeter.toFixed(2), 'Total Pieces', totalPieces.toFixed(2)],
      ['Grand Total Pieces', totalPiecesWithTukda.toFixed(2), 'Average', average.toFixed(4)],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 1: { cellWidth: 45 }, 2: { fontStyle: 'bold', cellWidth: 40 }, 3: { cellWidth: 45 } },
    theme: 'grid',
  })

  const colorRows = aggregatePiecesByColor(productionData)
  if (colorRows.length > 0) {
    y = (pdf as any).lastAutoTable.finalY + 4
    pdf.setFontSize(10); pdf.setFont('helvetica', 'bold')
    pdf.text('Pieces by Color', margin, y)
    autoTable(pdf, {
      startY: y + 2, margin: { left: margin, right: margin },
      head: [['Color', 'Total Pieces']],
      body: colorRows.map(({ color, totalPieces: tp }) => [color, tp.toFixed(2)]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 40, halign: 'center' } },
      theme: 'grid',
    })
  }

  y = (pdf as any).lastAutoTable.finalY + 6
  const addlRows = getAdditionalInfoExportRows(lot.flyWidth, lot.additionalInfo)
  if (addlRows.length > 0) {
    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
    pdf.text('Additional Information', margin, y)
    autoTable(pdf, {
      startY: y + 2, margin: { left: margin, right: margin },
      head: [['Field', 'Value', 'Field', 'Value', 'Field', 'Value']],
      body: buildAdditionalInfoPdfBody(addlRows),
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 28 }, 1: { cellWidth: 35 },
        2: { fontStyle: 'bold', cellWidth: 28 }, 3: { cellWidth: 35 },
        4: { fontStyle: 'bold', cellWidth: 28 }, 5: { cellWidth: 35 },
      },
      theme: 'grid',
    })
  }

  pdf.save(`Lot_${lot.lotNumber || 'Production'}_${formatDisplayDate(lot.date) || 'Report'}.pdf`)
}

export const exportLotViewToExcel = (lot: any) => {
  const displayDate = formatDisplayDate(lot.date)
  const infoRows = [
    ['Lot Number', lot.lotNumber || ''], ['Date', displayDate],
    ['Fabric', lot.fabric || ''], ['Pattern', lot.pattern || ''],
    ['Brand', lot.brand || ''], ['Created At', lot.createdAt ? formatDisplayDateTime(lot.createdAt) : ''],
    [],
  ]
  const prodRows = (lot.productionData || []).map((row: any) => {
    const rowTotalPieces = Number(row.pieces || 0) + Number(row.tukda || 0)
    return [row.serialNumber, Number(row.meter || 0), Number(row.layer || 1), Number(row.pieces || 0).toFixed(2), Number(row.tukda || 0), rowTotalPieces.toFixed(2), row.color || '', row.shade || '', row.zip_code || '', row.thread_code || '']
  })
  const addlRows = getAdditionalInfoExportRows(lot.flyWidth, lot.additionalInfo)
  const allRows = [
    ...infoRows,
    ['S.No', 'Meter', 'Layer', 'Pieces', 'Tukda', 'Total Pieces', 'Color', 'Shade', 'Zip Code', 'Thread Code'],
    ...prodRows,
    ...(addlRows.length > 0 ? [[], ['Additional Information'], ['Field', 'Value'], ...addlRows] : []),
  ]
  const csvContent = allRows.map((row) => (row as any[]).map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.setAttribute('href', URL.createObjectURL(blob))
  link.setAttribute('download', `Lot_${lot.lotNumber || 'Production'}_${displayDate || 'Report'}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
