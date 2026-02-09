const API_BASE_URL = 'http://localhost:3001/api'

/**
 * API Service Layer
 * Centralized API endpoints for the application
 * Note: Authentication is handled in frontend only (see AuthContext.jsx)
 */

// Lots API
export const lotsAPI = {
  /**
   * Save a new lot
   * @param {Object} lotData - Lot data object
   * @returns {Promise<{success: boolean, id?: string, lotNumber?: string, error?: string}>}
   */
  saveLot: async (lotData) => {
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
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Get all lots
   * @returns {Promise<{success: boolean, lots?: Array, error?: string}>}
   */
  getAllLots: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lots`)
      const result = await response.json()
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Get a specific lot by lot number
   * @param {string} lotNumber - Lot number
   * @returns {Promise<{success: boolean, lot?: Object, error?: string}>}
   */
  getLotByNumber: async (lotNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lots/${lotNumber}`)
      const result = await response.json()
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Get a specific lot by ID
   * @param {string} id - Lot ID
   * @returns {Promise<{success: boolean, lot?: Object, error?: string}>}
   */
  getLotById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lots/id/${id}`)
      const result = await response.json()
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Update a lot
   * @param {string} lotNumber - Lot number
   * @param {Object} lotData - Updated lot data
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  updateLot: async (lotNumber, lotData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lots/${lotNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lotData),
      })

      const result = await response.json()
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Delete a lot
   * @param {string} lotNumber - Lot number
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  deleteLot: async (lotNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lots/${lotNumber}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
}

// Export all APIs as a single object
const api = {
  lots: lotsAPI,
}

export default api
