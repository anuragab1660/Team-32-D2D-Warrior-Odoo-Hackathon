import { useState, useCallback } from 'react'
import api, { handleApiError } from '@/lib/api'
import type { Subscription, PaginatedResponse, ApiResponse } from '@/types'
import { toast } from 'sonner'

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })

  const fetchSubscriptions = useCallback(async (filters: {
    status?: string; customer?: string; plan?: string; page?: number; limit?: number
  } = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.customer) params.set('customer', filters.customer)
      if (filters.plan) params.set('plan', filters.plan)
      params.set('page', String(filters.page || 1))
      params.set('limit', String(filters.limit || 20))
      const { data } = await api.get<PaginatedResponse<Subscription>>(`/api/subscriptions?${params}`)
      setSubscriptions(data.data)
      setPagination(data.pagination)
    } catch (err) { handleApiError(err) }
    finally { setLoading(false) }
  }, [])

  const fetchMySubscriptions = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<ApiResponse<Subscription[]>>('/api/subscriptions/my')
      setSubscriptions(data.data)
    } catch (err) { handleApiError(err) }
    finally { setLoading(false) }
  }, [])

  const createSubscription = useCallback(async (payload: Partial<Subscription>) => {
    const { data } = await api.post<ApiResponse<Subscription>>('/api/subscriptions', payload)
    toast.success(data.message || 'Subscription created')
    return data.data
  }, [])

  const updateSubscription = useCallback(async (id: string, payload: Partial<Subscription>) => {
    const { data } = await api.put<ApiResponse<Subscription>>(`/api/subscriptions/${id}`, payload)
    toast.success(data.message || 'Subscription updated')
    return data.data
  }, [])

  const updateStatus = useCallback(async (id: string, status: string) => {
    const { data } = await api.patch<ApiResponse<Subscription>>(`/api/subscriptions/${id}/status`, { status })
    toast.success(data.message || 'Status updated')
    return data.data
  }, [])

  const generateInvoice = useCallback(async (id: string) => {
    const { data } = await api.post<ApiResponse<unknown>>(`/api/subscriptions/${id}/invoice`)
    toast.success(data.message || 'Invoice generated')
    return data.data
  }, [])

  const addLine = useCallback(async (id: string, payload: object) => {
    const { data } = await api.post<ApiResponse<unknown>>(`/api/subscriptions/${id}/lines`, payload)
    toast.success(data.message || 'Line added')
    return data.data
  }, [])

  const updateLine = useCallback(async (id: string, lineId: string, payload: object) => {
    const { data } = await api.put<ApiResponse<unknown>>(`/api/subscriptions/${id}/lines/${lineId}`, payload)
    toast.success(data.message || 'Line updated')
    return data.data
  }, [])

  const deleteLine = useCallback(async (id: string, lineId: string) => {
    const { data } = await api.delete<ApiResponse<unknown>>(`/api/subscriptions/${id}/lines/${lineId}`)
    toast.success(data.message || 'Line deleted')
  }, [])

  return {
    subscriptions, loading, pagination,
    fetchSubscriptions, fetchMySubscriptions, createSubscription,
    updateSubscription, updateStatus, generateInvoice, addLine, updateLine, deleteLine,
  }
}
