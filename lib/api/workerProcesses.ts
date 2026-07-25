import { API_BASE_URL } from './base'

const handleError = (error: unknown) => ({
  success: false,
  error: error instanceof Error ? error.message : 'Unknown error',
})

export const workerProcessesAPI = {
  getAllProcesses: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/worker-processes`)
      return await response.json()
    } catch (error) { return handleError(error) }
  },

  createProcess: async (processData: Record<string, unknown>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/worker-processes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processData),
      })
      return await response.json()
    } catch (error) { return handleError(error) }
  },

  updateProcess: async (id: string, processData: Record<string, unknown>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/worker-processes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processData),
      })
      return await response.json()
    } catch (error) { return handleError(error) }
  },

  deleteProcess: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/worker-processes/${id}`, { method: 'DELETE' })
      return await response.json()
    } catch (error) { return handleError(error) }
  },
}
