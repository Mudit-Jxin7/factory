'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { jobCardsAPI, lotsAPI, workersAPI } from '@/lib/api'
import { getColorForShade } from '@/lib/colorUtils'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import './dashboard.css'

interface JobCardContentProps {
  lotNumber: string
  isEdit?: boolean
}

export default function JobCardContent({ lotNumber: initialLotNumber, isEdit: initialIsEdit }: JobCardContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const isEditMode = initialIsEdit || searchParams?.get('edit') === 'true'
  
  // Decode lot number to handle URL-encoded spaces and special characters
  const decodedLotNumber = initialLotNumber ? decodeURIComponent(initialLotNumber) : ''
  const [lotNumber, setLotNumber] = useState(decodedLotNumber)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [brand, setBrand] = useState('')
  const [workers, setWorkers] = useState<any[]>([])
  const [ratios, setRatios] = useState({
    r28: 0, r30: 0, r32: 0, r34: 0, r36: 0,
    r38: 0, r40: 0, r42: 0, r44: 0,
  })
  const [productionData, setProductionData] = useState([
    {
      serialNumber: 1,
      layer: '1',
      pieces: 0,
      color: '',
      shade: '',
      front: '',
      frontWorker: '',
      frontDate: '',
      frontRate: '',
      back: '',
      backWorker: '',
      backDate: '',
      backRate: '',
      zip: '',
      zipWorker: '',
      zipDate: '',
      zipRate: '',
      zip_code: '',
      thread_code: '',
      astar: '',
      astarWorker: '',
      astarDate: '',
      astarRate: '',
      beltProd: '',
      beltProdWorker: '',
      beltProdDate: '',
      beltProdRate: '',
      add1: '',
      add1Worker: '',
      add1Date: '',
      add1Rate: '',
      add2: '',
      add2Worker: '',
      add2Date: '',
      add2Rate: '',
    }
  ])
  const [flyWidth, setFlyWidth] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState({
    belt: '',
    bottom: '',
    pasting: '',
    bone: '',
    hala: '',
    ticketPocket: '',
    cutting: '',
    number: '',
    buttonTake: '',
    assembly: '',
    sealStitch: '',
    label: '',
    tanki: '',
    kaajButton: '',
    finishing: '',
    addition1: '',
    addition2: '',
    addition3: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [loadingLot, setLoadingLot] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [generatingExcel, setGeneratingExcel] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingWorkerCell, setEditingWorkerCell] = useState<{ rowIndex: number; field: 'front' | 'back' | 'zip' | 'astar' | 'beltProd' | 'add1' | 'add2' } | null>(null)
  const [popupWorker, setPopupWorker] = useState('')
  const [popupDate, setPopupDate] = useState('')
  const [popupRate, setPopupRate] = useState('')

  const getWorkerName = (workerId: string) => {
    if (!workerId) return '—'
    const w = workers.find((x: { _id: string }) => x._id === workerId)
    return w ? (w.worker_full_name || String(w.worker_id)) : '—'
  }

  const openWorkerPopup = (rowIndex: number, field: 'front' | 'back' | 'zip' | 'astar' | 'beltProd' | 'add1' | 'add2') => {
    const row = productionData[rowIndex]
    const workerKey = `${field}Worker` as keyof typeof row
    const dateKey = `${field}Date` as keyof typeof row
    const rateKey = `${field}Rate` as keyof typeof row
    setPopupWorker(String(row[workerKey] ?? ''))
    setPopupDate(String(row[dateKey] ?? ''))
    setPopupRate(String(row[rateKey] ?? ''))
    setEditingWorkerCell({ rowIndex, field })
  }

  const saveWorkerPopup = () => {
    if (!editingWorkerCell) return
    const { rowIndex, field } = editingWorkerCell
    setProductionData(prev =>
      prev.map((row, i) =>
        i === rowIndex
          ? {
              ...row,
              [`${field}Worker`]: popupWorker,
              [`${field}Date`]: popupDate,
              [`${field}Rate`]: popupRate,
            }
          : row
      )
    )
    setEditingWorkerCell(null)
  }

  const sumOfRatios = useMemo(() => {
    return Object.values(ratios).reduce((sum, val) => sum + (Number(val) || 0), 0)
  }, [ratios])

  // Fetch workers on mount
  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    try {
      const result = await workersAPI.getAllWorkers()
      if (result.success) {
        setWorkers(result.workers || [])
      }
    } catch (error) {
      console.error('Error fetching workers:', error)
    }
  }

  useEffect(() => {
    if (lotNumber) {
      // Always try to load existing job card first
      setLoading(true)
      jobCardsAPI.getJobCardByLotNumber(lotNumber).then((result) => {
        if (result.success && result.jobCard) {
          // Job card exists, load it
          const jobCard = result.jobCard
          setDate(jobCard.date || '')
          setBrand(jobCard.brand || '')
          setRatios(jobCard.ratios || ratios)
          setProductionData(jobCard.productionData || productionData)
          setFlyWidth(jobCard.flyWidth || '')
          setAdditionalInfo(jobCard.additionalInfo || { belt: '', bottom: '', pasting: '', bone: '', hala: '', ticketPocket: '', cutting: '', number: '', buttonTake: '', assembly: '', sealStitch: '', label: '', tanki: '', kaajButton: '', finishing: '', addition1: '', addition2: '', addition3: '' })
          setLoading(false)
        } else {
          // No job card exists - show error, job cards can only be edited
          setError('Job card not found for this lot number. Job cards are automatically created when a lot is saved.')
          setLoading(false)
        }
      }).catch((error) => {
        setError('Error loading job card: ' + error.message)
        setLoading(false)
      })
    }
  }, [lotNumber])

  const loadLotData = async () => {
    if (!lotNumber) return
    
    setLoadingLot(true)
    try {
      const result = await lotsAPI.getLotByNumber(lotNumber)
      if (result.success && result.lot) {
        const lot = result.lot
        setDate(lot.date || new Date().toISOString().split('T')[0])
        setBrand(lot.brand || '')
        setRatios(lot.ratios || {
          r28: 0, r30: 0, r32: 0, r34: 0, r36: 0,
          r38: 0, r40: 0, r42: 0, r44: 0,
        })
        
        // Prefill production data from lot
        if (lot.productionData && lot.productionData.length > 0) {
          const prefilledData = lot.productionData.map((row: any, index: number) => ({
            serialNumber: index + 1,
            layer: String(row.layer || '1'),
            pieces: Number(row.pieces || 0),
            color: row.color || '',
            shade: row.shade || '',
            front: '',
            frontWorker: '',
            frontDate: '',
            frontRate: '',
            back: '',
            backWorker: '',
            backDate: '',
            backRate: '',
            zip: '',
            zipWorker: '',
            zipDate: '',
            zipRate: '',
            zip_code: '',
            thread_code: '',
            astar: '',
            astarWorker: '',
            astarDate: '',
            astarRate: '',
            beltProd: '',
            beltProdWorker: '',
            beltProdDate: '',
            beltProdRate: '',
            add1: '',
            add1Worker: '',
            add1Date: '',
            add1Rate: '',
            add2: '',
            add2Worker: '',
            add2Date: '',
            add2Rate: '',
          }))
          setProductionData(prefilledData)
        }
      } else {
        setError('Lot not found. Please enter a valid lot number.')
      }
    } catch (error: any) {
      console.error('Error loading lot:', error)
      setError('Error loading lot: ' + error.message)
    } finally {
      setLoadingLot(false)
    }
  }

  const loadJobCard = async () => {
    if (!lotNumber) return
    
    setLoading(true)
    try {
      const result = await jobCardsAPI.getJobCardByLotNumber(lotNumber)
      if (result.success && result.jobCard) {
        const jobCard = result.jobCard
        setDate(jobCard.date || '')
        setBrand(jobCard.brand || '')
        setRatios(jobCard.ratios || ratios)
        setProductionData(jobCard.productionData || productionData)
        setFlyWidth(jobCard.flyWidth || '')
        setAdditionalInfo(jobCard.additionalInfo || { belt: '', bottom: '', pasting: '', bone: '', hala: '', ticketPocket: '', cutting: '', number: '', buttonTake: '', assembly: '', sealStitch: '', label: '', tanki: '', kaajButton: '', finishing: '', addition1: '', addition2: '', addition3: '' })
      } else {
        setError('Job card not found')
      }
    } catch (error: any) {
      console.error('Error loading job card:', error)
      setError('Error loading job card: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const addRow = () => {
    const newSerialNumber = productionData.length > 0
      ? Math.max(...productionData.map(row => row.serialNumber)) + 1
      : 1
    
    setProductionData([
      ...productionData,
      {
        serialNumber: newSerialNumber,
        layer: '1',
        pieces: 0,
        color: '',
        shade: '',
        front: '',
        frontWorker: '',
        frontDate: '',
        frontRate: '',
        back: '',
        backWorker: '',
        backDate: '',
        backRate: '',
        zip: '',
        zipWorker: '',
        zipDate: '',
        zipRate: '',
        zip_code: '',
        thread_code: '',
        astar: '',
        astarWorker: '',
        astarDate: '',
        astarRate: '',
        beltProd: '',
        beltProdWorker: '',
        beltProdDate: '',
        beltProdRate: '',
        add1: '',
        add1Worker: '',
        add1Date: '',
        add1Rate: '',
        add2: '',
        add2Worker: '',
        add2Date: '',
        add2Rate: '',
      }
    ])
  }

  const deleteRow = (index: number) => {
    const newData = productionData.filter((_, i) => i !== index)
    const renumberedData = newData.map((row, idx) => ({
      ...row,
      serialNumber: idx + 1
    }))
    setProductionData(renumberedData)
  }

  const updateProductionData = (index: number, field: string, value: string) => {
    const newData = [...productionData]
    newData[index] = {
      ...newData[index],
      [field]: value
    }
    setProductionData(newData)
  }

  const handleSave = async () => {
    if (!lotNumber.trim()) {
      toast.showToast('Please enter a lot number', 'warning')
      return
    }

    setSaving(true)
    try {
      const jobCardData = {
        lotNumber,
        date,
        brand,
        ratios,
        productionData: productionData.map(row => ({
          ...row,
          layer: Number(row.layer) || 1,
          pieces: Number(row.pieces) || 0,
        })),
        flyWidth,
        additionalInfo,
      }

      const result = await jobCardsAPI.updateJobCard(lotNumber, jobCardData)

      if (result.success) {
        toast.showToast('Job card updated successfully!', 'success')
        router.push(`/jobcard/${encodeURIComponent(lotNumber)}?edit=true`)
      } else {
        toast.showToast('Error updating job card: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Error saving job card:', error)
      toast.showToast('Error saving job card: ' + error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const exportToPDF = () => {
    setGeneratingPDF(true)
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const margin = 10

      // ── Title ──────────────────────────────────────────────────────────────
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Job Card', pageW / 2, 14, { align: 'center' })

      // ── Header Info ────────────────────────────────────────────────────────
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Lot Number: ${lotNumber}`, margin, 22)
      pdf.text(`Brand: ${brand}`, margin + 65, 22)
      pdf.text(`Date: ${date}`, margin + 130, 22)

      // ── Ratios ─────────────────────────────────────────────────────────────
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Ratios', margin, 30)

      autoTable(pdf, {
        startY: 32,
        margin: { left: margin, right: margin },
        head: [Object.keys(ratios).map(k => k.toUpperCase())],
        body: [Object.values(ratios).map(v => String(v))],
        styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        theme: 'grid',
      })

      // ── Production Data ────────────────────────────────────────────────────
      const afterRatios = (pdf as any).lastAutoTable.finalY + 6
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Production Data', margin, afterRatios)

      // Each production row expands into sub-rows:
      //   1 row  – Front worker value (header columns serve as the label)
      //   2 rows – Back worker  (label + value)
      //   2 rows – Zip worker   (label + value)
      //   2 rows – Astar worker (label + value)
      //   2 rows – Belt worker  (label + value)
      //   2 rows – Add1 worker  (label + value)
      //   2 rows – Add2 worker  (label + value)
      //   2 rows – Zip Code / Thread Code (label + value)
      // Total = 15 sub-rows; first 4 columns span all 15
      const SPAN = 15

      const workerSections = [
        { label: 'Back',  workerKey: 'backWorker',     dateKey: 'backDate',     rateKey: 'backRate'     },
        { label: 'Zip',   workerKey: 'zipWorker',      dateKey: 'zipDate',      rateKey: 'zipRate'      },
        { label: 'Astar', workerKey: 'astarWorker',    dateKey: 'astarDate',    rateKey: 'astarRate'    },
        { label: 'Belt',  workerKey: 'beltProdWorker', dateKey: 'beltProdDate', rateKey: 'beltProdRate' },
        { label: 'Add1',  workerKey: 'add1Worker',     dateKey: 'add1Date',     rateKey: 'add1Rate'     },
        { label: 'Add2',  workerKey: 'add2Worker',     dateKey: 'add2Date',     rateKey: 'add2Rate'     },
      ]

      const labelCellStyle = { fontStyle: 'bold' as const, fillColor: [230, 238, 255] as [number, number, number] }

      const prodBody: any[] = []
      productionData.forEach(row => {
        // Sub-row 1: spanned identity cells + Front worker value
        prodBody.push([
          { content: row.serialNumber, rowSpan: SPAN, styles: { valign: 'middle', halign: 'center' } },
          { content: row.layer,        rowSpan: SPAN, styles: { valign: 'middle', halign: 'center' } },
          { content: row.pieces,       rowSpan: SPAN, styles: { valign: 'middle', halign: 'center' } },
          { content: row.color || '', rowSpan: SPAN, styles: { valign: 'middle', halign: 'center' } },
          getWorkerName(row.frontWorker ?? '') || '',
          row.frontDate || '',
          row.frontRate || '',
        ])

        // Sub-rows for remaining worker sections (label then value)
        workerSections.forEach(s => {
          prodBody.push([
            { content: `${s.label} Worker`, styles: labelCellStyle },
            { content: `${s.label} Date`,   styles: labelCellStyle },
            { content: `${s.label} Rate`,   styles: labelCellStyle },
          ])
          prodBody.push([
            getWorkerName((row as any)[s.workerKey] ?? '') || '',
            (row as any)[s.dateKey] || '',
            (row as any)[s.rateKey] || '',
          ])
        })

        // Zip Code / Thread Code label + value
        prodBody.push([
          { content: 'Zip Code',    styles: labelCellStyle },
          { content: 'Thread Code', styles: labelCellStyle },
          '',
        ])
        prodBody.push([
          (row as any).zip_code    || '',
          (row as any).thread_code || '',
          '',
        ])
      })

      autoTable(pdf, {
        startY: afterRatios + 2,
        margin: { left: margin, right: margin },
        head: [['S.No', 'Layer', 'Pieces', 'Color', 'Front Worker', 'Front Date', 'Front Rate']],
        body: prodBody,
        styles: { fontSize: 7, cellPadding: 1.5, halign: 'center', overflow: 'linebreak' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        theme: 'grid',
      })

      // ── Additional Information ─────────────────────────────────────────────
      const afterProd = (pdf as any).lastAutoTable.finalY + 6
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Additional Information', margin, afterProd)

      const addlFields: [string, string][] = [
        ['Fly Width', flyWidth],
        ['Belt', additionalInfo.belt],
        ['Bottom', additionalInfo.bottom],
        ['Pasting', additionalInfo.pasting],
        ['Bone', additionalInfo.bone],
        ['Hala', additionalInfo.hala],
        ['Ticket Pocket', additionalInfo.ticketPocket],
        ['Cutting', additionalInfo.cutting],
        ['Number', additionalInfo.number],
        ['Button Take', additionalInfo.buttonTake],
        ['Assembly', additionalInfo.assembly],
        ['Seal Stitch', additionalInfo.sealStitch],
        ['Label', additionalInfo.label],
        ['Tanki', additionalInfo.tanki],
        ['Kaaj + Button', additionalInfo.kaajButton],
        ['Finishing', additionalInfo.finishing],
        ['Addition 1', additionalInfo.addition1],
        ['Addition 2', additionalInfo.addition2],
        ['Addition 3', additionalInfo.addition3],
      ]

      // Split into two columns of roughly equal length
      const half = Math.ceil(addlFields.length / 2)
      const col1 = addlFields.slice(0, half)
      const col2 = addlFields.slice(half)
      const addlBody = col1.map((item, i) => [
        item[0], item[1] || '—',
        col2[i]?.[0] ?? '', col2[i]?.[1] ?? '',
      ])

      autoTable(pdf, {
        startY: afterProd + 2,
        margin: { left: margin, right: margin },
        head: [['Field', 'Value', 'Field', 'Value']],
        body: addlBody,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: [240, 247, 255] },
        theme: 'grid',
      })

      pdf.save(`JobCard_${lotNumber || 'Production'}_${date || 'Report'}.pdf`)
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      toast.showToast('Error generating PDF: ' + error.message, 'error')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const exportToExcel = () => {
    setGeneratingExcel(true)
    try {
      const infoRows = [
        ['Lot Number', lotNumber], ['Brand', brand], ['Date', date],
        [],
        ['Ratios'],
        Object.keys(ratios).map(k => k.toUpperCase()),
        Object.values(ratios).map(v => String(v)),
        [],
      ]

      // Header matches the PDF layout: 7 columns
      const prodHeader = ['S.No', 'Layer', 'Pieces', 'Color', 'Front Worker', 'Front Date', 'Front Rate']

      const workerSections = [
        { label: 'Back',  workerKey: 'backWorker',     dateKey: 'backDate',     rateKey: 'backRate'     },
        { label: 'Zip',   workerKey: 'zipWorker',      dateKey: 'zipDate',      rateKey: 'zipRate'      },
        { label: 'Astar', workerKey: 'astarWorker',    dateKey: 'astarDate',    rateKey: 'astarRate'    },
        { label: 'Belt',  workerKey: 'beltProdWorker', dateKey: 'beltProdDate', rateKey: 'beltProdRate' },
        { label: 'Add1',  workerKey: 'add1Worker',     dateKey: 'add1Date',     rateKey: 'add1Rate'     },
        { label: 'Add2',  workerKey: 'add2Worker',     dateKey: 'add2Date',     rateKey: 'add2Rate'     },
      ]

      // Each production row expands into sub-rows matching the PDF vertical layout.
      // S.No/Layer/Pieces/Color are repeated (CSV has no merged cells) only on the first
      // sub-row; remaining sub-rows leave those columns blank for visual clarity.
      const prodRows: any[][] = []
      productionData.forEach(row => {
        const id = [row.serialNumber, row.layer, row.pieces, row.color || '']
        const blank4 = ['', '', '', '']

        // Sub-row 1: Front worker value
        prodRows.push([...id,
          getWorkerName(row.frontWorker ?? '') || '—',
          row.frontDate || '—',
          row.frontRate || '—',
        ])

        // Sub-rows for remaining workers
        workerSections.forEach(s => {
          prodRows.push([...blank4, `${s.label} Worker`, `${s.label} Date`, `${s.label} Rate`])
          prodRows.push([...blank4,
            getWorkerName((row as any)[s.workerKey] ?? '') || '—',
            (row as any)[s.dateKey] || '—',
            (row as any)[s.rateKey] || '—',
          ])
        })

        // Zip Code / Thread Code
        prodRows.push([...blank4, 'Zip Code', 'Thread Code', ''])
        prodRows.push([...blank4, (row as any).zip_code || '—', (row as any).thread_code || '—', ''])
        prodRows.push([]) // blank separator between production items
      })

      const addlHeader = ['Field', 'Value']
      const addlRows = [
        ['Fly Width', flyWidth],
        ['Belt', additionalInfo.belt], ['Bottom', additionalInfo.bottom],
        ['Pasting', additionalInfo.pasting], ['Bone', additionalInfo.bone],
        ['Hala', additionalInfo.hala], ['Ticket Pocket', additionalInfo.ticketPocket],
        ['Cutting', additionalInfo.cutting], ['Number', additionalInfo.number],
        ['Button Take', additionalInfo.buttonTake], ['Assembly', additionalInfo.assembly],
        ['Seal Stitch', additionalInfo.sealStitch], ['Label', additionalInfo.label],
        ['Tanki', additionalInfo.tanki], ['Kaaj + Button', additionalInfo.kaajButton],
        ['Finishing', additionalInfo.finishing],
        ['Addition 1', additionalInfo.addition1], ['Addition 2', additionalInfo.addition2], ['Addition 3', additionalInfo.addition3],
      ]

      const allRows = [
        ...infoRows,
        prodHeader, ...prodRows,
        [], ['Additional Information'], addlHeader, ...addlRows,
      ]

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
      toast.showToast('Excel file exported successfully!', 'success')
    } catch (error: any) {
      toast.showToast('Error generating Excel: ' + error.message, 'error')
    } finally {
      setGeneratingExcel(false)
    }
  }

  if (loading || loadingLot) {
    return (
      <>
        <NavigationBar />
        <div className="dashboard-container">
          <div className="loading-container">
            <p>Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <NavigationBar />
      <div className="dashboard-container">
        <div className="dashboard-header">
        <div className="header-title">
          <h1>{isEditMode ? 'Edit Job Card' : 'View Job Card'}</h1>
          <p>{isEditMode ? 'Edit' : 'View'} job card details for lot {lotNumber}</p>
        </div>
        <div className="header-actions">
          {isEditMode && (
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !lotNumber}>
              <span className="btn-icon">💾</span>
              {saving ? 'Saving...' : 'Update Job Card'}
            </button>
          )}
          <button className="btn btn-primary" onClick={exportToPDF} disabled={generatingPDF}>
            <span className="btn-icon">📄</span>
            {generatingPDF ? 'Generating...' : 'Download PDF'}
          </button>
          <button className="btn btn-primary" onClick={exportToExcel} disabled={generatingExcel}>
            <span className="btn-icon">📊</span>
            {generatingExcel ? 'Generating...' : 'Download Excel'}
          </button>
          {!isEditMode && (
            <button className="btn btn-primary" onClick={() => router.push(`/jobcard/${encodeURIComponent(lotNumber)}?edit=true`)}>
              <span className="btn-icon">✏️</span>
              Edit Job Card
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => router.push('/jobcards')}>
            <span className="btn-icon">←</span>
            Back to Job Cards
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '24px', background: '#fff5f5', border: '1px solid #ffe0e0' }}>
          <p style={{ color: '#c92a2a', margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="dashboard-content">
        <div className="card">
          <h2>Job Card Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Lot Number</label>
              <input
                type="text"
                value={lotNumber}
                disabled
                style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                value={brand}
                disabled
                style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                placeholder="Enter brand"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Ratios</h2>
          <div className="ratios-grid">
            {Object.keys(ratios).map((ratioKey) => (
              <div key={ratioKey} className="form-group">
                <label>{ratioKey.toUpperCase()}</label>
                <input
                  type="number"
                  value={ratios[ratioKey as keyof typeof ratios]}
                  disabled
                  style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  min="0"
                  step="0.5"
                />
              </div>
            ))}
          </div>
          <div className="ratios-summary">
            <strong>Sum of Ratios: {sumOfRatios.toFixed(2)}</strong>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Production Data</h2>
          </div>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="production-table" style={{ minWidth: '1400px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', minWidth: '40px' }}>S.No</th>
                  <th>Layer</th>
                  <th>Pieces</th>
                  <th>Color</th>
                  <th>Shade</th>
                  <th style={{ width: '220px', minWidth: '220px' }}>Front</th>
                  <th style={{ width: '220px', minWidth: '220px' }}>Back</th>
                  <th style={{ width: '220px', minWidth: '220px' }}>Zip</th>
                  <th style={{ width: '220px', minWidth: '220px' }}>Astar</th>
                  <th style={{ width: '220px', minWidth: '220px' }}>Belt</th>
                  <th style={{ width: '220px', minWidth: '220px' }}>Additional 1</th>
                  <th style={{ width: '220px', minWidth: '220px' }}>Additional 2</th>
                  <th style={{ width: '100px', minWidth: '100px' }}>Zip Code</th>
                  <th style={{ width: '100px', minWidth: '100px' }}>Thread Code</th>
                </tr>
              </thead>
              <tbody>
                {productionData.map((row, index) => (
                  <tr key={index}>
                    <td style={{ width: '40px', minWidth: '40px', textAlign: 'center' }}>{row.serialNumber}</td>
                    <td>
                      <input
                        type="text"
                        value={row.layer}
                        disabled
                        className="production-table input"
                        style={{ width: '60px', background: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.pieces}
                        disabled
                        className="production-table input"
                        style={{ width: '80px', background: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                    </td>
                    <td>
                      <span style={{ fontSize: '16px', color: '#1a1a1a' }}>{row.color || '—'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', minHeight: '36px' }}>
                        {row.color ? (
                          <div
                            title={row.color}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              backgroundColor: getColorForShade(row.color),
                              border: '1px solid #ccc',
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '16px', color: '#6c757d' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={{ width: '240px', minWidth: '240px' }}>
                      <button
                        type="button"
                        onClick={() => isEditMode && openWorkerPopup(index, 'front')}
                        disabled={!isEditMode}
                        className="tbd-input"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '16px',
                          textAlign: 'left',
                          background: !isEditMode ? '#f8f9fa' : '#fff',
                          cursor: !isEditMode ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {getWorkerName(row.frontWorker ?? '')}
                      </button>
                    </td>
                    <td style={{ width: '240px', minWidth: '240px' }}>
                      <button
                        type="button"
                        onClick={() => isEditMode && openWorkerPopup(index, 'back')}
                        disabled={!isEditMode}
                        className="tbd-input"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '16px',
                          textAlign: 'left',
                          background: !isEditMode ? '#f8f9fa' : '#fff',
                          cursor: !isEditMode ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {getWorkerName(row.backWorker ?? '')}
                      </button>
                    </td>
                    <td style={{ width: '240px', minWidth: '240px' }}>
                      <button
                        type="button"
                        onClick={() => isEditMode && openWorkerPopup(index, 'zip')}
                        disabled={!isEditMode}
                        className="tbd-input"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '16px',
                          textAlign: 'left',
                          background: !isEditMode ? '#f8f9fa' : '#fff',
                          cursor: !isEditMode ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {getWorkerName(row.zipWorker ?? '')}
                      </button>
                    </td>
                    <td style={{ width: '240px', minWidth: '240px' }}>
                      <button
                        type="button"
                        onClick={() => isEditMode && openWorkerPopup(index, 'astar')}
                        disabled={!isEditMode}
                        className="tbd-input"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '16px',
                          textAlign: 'left',
                          background: !isEditMode ? '#f8f9fa' : '#fff',
                          cursor: !isEditMode ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {getWorkerName((row as any).astarWorker ?? '')}
                      </button>
                    </td>
                    <td style={{ width: '240px', minWidth: '240px' }}>
                      <button
                        type="button"
                        onClick={() => isEditMode && openWorkerPopup(index, 'beltProd')}
                        disabled={!isEditMode}
                        className="tbd-input"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '16px',
                          textAlign: 'left',
                          background: !isEditMode ? '#f8f9fa' : '#fff',
                          cursor: !isEditMode ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {getWorkerName((row as any).beltProdWorker ?? '')}
                      </button>
                    </td>
                    <td style={{ width: '240px', minWidth: '240px' }}>
                      <button
                        type="button"
                        onClick={() => isEditMode && openWorkerPopup(index, 'add1')}
                        disabled={!isEditMode}
                        className="tbd-input"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '16px',
                          textAlign: 'left',
                          background: !isEditMode ? '#f8f9fa' : '#fff',
                          cursor: !isEditMode ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {getWorkerName((row as any).add1Worker ?? '')}
                      </button>
                    </td>
                    <td style={{ width: '240px', minWidth: '240px' }}>
                      <button
                        type="button"
                        onClick={() => isEditMode && openWorkerPopup(index, 'add2')}
                        disabled={!isEditMode}
                        className="tbd-input"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '16px',
                          textAlign: 'left',
                          background: !isEditMode ? '#f8f9fa' : '#fff',
                          cursor: !isEditMode ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {getWorkerName((row as any).add2Worker ?? '')}
                      </button>
                    </td>
                    <td style={{ width: '70px', minWidth: '70px' }}>
                      <input
                        type="text"
                        value={row.zip_code ?? (row as { zip?: string }).zip ?? ''}
                        readOnly
                        disabled
                        className="tbd-input"
                        style={{ background: '#f8f9fa', cursor: 'not-allowed', width: '100%' }}
                        placeholder="Zip Code"
                      />
                    </td>
                    <td style={{ width: '70px', minWidth: '70px' }}>
                      <input
                        type="text"
                        value={row.thread_code ?? (row as { thread?: string }).thread ?? ''}
                        readOnly
                        disabled
                        className="tbd-input"
                        style={{ background: '#f8f9fa', cursor: 'not-allowed', width: '100%' }}
                        placeholder="Thread Code"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>Additional Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Fly Width</label>
              <input
                type="text"
                value={flyWidth}
                onChange={(e) => setFlyWidth(e.target.value)}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Enter fly width"
              />
            </div>
            <div className="form-group">
              <label>Belt</label>
              <input
                type="text"
                value={additionalInfo.belt}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, belt: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Belt"
              />
            </div>
            <div className="form-group">
              <label>Bottom</label>
              <input
                type="text"
                value={additionalInfo.bottom}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, bottom: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Bottom"
              />
            </div>
            <div className="form-group">
              <label>Pasting</label>
              <input
                type="text"
                value={additionalInfo.pasting}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, pasting: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Pasting"
              />
            </div>
            <div className="form-group">
              <label>Bone</label>
              <input
                type="text"
                value={additionalInfo.bone}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, bone: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Bone"
              />
            </div>
            <div className="form-group">
              <label>Hala</label>
              <input
                type="text"
                value={additionalInfo.hala}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, hala: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Hala"
              />
            </div>
            <div className="form-group">
              <label>Ticket Pocket</label>
              <input
                type="text"
                value={additionalInfo.ticketPocket}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, ticketPocket: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Ticket Pocket"
              />
            </div>
            <div className="form-group">
              <label>Cutting</label>
              <input
                type="text"
                value={additionalInfo.cutting}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, cutting: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Cutting"
              />
            </div>
            <div className="form-group">
              <label>Number</label>
              <input
                type="text"
                value={additionalInfo.number}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, number: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Number"
              />
            </div>
            <div className="form-group">
              <label>Button Take</label>
              <input
                type="text"
                value={additionalInfo.buttonTake}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, buttonTake: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Button Take"
              />
            </div>
            <div className="form-group">
              <label>Assembly</label>
              <input
                type="text"
                value={additionalInfo.assembly}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, assembly: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Assembly"
              />
            </div>
            <div className="form-group">
              <label>Seal Stitch</label>
              <input
                type="text"
                value={additionalInfo.sealStitch}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, sealStitch: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Seal Stitch"
              />
            </div>
            <div className="form-group">
              <label>Label</label>
              <input
                type="text"
                value={additionalInfo.label}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, label: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Label"
              />
            </div>
            <div className="form-group">
              <label>Tanki</label>
              <input
                type="text"
                value={additionalInfo.tanki}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, tanki: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Tanki"
              />
            </div>
            <div className="form-group">
              <label>Kaaj + Button</label>
              <input
                type="text"
                value={additionalInfo.kaajButton}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, kaajButton: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Kaaj + Button"
              />
            </div>
            <div className="form-group">
              <label>Finishing</label>
              <input
                type="text"
                value={additionalInfo.finishing}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, finishing: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Finishing"
              />
            </div>
            <div className="form-group">
              <label>Addition 1</label>
              <input
                type="text"
                value={additionalInfo.addition1}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, addition1: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Addition 1"
              />
            </div>
            <div className="form-group">
              <label>Addition 2</label>
              <input
                type="text"
                value={additionalInfo.addition2}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, addition2: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Addition 2"
              />
            </div>
            <div className="form-group">
              <label>Addition 3</label>
              <input
                type="text"
                value={additionalInfo.addition3}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, addition3: e.target.value })}
                disabled={!isEditMode}
                style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}}
                placeholder="Addition 3"
              />
            </div>
          </div>
        </div>
      </div>
      </div>

      {editingWorkerCell && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setEditingWorkerCell(null)}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              minWidth: '320px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px', fontSize: '20px' }}>
              {editingWorkerCell.field === 'front' ? 'Front'
                : editingWorkerCell.field === 'back' ? 'Back'
                : editingWorkerCell.field === 'zip' ? 'Zip'
                : editingWorkerCell.field === 'astar' ? 'Astar'
                : editingWorkerCell.field === 'beltProd' ? 'Belt'
                : editingWorkerCell.field === 'add1' ? 'Additional 1'
                : 'Additional 2'} — Worker / Date / Rate
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Worker</label>
                <select
                  value={popupWorker}
                  onChange={(e) => setPopupWorker(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                >
                  <option value="">Select worker</option>
                  {workers.map((w: any) => (
                    <option key={w._id} value={w._id}>
                      {w.worker_id} - {w.worker_full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Date</label>
                <input
                  type="date"
                  value={popupDate}
                  onChange={(e) => setPopupDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Rate</label>
                <input
                  type="number"
                  value={popupRate}
                  onChange={(e) => setPopupRate(e.target.value)}
                  placeholder="Rate"
                  step="0.01"
                  min="0"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingWorkerCell(null)}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveWorkerPopup}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
