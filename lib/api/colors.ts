import { API_BASE_URL } from './base'

export const colorsAPI = {
  getAllColors: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/colors`)
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  createColor: async (colorData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colorData),
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  updateColor: async (id: string, colorData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/colors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colorData),
      })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  deleteColor: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/colors/${id}`, { method: 'DELETE' })
      return await response.json()
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },
}
