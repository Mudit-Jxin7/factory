'use client'

import { useRouter } from 'next/navigation'
import { lotsAPI, jobCardsAPI } from '@/lib/api'
import { Ratios, AdditionalInfo, LotWorkerRates } from '@/lib/types'
import { applyLotRatesToProduction, getMissingLotWorkerRateLabels, normalizeLotWorkerRates } from '@/lib/lotWorkerRates'
import { useToast } from '../ToastProvider'

interface ProductionRow {
  serialNumber: number
  meter: string
  layer: string
  pieces: number
  color: string
  shade: string
  zip_code: string
  thread_code: string
  tukda?: string | number
}

interface SaveLotParams {
  lotNumber: string
  date: string
  fabric: string
  pattern: string
  brand: string
  ratios: Ratios
  productionData: ProductionRow[]
  tukda: { count: number; size: string }
  totalMeter: number
  totalPieces: number
  totalPiecesWithTukda: number
  average: number
  flyWidth: string
  additionalInfo: AdditionalInfo
  workerRates: LotWorkerRates
  editLotNumber?: string | null
}

export function useSaveLot() {
  const router = useRouter()
  const toast = useToast()

  const saveLot = async (params: SaveLotParams, setSaving: (v: boolean) => void) => {
    const {
      lotNumber, date, fabric, pattern, brand, ratios, productionData, tukda,
      totalMeter, totalPieces, totalPiecesWithTukda, average, flyWidth, additionalInfo,
      workerRates, editLotNumber,
    } = params
    if (!lotNumber.trim()) { toast.showToast('Please enter a lot number', 'warning'); return }
    const missingRates = getMissingLotWorkerRateLabels(workerRates)
    if (missingRates.length > 0) {
      toast.showToast(`Please enter worker rates for: ${missingRates.join(', ')}`, 'warning')
      return
    }
    setSaving(true)
    try {
      const normalizedRates = normalizeLotWorkerRates(workerRates)
      const lotData = {
        lotNumber, date, fabric, pattern, brand, ratios,
        productionData: productionData.map(row => ({
          ...row, meter: Number(row.meter) || 0, layer: Number(row.layer) || 1,
          color: row.color || '', shade: row.shade || '', zip_code: row.zip_code || '', thread_code: row.thread_code || '',
          tukda: Number(row.tukda) || 0,
        })),
        tukda, totalMeter, totalPieces, totalPiecesWithTukda, average,
        flyWidth, additionalInfo,
        workerRates: normalizedRates,
      }

      const isUpdate = editLotNumber && decodeURIComponent(editLotNumber) === lotNumber
      let result

      if (isUpdate) {
        result = await lotsAPI.updateLot(lotNumber, lotData)
        if (result.success) {
          try {
            const jcResult = await jobCardsAPI.getJobCardByLotNumber(lotNumber)
            if (jcResult.success && jcResult.jobCard) {
              const existing = jcResult.jobCard
              const mergedProdData = applyLotRatesToProduction(
                productionData.map((lotRow, i) => {
                  const existingRow = existing.productionData?.[i] || {}
                  return {
                    ...existingRow,
                    serialNumber: lotRow.serialNumber,
                    layer: Number(lotRow.layer) || 1,
                    pieces: Number(lotRow.pieces) || 0,
                    tukda: Number(lotRow.tukda) || 0,
                    color: lotRow.color || '',
                    shade: lotRow.shade || '',
                    zip_code: lotRow.zip_code || '',
                    thread_code: lotRow.thread_code || '',
                  }
                }),
                normalizedRates,
              )
              await jobCardsAPI.updateJobCard(lotNumber, {
                lotNumber, date, brand, ratios, productionData: mergedProdData, flyWidth, additionalInfo,
                status: existing.status ?? 'incomplete',
                workerRates: normalizedRates,
                workerPrices: {},
              })
            }
          } catch (err) { console.error('Error syncing job card:', err) }
        }
      } else {
        result = await lotsAPI.saveLot(lotData)
        if (result.success) {
          try {
            await jobCardsAPI.createJobCard({
              lotId: result.id ? String(result.id) : undefined,
              lotNumber, date, brand, worker: '', rate: '', ratios,
              productionData: productionData.map(row => ({
                serialNumber: row.serialNumber,
                layer: Number(row.layer) || 1,
                pieces: Number(row.pieces) || 0,
                tukda: Number(row.tukda) || 0,
                color: row.color || '',
                shade: row.shade || '',
                front: '', back: '',
                zip_code: row.zip_code || '',
                thread_code: row.thread_code || '',
              })),
              flyWidth, additionalInfo,
              status: 'incomplete',
              workerRates: normalizedRates,
              workerPrices: {},
            })
          } catch (err) { console.error('Error auto-creating job card:', err) }
        }
      }

      if (result.success) {
        const isNew = !editLotNumber || decodeURIComponent(editLotNumber) !== lotNumber
        toast.showToast(isNew ? 'Lot saved successfully!' : 'Lot updated successfully!', 'success')
        if (isNew) {
          router.replace(`/dashboard?edit=${encodeURIComponent(lotNumber)}`)
        }
      } else {
        toast.showToast('Error saving lot: ' + result.error, 'error')
      }
    } catch (error: any) {
      toast.showToast('Error saving lot: ' + error.message, 'error')
    } finally { setSaving(false) }
  }

  return saveLot
}
