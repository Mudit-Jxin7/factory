import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportLotViewToPDF = (lot: any) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const margin = 10

  pdf.setFontSize(16); pdf.setFont('helvetica', 'bold')
  pdf.text(`Lot Details: ${lot.lotNumber}`, pageW / 2, 14, { align: 'center' })
  pdf.setFontSize(11)
  pdf.text('Lot Information', margin, 24)

  autoTable(pdf, {
    startY: 26, margin: { left: margin, right: margin },
    body: [
      ['Lot Number', lot.lotNumber || 'N/A', 'Date', lot.date || 'N/A'],
      ['Fabric', lot.fabric || 'N/A', 'Pattern', lot.pattern || 'N/A'],
      ['Brand', lot.brand || 'N/A', 'Created At', lot.createdAt ? new Date(lot.createdAt).toLocaleString() : 'N/A'],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { fontStyle: 'bold', cellWidth: 35 } },
    theme: 'grid',
  })

  const afterInfo = (pdf as any).lastAutoTable.finalY + 6
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.text('Ratios', margin, afterInfo)

  const ratioKeys = Object.keys(lot.ratios || {})
  const ratioVals = Object.values(lot.ratios || {}).map((v) => String(v))
  const sumOfRatios = Object.values(lot.ratios || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0).toFixed(2)

  autoTable(pdf, {
    startY: afterInfo + 2, margin: { left: margin, right: margin },
    head: [ratioKeys.map(k => k.toUpperCase())], body: [ratioVals],
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }, theme: 'grid',
  })

  const afterRatios = (pdf as any).lastAutoTable.finalY + 2
  pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
  pdf.text(`Sum of Ratios: ${sumOfRatios}`, margin, afterRatios + 4)

  const afterRatioSum = afterRatios + 10
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.text('Production Data', margin, afterRatioSum)
  autoTable(pdf, {
    startY: afterRatioSum + 2, margin: { left: margin, right: margin },
    head: [['S.No', 'Meter', 'Layer', 'Pieces', 'Color', 'Shade', 'TBD2', 'TBD3']],
    body: (lot.productionData || []).map((row: any) => [row.serialNumber, Number(row.meter || 0), Number(row.layer || 1), Number(row.pieces || 0).toFixed(2), row.color || 'N/A', row.shade || 'N/A', row.tbd2 || 'N/A', row.tbd3 || 'N/A']),
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 247, 255] }, theme: 'grid',
  })

  const afterProd = (pdf as any).lastAutoTable.finalY + 6
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.text('Summary & Calculations', margin, afterProd)
  const grandTotal = Number(lot.totalPiecesWithTukda ?? (Number(lot.totalPieces || 0) + Number(lot.tukda?.count || 0))).toFixed(2)
  autoTable(pdf, {
    startY: afterProd + 2, margin: { left: margin, right: margin },
    head: [['# Tukda', 'Tukda Size', 'Total Meter', 'Total Pieces', 'Grand Total Pieces', 'Average']],
    body: [[lot.tukda?.count || 0, lot.tukda?.size || 'N/A', Number(lot.totalMeter || 0).toFixed(2), Number(lot.totalPieces || 0).toFixed(2), grandTotal, Number(lot.average || 0).toFixed(4)]],
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }, theme: 'grid',
  })

  pdf.save(`Lot_${lot.lotNumber || 'Production'}_${lot.date || 'Report'}.pdf`)
}

export const exportLotViewToExcel = (lot: any) => {
  const infoRows = [
    ['Lot Number', lot.lotNumber || ''], ['Date', lot.date || ''],
    ['Fabric', lot.fabric || ''], ['Pattern', lot.pattern || ''],
    ['Brand', lot.brand || ''], ['Created At', lot.createdAt ? new Date(lot.createdAt).toLocaleString() : ''],
    [], ['Ratios'],
    Object.keys(lot.ratios || {}).map((k: string) => k.toUpperCase()),
    Object.values(lot.ratios || {}).map((v: any) => String(v)), [],
  ]
  const grandTotal = Number(lot.totalPiecesWithTukda ?? (Number(lot.totalPieces || 0) + Number(lot.tukda?.count || 0))).toFixed(2)
  const prodRows = (lot.productionData || []).map((row: any) => [row.serialNumber, Number(row.meter || 0), Number(row.layer || 1), Number(row.pieces || 0).toFixed(2), row.color || '', row.shade || '', row.tbd2 || '', row.tbd3 || ''])
  const allRows = [
    ...infoRows,
    ['S.No', 'Meter', 'Layer', 'Pieces', 'Color', 'Shade', 'TBD2', 'TBD3'],
    ...prodRows, [],
    ['Summary'], ['# Tukda', 'Tukda Size', 'Total Meter', 'Total Pieces', 'Grand Total Pieces', 'Average'],
    [lot.tukda?.count || 0, lot.tukda?.size || '', Number(lot.totalMeter || 0).toFixed(2), Number(lot.totalPieces || 0).toFixed(2), grandTotal, Number(lot.average || 0).toFixed(4)],
  ]
  const csvContent = allRows.map((row) => (row as any[]).map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.setAttribute('href', URL.createObjectURL(blob))
  link.setAttribute('download', `Lot_${lot.lotNumber || 'Production'}_${lot.date || 'Report'}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
