import api from '@/lib/api'
import type { Tax, PaginatedResponse, ApiResponse } from '@/types'

export const taxesService = {
  getTaxes(query?: string) {
    const suffix = query ? `?${query}` : ''
    return api.get<PaginatedResponse<Tax>>(`/api/taxes${suffix}`)
  },

  createTax(payload: Partial<Tax>) {
    return api.post<ApiResponse<Tax>>('/api/taxes', payload)
  },

  updateTax(id: string, payload: Partial<Tax>) {
    return api.put<ApiResponse<Tax>>(`/api/taxes/${id}`, payload)
  },

  toggleTax(id: string) {
    return api.patch<ApiResponse<Tax>>(`/api/taxes/${id}/toggle`)
  },

  deleteTax(id: string) {
    return api.delete<ApiResponse<unknown>>(`/api/taxes/${id}`)
  },
}
