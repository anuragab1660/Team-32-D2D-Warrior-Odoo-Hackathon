import api from '@/lib/api'
import type { RecurringPlan, PaginatedResponse, ApiResponse } from '@/types'

export const plansService = {
  getPlans(query?: string) {
    const suffix = query ? `?${query}` : ''
    return api.get<PaginatedResponse<RecurringPlan>>(`/api/plans${suffix}`)
  },

  createPlan(payload: Partial<RecurringPlan>) {
    return api.post<ApiResponse<RecurringPlan>>('/api/plans', payload)
  },

  updatePlan(id: string, payload: Partial<RecurringPlan>) {
    return api.put<ApiResponse<RecurringPlan>>(`/api/plans/${id}`, payload)
  },

  togglePlan(id: string) {
    return api.patch<ApiResponse<RecurringPlan>>(`/api/plans/${id}/toggle`)
  },

  deletePlan(id: string) {
    return api.delete<ApiResponse<unknown>>(`/api/plans/${id}`)
  },
}
