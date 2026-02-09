const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

/**
 * API Service Layer for Next.js
 */

// Lots API
export const lotsAPI = {
  /**
   * Save a new lot
   */
  saveLot: async (lotData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lotData),
      })

      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Get all lots
   */
  getAllLots: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lots`)
      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Get a specific lot by lot number
   */
  getLotByNumber: async (lotNumber: string) => {
    try {
      // Encode lot number for URL
      const encodedLotNumber = encodeURIComponent(lotNumber)
      const response = await fetch(`${API_BASE_URL}/lots/${encodedLotNumber}`)
      const result = await response.json()
      
      // Check HTTP status
      if (!response.ok) {
        return { success: false, error: result.error || 'Lot not found' }
      }
      
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },
}

export default lotsAPI
