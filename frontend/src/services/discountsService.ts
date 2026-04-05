import api from '@/lib/api'
import type { Discount, PaginatedResponse, ApiResponse } from '@/types'

export const discountsService = {
  getDiscounts(query?: string) {
    const suffix = query ? `?${query}` : ''
    return api.get<PaginatedResponse<Discount>>(`/api/discounts${suffix}`)
  },

  createDiscount(payload: Partial<Discount>) {
    return api.post<ApiResponse<Discount>>('/api/discounts', payload)
  },

  updateDiscount(id: string, payload: Partial<Discount>) {
    return api.put<ApiResponse<Discount>>(`/api/discounts/${id}`, payload)
  },

  toggleDiscount(id: string) {
    return api.patch<ApiResponse<Discount>>(`/api/discounts/${id}/toggle`)
  },

  deleteDiscount(id: string) {
    return api.delete<ApiResponse<unknown>>(`/api/discounts/${id}`)
  },
}
