import api from '@/lib/api'
import type { Subscription, PaginatedResponse, ApiResponse } from '@/types'

export const subscriptionsService = {
  getSubscriptions(query: string) {
    return api.get<PaginatedResponse<Subscription>>(`/api/subscriptions?${query}`)
  },

  getMySubscriptions() {
    return api.get<ApiResponse<Subscription[]>>('/api/subscriptions/my')
  },

  createSubscription(payload: Partial<Subscription>) {
    return api.post<ApiResponse<Subscription>>('/api/subscriptions', payload)
  },

  updateSubscription(id: string, payload: Partial<Subscription>) {
    return api.put<ApiResponse<Subscription>>(`/api/subscriptions/${id}`, payload)
  },

  updateStatus(id: string, status: string) {
    return api.patch<ApiResponse<Subscription>>(`/api/subscriptions/${id}/status`, { status })
  },

  generateInvoice(id: string) {
    return api.post<ApiResponse<unknown>>(`/api/subscriptions/${id}/invoice`)
  },

  addLine(id: string, payload: object) {
    return api.post<ApiResponse<unknown>>(`/api/subscriptions/${id}/lines`, payload)
  },

  updateLine(id: string, lineId: string, payload: object) {
    return api.put<ApiResponse<unknown>>(`/api/subscriptions/${id}/lines/${lineId}`, payload)
  },

  deleteLine(id: string, lineId: string) {
    return api.delete<ApiResponse<unknown>>(`/api/subscriptions/${id}/lines/${lineId}`)
  },
}
