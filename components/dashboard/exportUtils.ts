import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Ratios, AdditionalInfo, DEFAULT_RATIOS } from '@/lib/types'
import { buildAdditionalInfoPdfBody, getAdditionalInfoExportRows } from '@/lib/additionalInfoExport'
import { aggregatePiecesByColor } from '@/lib/colorPieces'
import { formatDisplayDate } from '@/lib/dateFormat'

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
  flyWidth?: string
  additionalInfo?: AdditionalInfo
}

const ratioKeys = Object.keys(DEFAULT_RATIOS) as (keyof Ratios)[]

export const exportLotToPDF = (params: ExportParams) => {
  const {
    lotNumber, date, fabric, pattern, brand, ratios, sumOfRatios, productionData,
    tukda, totalMeter, totalPieces, totalPiecesWithTukda, average, flyWidth, additionalInfo,
  } = params
  const displayDate = formatDisplayDate(date, '—')
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
      ['Lot Number', lotNumber || '—', 'Date', displayDate],
      ['Fabric', fabric || '—', 'Pattern', pattern || '—'],
      ['Brand', brand || '—', '', ''],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 28 }, 1: { cellWidth: 55 }, 2: { fontStyle: 'bold', cellWidth: 28 }, 3: { cellWidth: 55 } },
    theme: 'grid',
  })

  let y = (pdf as any).lastAutoTable.finalY + 6
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.text('Ratios', margin, y)
  autoTable(pdf, {
    startY: y + 2, margin: { left: margin, right: margin },
    head: [[...ratioKeys.map(k => k.toUpperCase()), 'SUM']],
    body: [[...ratioKeys.map(k => String(ratios?.[k] ?? 0)), sumOfRatios.toFixed(2)]],
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    theme: 'grid',
  })

  y = (pdf as any).lastAutoTable.finalY + 6
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.text('Production Data', margin, y)
  autoTable(pdf, {
    startY: y + 2, margin: { left: margin, right: margin },
    head: [['S.No', 'Meter', 'Layer', 'Pieces', 'Tukda', 'Total Pieces', 'Color', 'Zip Code', 'Thread Code']],
    body: productionData.map(row => {
      const rowTotalPieces = (Number(row.pieces) || 0) + (Number(row.tukda) || 0)
      return [
        row.serialNumber, row.meter || '0', row.layer,
        Number(row.pieces).toFixed(2), Number(row.tukda || 0), rowTotalPieces.toFixed(2),
        row.color || '—', row.zip_code || '—', row.thread_code || '—',
      ]
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
      ['# Tukda', String(tukda.count), 'Tukda Size', tukda.size || '—'],
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
  const addlRows = getAdditionalInfoExportRows(flyWidth, additionalInfo)
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

  pdf.save(`Lot_${lotNumber || 'Production'}_${displayDate || 'Report'}.pdf`)
}

export const exportLotToExcel = (params: ExportParams) => {
  const { lotNumber, date, fabric, pattern, brand, productionData, flyWidth, additionalInfo } = params
  const displayDate = formatDisplayDate(date)

  const infoRows = [
    ['Lot Number', lotNumber], ['Date', displayDate], ['Fabric', fabric], ['Pattern', pattern], ['Brand', brand], [],
  ]
  const prodHeaders = ['S.No', 'Meter', 'Layer', 'Pieces', 'Tukda', 'Total Pieces', 'Color', 'Zip Code', 'Thread Code']
  const prodRows = productionData.map(row => {
    const rowTotalPieces = (Number(row.pieces) || 0) + (Number(row.tukda) || 0)
    return [
      row.serialNumber, row.meter || '0', row.layer, Number(row.pieces).toFixed(2), Number(row.tukda || 0), rowTotalPieces.toFixed(2),
      row.color || '', row.zip_code || '', row.thread_code || '',
    ]
  })
  const addlRows = getAdditionalInfoExportRows(flyWidth, additionalInfo)
  const allRows = [
    ...infoRows,
    prodHeaders, ...prodRows,
    ...(addlRows.length > 0 ? [[], ['Additional Information'], ['Field', 'Value'], ...addlRows] : []),
  ]

  const csvContent = allRows.map((row) =>
    (row as any[]).map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.setAttribute('href', URL.createObjectURL(blob))
  link.setAttribute('download', `Lot_${lotNumber || 'Production'}_${displayDate || 'Report'}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
