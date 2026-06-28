import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Ratios, AdditionalInfo, JobCardProductionRow, Worker } from '@/lib/types'
import { WORKER_PAIRS, WORKER_META } from './constants'

const getWorkerName = (workerId: string, workers: Worker[]) => {
  if (!workerId) return ''
  const w = workers.find((x) => x._id === workerId)
  return w ? (w.worker_full_name || String(w.worker_id)) : ''
}

export const exportJobCardToPDF = (params: {
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
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const margin = 10

  pdf.setFontSize(16); pdf.setFont('helvetica', 'bold')
  pdf.text('Job Card', pageW / 2, 14, { align: 'center' })
  pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
  pdf.text(`Lot Number: ${lotNumber}`, margin, 22)
  pdf.text(`Brand: ${brand}`, margin + 65, 22)
  pdf.text(`Date: ${date}`, margin + 130, 22)

  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.text('Ratios', margin, 30)
  autoTable(pdf, {
    startY: 32, margin: { left: margin, right: margin },
    head: [Object.keys(ratios).map(k => k.toUpperCase())],
    body: [Object.values(ratios).map(v => String(v))],
    styles: { fontSize: 10, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    theme: 'grid',
  })

  const afterRatios = (pdf as any).lastAutoTable.finalY + 6
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.text('Production Data', margin, afterRatios)

  type CellDef = { content: string | number; styles?: Record<string, unknown> } | string | number
  const infoHdr  = { fontStyle: 'bold' as const, fillColor: [41, 128, 185] as [number,number,number], textColor: [255,255,255] as [number,number,number] }
  const labelSty = { fontStyle: 'bold' as const, fillColor: [230, 238, 255] as [number,number,number], textColor: [0,0,0] as [number,number,number], fontSize: 10 }
  const blankRow: CellDef[] = ['', '', '', '', '', '']

  const prodTableOptions = {
    margin: { left: margin, right: margin },
    head: [] as any[], showHead: 'never' as const,
    styles: { fontSize: 9, cellPadding: 1.5, halign: 'left' as const, overflow: 'linebreak' as const },
    theme: 'grid' as const,
    columnStyles: {
      0: { cellWidth: 38 }, 1: { cellWidth: 25 }, 2: { cellWidth: 18 },
      3: { cellWidth: 38 }, 4: { cellWidth: 25 }, 5: { cellWidth: 'auto' as const },
    },
  }

  let prodStartY = afterRatios + 2
  productionData.forEach((row) => {
    const infoVal = { fontStyle: 'bold' as const, fontSize: 10 }
    const prodBody: CellDef[][] = []
    prodBody.push([
      { content: 'S.No', styles: infoHdr }, { content: 'Layer', styles: infoHdr },
      { content: 'Pieces', styles: infoHdr }, { content: 'Color', styles: infoHdr },
      { content: 'Zip Code', styles: infoHdr }, { content: 'Thread Code', styles: infoHdr },
    ])
    prodBody.push([
      { content: row.serialNumber, styles: infoVal }, { content: row.layer, styles: infoVal },
      { content: row.pieces, styles: infoVal }, { content: row.color || '', styles: infoVal },
      { content: row.zip_code || '', styles: infoVal }, { content: row.thread_code || '', styles: infoVal },
    ])
    prodBody.push(blankRow)

    WORKER_PAIRS.forEach(([w1, w2], pIdx) => {
      const m1 = WORKER_META[w1]
      const m2 = w2 ? WORKER_META[w2] : null
      prodBody.push([
        { content: `${w1} Worker`, styles: labelSty }, { content: `${w1} Date`, styles: labelSty },
        { content: `${w1} Rate`, styles: labelSty },
        { content: w2 ? `${w2} Worker` : '', styles: w2 ? labelSty : {} },
        { content: w2 ? `${w2} Date` : '', styles: w2 ? labelSty : {} },
        { content: w2 ? `${w2} Rate` : '', styles: w2 ? labelSty : {} },
      ])
      prodBody.push([
        getWorkerName((row as any)[m1.workerKey] ?? '', workers) || '',
        (row as any)[m1.dateKey] || '', (row as any)[m1.rateKey] || '',
        m2 ? getWorkerName((row as any)[m2.workerKey] ?? '', workers) || '' : '',
        m2 ? (row as any)[m2.dateKey] || '' : '',
        m2 ? (row as any)[m2.rateKey] || '' : '',
      ])
      if (pIdx < WORKER_PAIRS.length - 1) { prodBody.push(blankRow); prodBody.push(blankRow) }
    })

    autoTable(pdf, { ...prodTableOptions, startY: prodStartY, body: prodBody })
    prodStartY = (pdf as any).lastAutoTable.finalY + 12
  })

  const afterProd = (pdf as any).lastAutoTable.finalY + 6
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.text('Additional Information', margin, afterProd)

  const ADDL_FIELD_KEYS: (keyof AdditionalInfo)[] = [
    'belt', 'bottom', 'pasting', 'bone', 'hala', 'ticketPocket',
    'cutting', 'number', 'buttonTake', 'assembly', 'sealStitch', 'label',
    'tanki', 'kaajButton', 'finishing', 'addition1', 'addition2', 'addition3',
  ]
  const addlFields: [string, string][] = [
    ['Fly Width', flyWidth],
    ...ADDL_FIELD_KEYS.map(k => [
      k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
      additionalInfo[k] ?? '',
    ] as [string, string]),
  ]
  const third = Math.ceil(addlFields.length / 3)
  const col1 = addlFields.slice(0, third)
  const col2 = addlFields.slice(third, third * 2)
  const col3 = addlFields.slice(third * 2)
  const addlBody = col1.map((item, i) => [
    item[0], item[1] || '', col2[i]?.[0] ?? '', col2[i]?.[1] ?? '',
    col3[i]?.[0] ?? '', col3[i]?.[1] ?? '',
  ])

  autoTable(pdf, {
    startY: afterProd + 2, margin: { left: margin, right: margin },
    head: [['Field', 'Value', 'Field', 'Value', 'Field', 'Value']], body: addlBody,
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28 }, 1: { cellWidth: 35 },
      2: { fontStyle: 'bold', cellWidth: 28 }, 3: { cellWidth: 35 },
      4: { fontStyle: 'bold', cellWidth: 28 }, 5: { cellWidth: 35 },
    },
    alternateRowStyles: { fillColor: [240, 247, 255] }, theme: 'grid',
  })

  pdf.save(`JobCard_${lotNumber || 'Production'}_${date || 'Report'}.pdf`)
}
