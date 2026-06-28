import { API_BASE_URL } from './base'

export const lotsAPI = {
  saveLot: async (lotData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lotData),
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  getAllLots: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lots`)
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  getLotByNumber: async (lotNumber: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lots/${encodeURIComponent(lotNumber)}`)
      const result = await response.json()
      if (!response.ok) return { success: false, error: result.error || 'Lot not found' }
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  updateLot: async (lotNumber: string, lotData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lots/${encodeURIComponent(lotNumber)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lotData),
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  deleteLot: async (lotNumber: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lots/${encodeURIComponent(lotNumber)}`, {
        method: 'DELETE',
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },
}
