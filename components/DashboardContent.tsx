'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { lotsAPI, colorsAPI, brandsAPI, patternsAPI, fabricsAPI, jobCardsAPI } from '@/lib/api'
import { Ratios, AdditionalInfo, LotWorkerRates, DEFAULT_RATIOS, DEFAULT_ADDITIONAL_INFO, DEFAULT_LOT_WORKER_RATES } from '@/lib/types'
import NavigationBar from './NavigationBar'
import ActionBar from './ActionBar'
import { IconSave, IconPdf, IconTable } from './Icons'
import { useToast } from './ToastProvider'
import LotInfoForm from './dashboard/LotInfoForm'
import RatiosForm from './dashboard/RatiosForm'
import ProductionTable from './dashboard/ProductionTable'
import SummarySection from './dashboard/SummarySection'
import LotRatesForm from './dashboard/LotRatesForm'
import JobCardAdditionalInfo from './jobcard/JobCardAdditionalInfo'
import { isAdditionalInfoEmpty, normalizeAdditionalInfo } from '@/lib/additionalInfoExport'
import { exportLotToPDF, exportLotToExcel } from './dashboard/exportUtils'
import { useSaveLot } from './dashboard/useSaveLot'
import { todayISODateIST } from '@/lib/dateFormat'
import './dashboard.css'

const BLANK_ROW = { serialNumber: 1, meter: '', layer: '1', pieces: 0, color: '', shade: '', zip_code: '', thread_code: '', tukda: '' }

export default function DashboardContent() {
  const searchParams = useSearchParams()
  const toast = useToast()
  const saveLotFn = useSaveLot()

  const [saving, setSaving] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [generatingExcel, setGeneratingExcel] = useState(false)
  const [loadingLot, setLoadingLot] = useState(false)
  const [lotNumberError, setLotNumberError] = useState<string | null>(null)
  const [colors, setColors] = useState<any[]>([])
  const [fabrics, setFabrics] = useState<any[]>([])
  const [patterns, setPatterns] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [lotNumber, setLotNumber] = useState('')
  const [date, setDate] = useState(todayISODateIST())
  const [fabric, setFabric] = useState('')
  const [pattern, setPattern] = useState('')
  const [brand, setBrand] = useState('')
  const [ratios, setRatios] = useState<Ratios>(DEFAULT_RATIOS)
  const [productionData, setProductionData] = useState([BLANK_ROW])
  const [tukdaSize, setTukdaSize] = useState('28')
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>(DEFAULT_ADDITIONAL_INFO)
  const [workerRates, setWorkerRates] = useState<LotWorkerRates>(DEFAULT_LOT_WORKER_RATES)

  useEffect(() => {
    colorsAPI.getAllColors().then(r => { if (r.success) setColors(r.colors || []) })
    Promise.all([fabricsAPI.getAllFabrics(), patternsAPI.getAllPatterns(), brandsAPI.getAllBrands()])
      .then(([fr, pr, br]) => {
        if (fr.success) setFabrics(fr.fabrics || [])
        if (pr.success) setPatterns(pr.patterns || [])
        if (br.success) setBrands(br.brands || [])
      })
  }, [])

  useEffect(() => {
    const editLotNumber = searchParams?.get('edit')
    const tukdaFrom = searchParams?.get('tukdaFrom')
    if (editLotNumber) loadLotForEdit(editLotNumber)
    else if (tukdaFrom) loadLotForTukda(tukdaFrom)
  }, [searchParams])

  const loadLotForEdit = async (lotNumberParam: string) => {
    setLoadingLot(true)
    try {
      const result = await lotsAPI.getLotByNumber(decodeURIComponent(lotNumberParam))
      if (result.success && result.lot) {
        const lot = result.lot
        setLotNumber(lot.lotNumber || '')
        setDate(lot.date || todayISODateIST())
        setFabric(lot.fabric || ''); setPattern(lot.pattern || ''); setBrand(lot.brand || '')
        setRatios(lot.ratios || DEFAULT_RATIOS)
        setProductionData(lot.productionData?.length > 0
          ? lot.productionData.map((row: any) => ({
            ...row,
            meter: String(row.meter || ''),
            layer: String(row.layer || '1'),
            tukda: row.tukda !== undefined && row.tukda !== null ? String(row.tukda) : '',
          }))
          : [BLANK_ROW])
        setTukdaSize(lot.tukda?.size || '28')
        setAdditionalInfo(normalizeAdditionalInfo(lot.additionalInfo, lot.flyWidth))
        setWorkerRates({ ...DEFAULT_LOT_WORKER_RATES, ...(lot.workerRates || {}) })
        if (isAdditionalInfoEmpty(lot.additionalInfo, lot.flyWidth)) {
          const jcResult = await jobCardsAPI.getJobCardByLotNumber(lot.lotNumber)
          if (jcResult.success && jcResult.jobCard && !isAdditionalInfoEmpty(jcResult.jobCard.additionalInfo, jcResult.jobCard.flyWidth)) {
            setAdditionalInfo(normalizeAdditionalInfo(jcResult.jobCard.additionalInfo, jcResult.jobCard.flyWidth))
          }
        }
      } else {
        toast.showToast('Error loading lot: ' + (result.error || 'Lot not found'), 'error')
      }
    } catch (error: any) {
      toast.showToast('Error loading lot: ' + error.message, 'error')
    } finally { setLoadingLot(false) }
  }

  /** Prefill a new tukda lot from an existing lot: `{lotNumber}_lot`, today, ratios/table/summary zeroed; carry worker rates + additional info. */
  const loadLotForTukda = async (sourceLotNumber: string) => {
    setLoadingLot(true)
    try {
      const decoded = decodeURIComponent(sourceLotNumber)
      const result = await lotsAPI.getLotByNumber(decoded)
      if (result.success && result.lot) {
        const lot = result.lot
        setLotNumber(`${lot.lotNumber}_lot`)
        setDate(todayISODateIST())
        setFabric(lot.fabric || '')
        setPattern(lot.pattern || '')
        setBrand(lot.brand || '')
        setRatios(DEFAULT_RATIOS)
        setProductionData([{ ...BLANK_ROW }])
        setTukdaSize('28')
        setWorkerRates({ ...DEFAULT_LOT_WORKER_RATES, ...(lot.workerRates || {}) })
        let info = normalizeAdditionalInfo(lot.additionalInfo, lot.flyWidth)
        if (isAdditionalInfoEmpty(lot.additionalInfo, lot.flyWidth)) {
          const jcResult = await jobCardsAPI.getJobCardByLotNumber(lot.lotNumber)
          if (jcResult.success && jcResult.jobCard && !isAdditionalInfoEmpty(jcResult.jobCard.additionalInfo, jcResult.jobCard.flyWidth)) {
            info = normalizeAdditionalInfo(jcResult.jobCard.additionalInfo, jcResult.jobCard.flyWidth)
          }
        }
        setAdditionalInfo(info)
        setLotNumberError(null)
        // Check uniqueness of the new tukda lot number
        const newLotNumber = `${lot.lotNumber}_lot`
        const exists = await lotsAPI.getLotByNumber(newLotNumber)
        if (exists.success && exists.lot) {
          setLotNumberError(`Lot number "${newLotNumber}" already exists`)
        }
      } else {
        toast.showToast('Error loading lot: ' + (result.error || 'Lot not found'), 'error')
      }
    } catch (error: any) {
      toast.showToast('Error loading lot: ' + error.message, 'error')
    } finally { setLoadingLot(false) }
  }

  const sumOfRatios = useMemo(() => Object.values(ratios).reduce((sum, val) => sum + (Number(val) || 0), 0), [ratios])
  const totalMeter = useMemo(() => productionData.reduce((sum, row) => sum + (Number(row.meter) || 0), 0), [productionData])
  const totalPieces = useMemo(() => productionData.reduce((sum, row) => sum + (Number(row.pieces) || 0), 0), [productionData])
  const totalTukda = useMemo(() => productionData.reduce((sum, row) => sum + (Number(row.tukda) || 0), 0), [productionData])
  const tukda = useMemo(() => ({ count: totalTukda, size: tukdaSize }), [totalTukda, tukdaSize])
  const totalPiecesWithTukda = useMemo(() => totalPieces + totalTukda, [totalPieces, totalTukda])
  const average = useMemo(() => {
    const denom = totalPieces + totalTukda
    return denom === 0 ? 0 : totalMeter / denom
  }, [totalMeter, totalPieces, totalTukda])

  const updateRatio = (ratioKey: string, value: string) => {
    let num = Number(value) || 0
    if (num > 0 && num < 0.5) num = 0.5
    else if (num > 0) num = Math.round(num * 2) / 2
    const newRatios = { ...ratios, [ratioKey]: num }
    setRatios(newRatios)
    const newSum = Object.values(newRatios).reduce((s, v) => s + (Number(v) || 0), 0)
    setProductionData(prev => prev.map(row => ({ ...row, pieces: (Number(row.layer) || 0) * newSum })))
  }

  const updateProductionData = (index: number, field: string, value: string) => {
    const newData = [...productionData]
    if (field === 'layer') {
      if (value === '') { newData[index] = { ...newData[index], layer: '' }; setProductionData(newData); return }
      if (!/^[1-9][0-9]*$/.test(value)) return
      newData[index] = { ...newData[index], layer: value }
    } else if (field === 'meter') {
      if (value === '' || value === '0') { newData[index] = { ...newData[index], meter: '' }; setProductionData(newData); return }
      if (!/^[0-9]*\.?[0-9]*$/.test(value)) return
      newData[index] = { ...newData[index], meter: value }
    } else if (field === 'color') {
      newData[index] = { ...newData[index], color: value, shade: value }
    } else if (field === 'tukda') {
      if (value === '') { newData[index] = { ...newData[index], tukda: '' }; setProductionData(newData); return }
      if (!/^[0-9]+$/.test(value)) return
      newData[index] = { ...newData[index], tukda: value }
    } else {
      newData[index] = { ...newData[index], [field]: value }
    }
    if (field === 'layer' || field === 'meter') newData[index].pieces = (Number(newData[index].layer) || 0) * sumOfRatios
    setProductionData(newData)
  }

  const handleBlurMeter = (index: number, value: string) => {
    const num = Number(value)
    updateProductionData(index, 'meter', value === '' || isNaN(num) || num < 0 ? '' : num.toString())
  }

  const handleBlurLayer = (index: number, value: string) => {
    const num = Number(value)
    const natural = value === '' || isNaN(num) || num < 1 ? '1' : Math.max(1, Math.floor(num)).toString()
    updateProductionData(index, 'layer', natural)
  }

  const handleBlurTukda = (index: number, value: string) => {
    const num = Number(value)
    updateProductionData(index, 'tukda', value === '' || isNaN(num) || num < 0 ? '' : Math.floor(num).toString())
  }

  const addRow = () => {
    const newSN = productionData.length > 0 ? Math.max(...productionData.map(r => r.serialNumber)) + 1 : 1
    setProductionData([...productionData, { ...BLANK_ROW, serialNumber: newSN, pieces: 1 * sumOfRatios }])
  }

  const deleteRow = (index: number) => {
    setProductionData(productionData.filter((_, i) => i !== index).map((row, idx) => ({ ...row, serialNumber: idx + 1 })))
  }

  const isEdit = !!searchParams?.get('edit')
  const isTukdaFrom = !!searchParams?.get('tukdaFrom')

  const handleLotNumberBlur = async () => {
    if (isEdit || !lotNumber.trim()) { setLotNumberError(null); return }
    const result = await lotsAPI.getLotByNumber(lotNumber.trim())
    if (result.success && result.lot) {
      setLotNumberError(`Lot number "${lotNumber}" already exists`)
    } else {
      setLotNumberError(null)
    }
  }

  const handleSave = () => saveLotFn(
    { lotNumber, date, fabric, pattern, brand, ratios, productionData, tukda, totalMeter, totalPieces, totalPiecesWithTukda, average, flyWidth: additionalInfo.flyWidth, additionalInfo, workerRates, editLotNumber: searchParams?.get('edit') },
    setSaving
  )

  const exportParams = { lotNumber, date, fabric, pattern, brand, ratios, sumOfRatios, productionData, tukda, totalMeter, totalPieces, totalPiecesWithTukda, average, flyWidth: additionalInfo.flyWidth, additionalInfo }

  if (loadingLot) {
    return (
      <><NavigationBar />
        <div className="dashboard-container">
          <div className="loading-container"><div className="spinner" /><p>Loading lot data&hellip;</p></div>
        </div>
      </>
    )
  }

  return (
    <>
      <NavigationBar />
      <ActionBar actions={[
        { label: isEdit ? 'Update Lot' : 'Save Lot', shortLabel: isEdit ? 'Update' : 'Save', icon: <IconSave size={14} />, onClick: handleSave, disabled: saving || loadingLot || !!lotNumberError, loading: saving || loadingLot, loadingLabel: loadingLot ? '…' : 'Saving…' },
        { label: 'Download PDF', shortLabel: 'PDF', icon: <IconPdf size={14} />, onClick: () => { setGeneratingPDF(true); try { exportLotToPDF(exportParams) } catch (e: any) { toast.showToast('Error: ' + e.message, 'error') } finally { setGeneratingPDF(false) } }, loading: generatingPDF, loadingLabel: '…' },
        { label: 'Download Excel', shortLabel: 'Excel', icon: <IconTable size={14} />, onClick: () => { setGeneratingExcel(true); try { exportLotToExcel(exportParams); toast.showToast('Excel exported!', 'success') } catch (e: any) { toast.showToast('Error: ' + e.message, 'error') } finally { setGeneratingExcel(false) } }, loading: generatingExcel, loadingLabel: '…' },
      ]} />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-title">
            <h1>{isEdit ? 'Edit Lot' : isTukdaFrom ? 'New Tukda Lot' : 'Lot Production Dashboard'}</h1>
            <p>{isEdit ? 'Edit existing lot production data' : isTukdaFrom ? 'Create a tukda lot from an existing lot' : 'Track and manage production data'}</p>
          </div>
        </div>
        <div className="dashboard-content">
          <LotInfoForm
            lotNumber={lotNumber} date={date} fabric={fabric} pattern={pattern} brand={brand}
            fabrics={fabrics} patterns={patterns} brands={brands}
            lotNumberError={isEdit ? null : lotNumberError}
            onLotNumberChange={(v) => { setLotNumber(v); setLotNumberError(null) }}
            onLotNumberBlur={handleLotNumberBlur}
            onDateChange={setDate}
            onFabricChange={setFabric} onPatternChange={setPattern} onBrandChange={setBrand}
          />
          <RatiosForm ratios={ratios} sumOfRatios={sumOfRatios} onRatioChange={updateRatio} />
          <ProductionTable
            productionData={productionData} colors={colors}
            onUpdate={updateProductionData} onBlurMeter={handleBlurMeter} onBlurLayer={handleBlurLayer}
            onBlurTukda={handleBlurTukda}
            onAddRow={addRow} onDeleteRow={deleteRow}
          />
          <SummarySection
            tukda={tukda} totalMeter={totalMeter} totalPieces={totalPieces}
            totalPiecesWithTukda={totalPiecesWithTukda} average={average}
            productionData={productionData}
            onTukdaSizeChange={setTukdaSize}
          />
          <LotRatesForm
            workerRates={workerRates}
            onRateChange={(key, value) => setWorkerRates((prev) => ({ ...prev, [key]: value }))}
          />
          <JobCardAdditionalInfo
            additionalInfo={additionalInfo} isEditMode
            onAdditionalInfoChange={(key, value) => setAdditionalInfo((prev) => ({ ...prev, [key]: value }))}
          />
        </div>
      </div>
    </>
  )
}
