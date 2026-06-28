import { API_BASE_URL } from './base'

export const workersAPI = {
  getAllWorkers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers`)
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  createWorker: async (workerData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workerData),
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  updateWorker: async (id: string, workerData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workerData),
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  deleteWorker: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workers/${id}`, { method: 'DELETE' })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },
}
