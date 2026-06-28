import { API_BASE_URL } from './base'

const handleError = (error: unknown) => ({
  success: false,
  error: error instanceof Error ? error.message : 'Unknown error',
})

export const patternsAPI = {
  getAllPatterns: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/patterns`)
      return await response.json()
    } catch (error) { return handleError(error) }
  },

  createPattern: async (patternData: Record<string, unknown>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patterns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patternData),
      })
      return await response.json()
    } catch (error) { return handleError(error) }
  },

  updatePattern: async (id: string, patternData: Record<string, unknown>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patterns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patternData),
      })
      return await response.json()
    } catch (error) { return handleError(error) }
  },

  deletePattern: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patterns/${id}`, { method: 'DELETE' })
      return await response.json()
    } catch (error) { return handleError(error) }
  },
}
