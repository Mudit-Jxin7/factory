import { API_BASE_URL } from './base'

const handleError = (error: unknown) => ({
  success: false,
  error: error instanceof Error ? error.message : 'Unknown error',
})

export const brandsAPI = {
  getAllBrands: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/brands`)
      return await response.json()
    } catch (error) { return handleError(error) }
  },

  createBrand: async (brandData: Record<string, unknown>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandData),
      })
      return await response.json()
    } catch (error) { return handleError(error) }
  },

  updateBrand: async (id: string, brandData: Record<string, unknown>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/brands/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandData),
      })
      return await response.json()
    } catch (error) { return handleError(error) }
  },

  deleteBrand: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/brands/${id}`, { method: 'DELETE' })
      return await response.json()
    } catch (error) { return handleError(error) }
  },
}
