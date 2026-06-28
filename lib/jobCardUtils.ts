import { jobCardsAPI } from './api'

export const createJobCardFromLot = async (lotData: any) => {
  try {
    const jobCardData = {
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
        color: row.color || '',
        shade: row.shade || '',
        front: '',
        back: '',
        zip_code: '',
        thread_code: '',
      })),
      flyWidth: '',
      additionalInfo: {
        belt: '', bottom: '', pasting: '', bone: '', hala: '', ticketPocket: '',
      },
    }
    await jobCardsAPI.createJobCard(jobCardData)
  } catch (error) {
    console.error(`Error auto-creating job card for lot ${lotData.lotNumber}:`, error)
  }
}
