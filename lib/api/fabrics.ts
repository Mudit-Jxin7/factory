import { API_BASE_URL } from './base'

const handleError = (error: unknown) => ({
  success: false,
  error: error instanceof Error ? error.message : 'Unknown error',
})

export const fabricsAPI = {
  getAllFabrics: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/fabrics`)
      return await response.json()
    } catch (error) { return handleError(error) }
  },

  createFabric: async (fabricData: Record<string, unknown>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/fabrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fabricData),
      })
      return await response.json()
    } catch (error) { return handleError(error) }
  },

  updateFabric: async (id: string, fabricData: Record<string, unknown>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/fabrics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fabricData),
      })
      return await response.json()
    } catch (error) { return handleError(error) }
  },

  deleteFabric: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/fabrics/${id}`, { method: 'DELETE' })
      return await response.json()
    } catch (error) { return handleError(error) }
  },
}
