import { jobCardsAPI } from './api'
import { DEFAULT_ADDITIONAL_INFO, DEFAULT_LOT_WORKER_RATES } from './types'
import { normalizeLotWorkerRates } from './lotWorkerRates'

export const createJobCardFromLot = async (lotData: any) => {
  try {
    const workerRates = normalizeLotWorkerRates(lotData.workerRates || DEFAULT_LOT_WORKER_RATES)
    const jobCardData = {
      lotId: lotData._id ? String(lotData._id) : undefined,
      lotNumber: lotData.lotNumber,
      date: lotData.date || new Date().toISOString().split('T')[0],
      brand: lotData.brand || '',
      worker: '',
      rate: '',
      ratios: lotData.ratios || {
        r28: 0, r30: 0, r32: 0, r34: 0, r36: 0,
        r38: 0, r40: 0, r42: 0, r44: 0,
      },
      productionData: (lotData.productionData || []).map((row: any, index: number) => ({
        serialNumber: index + 1,
        layer: Number(row.layer) || 1,
        pieces: Number(row.pieces) || 0,
        tukda: Number(row.tukda) || 0,
        color: row.color || '',
        shade: row.shade || '',
        front: '',
        back: '',
        zip_code: '',
        thread_code: '',
      })),
      flyWidth: lotData.flyWidth ?? '',
      additionalInfo: { ...DEFAULT_ADDITIONAL_INFO, ...(lotData.additionalInfo || {}) },
      status: 'incomplete',
      workerRates,
      workerPrices: {},
    }
    await jobCardsAPI.createJobCard(jobCardData)
  } catch (error) {
    console.error(`Error auto-creating job card for lot ${lotData.lotNumber}:`, error)
  }
}
