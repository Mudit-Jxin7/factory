'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { lotsAPI, colorsAPI, brandsAPI, patternsAPI, fabricsAPI } from '@/lib/api'
import { Ratios, DEFAULT_RATIOS } from '@/lib/types'
import NavigationBar from './NavigationBar'
import ActionBar from './ActionBar'
import { useToast } from './ToastProvider'
import LotInfoForm from './dashboard/LotInfoForm'
import RatiosForm from './dashboard/RatiosForm'
import ProductionTable from './dashboard/ProductionTable'
import SummarySection from './dashboard/SummarySection'
import { exportLotToPDF, exportLotToExcel } from './dashboard/exportUtils'
import { useSaveLot } from './dashboard/useSaveLot'
import './dashboard.css'

const BLANK_ROW = { serialNumber: 1, meter: '', layer: '1', pieces: 0, color: '', shade: '', zip_code: '', thread_code: '' }

export default function DashboardContent() {
  const searchParams = useSearchParams()
  const toast = useToast()
  const saveLotFn = useSaveLot()

  const [saving, setSaving] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [generatingExcel, setGeneratingExcel] = useState(false)
  const [loadingLot, setLoadingLot] = useState(false)
  const [colors, setColors] = useState<any[]>([])
  const [fabrics, setFabrics] = useState<any[]>([])
  const [patterns, setPatterns] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [lotNumber, setLotNumber] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [fabric, setFabric] = useState('')
  const [pattern, setPattern] = useState('')
  const [brand, setBrand] = useState('')
  const [ratios, setRatios] = useState<Ratios>(DEFAULT_RATIOS)
  const [productionData, setProductionData] = useState([BLANK_ROW])
  const [tukda, setTukda] = useState({ count: 0, size: '28' })

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
    if (editLotNumber) loadLotForEdit(editLotNumber)
  }, [searchParams])

  const loadLotForEdit = async (lotNumberParam: string) => {
    setLoadingLot(true)
    try {
      const result = await lotsAPI.getLotByNumber(decodeURIComponent(lotNumberParam))
      if (result.success && result.lot) {
        const lot = result.lot
        setLotNumber(lot.lotNumber || '')
        setDate(lot.date || new Date().toISOString().split('T')[0])
        setFabric(lot.fabric || ''); setPattern(lot.pattern || ''); setBrand(lot.brand || '')
        setRatios(lot.ratios || DEFAULT_RATIOS)
        setProductionData(lot.productionData?.length > 0
          ? lot.productionData.map((row: any) => ({ ...row, meter: String(row.meter || ''), layer: String(row.layer || '1') }))
          : [BLANK_ROW])
        setTukda(lot.tukda || { count: 0, size: '28' })
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
  const totalPiecesWithTukda = useMemo(() => totalPieces + (Number(tukda.count) || 0), [totalPieces, tukda.count])
  const average = useMemo(() => {
    const denom = totalPieces + (Number(tukda.count) || 0)
    return denom === 0 ? 0 : totalMeter / denom
  }, [totalMeter, totalPieces, tukda.count])

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

  const addRow = () => {
    const newSN = productionData.length > 0 ? Math.max(...productionData.map(r => r.serialNumber)) + 1 : 1
    setProductionData([...productionData, { ...BLANK_ROW, serialNumber: newSN, pieces: 1 * sumOfRatios }])
  }

  const deleteRow = (index: number) => {
    setProductionData(productionData.filter((_, i) => i !== index).map((row, idx) => ({ ...row, serialNumber: idx + 1 })))
  }

  const handleSave = () => saveLotFn(
    { lotNumber, date, fabric, pattern, brand, ratios, productionData, tukda, totalMeter, totalPieces, totalPiecesWithTukda, average, editLotNumber: searchParams?.get('edit') },
    setSaving
  )

  const exportParams = { lotNumber, date, fabric, pattern, brand, ratios, sumOfRatios, productionData, tukda, totalMeter, totalPieces, totalPiecesWithTukda, average }

  if (loadingLot) {
    return (
      <><NavigationBar />
        <div className="dashboard-container">
          <div className="loading-container"><div className="spinner" /><p>Loading lot data&hellip;</p></div>
        </div>
      </>
    )
  }

  const isEdit = !!searchParams?.get('edit')
  return (
    <>
      <NavigationBar />
      <ActionBar actions={[
        { label: isEdit ? 'Update Lot' : 'Save Lot', shortLabel: isEdit ? 'Update' : 'Save', icon: '💾', onClick: handleSave, disabled: saving || loadingLot, loading: saving || loadingLot, loadingLabel: loadingLot ? '…' : 'Saving…' },
        { label: 'Download PDF', shortLabel: 'PDF', icon: '📄', onClick: () => { setGeneratingPDF(true); try { exportLotToPDF(exportParams) } catch (e: any) { toast.showToast('Error: ' + e.message, 'error') } finally { setGeneratingPDF(false) } }, loading: generatingPDF, loadingLabel: '…' },
        { label: 'Download Excel', shortLabel: 'Excel', icon: '📊', onClick: () => { setGeneratingExcel(true); try { exportLotToExcel(exportParams); toast.showToast('Excel exported!', 'success') } catch (e: any) { toast.showToast('Error: ' + e.message, 'error') } finally { setGeneratingExcel(false) } }, loading: generatingExcel, loadingLabel: '…' },
      ]} />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-title">
            <h1>{isEdit ? 'Edit Lot' : 'Lot Production Dashboard'}</h1>
            <p>{isEdit ? 'Edit existing lot production data' : 'Track and manage production data'}</p>
          </div>
        </div>
        <div className="dashboard-content">
          <LotInfoForm
            lotNumber={lotNumber} date={date} fabric={fabric} pattern={pattern} brand={brand}
            fabrics={fabrics} patterns={patterns} brands={brands}
            onLotNumberChange={setLotNumber} onDateChange={setDate}
            onFabricChange={setFabric} onPatternChange={setPattern} onBrandChange={setBrand}
          />
          <RatiosForm ratios={ratios} sumOfRatios={sumOfRatios} onRatioChange={updateRatio} />
          <ProductionTable
            productionData={productionData} colors={colors}
            onUpdate={updateProductionData} onBlurMeter={handleBlurMeter} onBlurLayer={handleBlurLayer}
            onAddRow={addRow} onDeleteRow={deleteRow}
          />
          <SummarySection
            tukda={tukda} totalMeter={totalMeter} totalPieces={totalPieces}
            totalPiecesWithTukda={totalPiecesWithTukda} average={average}
            onTukdaCountChange={(v) => { if (v === '' || /^[0-9]+$/.test(v)) setTukda({ ...tukda, count: v === '' ? 0 : Number(v) }) }}
            onTukdaCountBlur={(v) => { const n = Number(v); setTukda({ ...tukda, count: v === '' || isNaN(n) || n < 0 ? 0 : Math.floor(n) }) }}
            onTukdaSizeChange={(v) => setTukda({ ...tukda, size: v })}
          />
        </div>
      </div>
    </>
  )
}
