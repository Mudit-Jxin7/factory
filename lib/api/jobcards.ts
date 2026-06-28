import { API_BASE_URL } from './base'

export const jobCardsAPI = {
  getAllJobCards: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobcards`)
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  getJobCardByLotNumber: async (lotNumber: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobcards/${encodeURIComponent(lotNumber)}`)
      const result = await response.json()
      if (!response.ok) return { success: false, error: result.error || 'Job card not found' }
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  createJobCard: async (jobCardData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobCardData),
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  updateJobCard: async (lotNumber: string, jobCardData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobcards/${encodeURIComponent(lotNumber)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobCardData),
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  deleteJobCard: async (lotNumber: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobcards/${encodeURIComponent(lotNumber)}`, {
        method: 'DELETE',
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },
}
