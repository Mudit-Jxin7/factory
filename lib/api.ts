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

  /**
   * Update an existing lot by lot number
   */
  updateLot: async (lotNumber: string, lotData: any) => {
    try {
      const encodedLotNumber = encodeURIComponent(lotNumber)
      const response = await fetch(`${API_BASE_URL}/lots/${encodedLotNumber}`, {
        method: 'PUT',
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
   * Delete a lot by lot number
   */
  deleteLot: async (lotNumber: string) => {
    try {
      const encodedLotNumber = encodeURIComponent(lotNumber)
      const response = await fetch(`${API_BASE_URL}/lots/${encodedLotNumber}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },
}

// Job Cards API
export const jobCardsAPI = {
  /**
   * Get all job cards
   */
  getAllJobCards: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobcards`)
      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Get a job card by lot number
   */
  getJobCardByLotNumber: async (lotNumber: string) => {
    try {
      const encodedLotNumber = encodeURIComponent(lotNumber)
      const response = await fetch(`${API_BASE_URL}/jobcards/${encodedLotNumber}`)
      const result = await response.json()
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Job card not found' }
      }
      
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Create a new job card
   */
  createJobCard: async (jobCardData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobCardData),
      })

      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Update a job card by lot number
   */
  updateJobCard: async (lotNumber: string, jobCardData: any) => {
    try {
      const encodedLotNumber = encodeURIComponent(lotNumber)
      const response = await fetch(`${API_BASE_URL}/jobcards/${encodedLotNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobCardData),
      })

      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Delete a job card by lot number
   */
  deleteJobCard: async (lotNumber: string) => {
    try {
      const encodedLotNumber = encodeURIComponent(lotNumber)
      const response = await fetch(`${API_BASE_URL}/jobcards/${encodedLotNumber}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },
}

// Colors API
export const colorsAPI = {
  getAllColors: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/colors`)
      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  createColor: async (colorData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/colors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(colorData),
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  updateColor: async (id: string, colorData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/colors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(colorData),
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  deleteColor: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/colors/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },
}

// Workers API
export const workersAPI = {
  getAllWorkers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers`)
      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  createWorker: async (workerData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workerData),
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  updateWorker: async (id: string, workerData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workerData),
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  deleteWorker: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },
}

export default lotsAPI
