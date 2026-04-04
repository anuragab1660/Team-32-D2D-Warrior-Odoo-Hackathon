import { useState, useCallback } from 'react'
import api, { handleApiError } from '@/lib/api'
import type { RecurringPlan, PaginatedResponse, ApiResponse } from '@/types'
import { toast } from 'sonner'

export function usePlans() {
  const [plans, setPlans] = useState<RecurringPlan[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPlans = useCallback(async (active?: boolean) => {
    setLoading(true)
    try {
      const params = active !== undefined ? `?is_active=${active}` : ''
      const { data } = await api.get<PaginatedResponse<RecurringPlan>>(`/api/plans${params}`)
      setPlans(data.data)
    } catch (err) { handleApiError(err) }
    finally { setLoading(false) }
  }, [])

  const createPlan = useCallback(async (payload: Partial<RecurringPlan>) => {
    const { data } = await api.post<ApiResponse<RecurringPlan>>('/api/plans', payload)
    toast.success(data.message || 'Plan created')
    return data.data
  }, [])

  const updatePlan = useCallback(async (id: string, payload: Partial<RecurringPlan>) => {
    const { data } = await api.put<ApiResponse<RecurringPlan>>(`/api/plans/${id}`, payload)
    toast.success(data.message || 'Plan updated')
    return data.data
  }, [])

  const togglePlan = useCallback(async (id: string) => {
    const { data } = await api.patch<ApiResponse<RecurringPlan>>(`/api/plans/${id}/toggle`)
    toast.success(data.message || 'Plan updated')
    return data.data
  }, [])

  const deletePlan = useCallback(async (id: string) => {
    await api.delete(`/api/plans/${id}`)
    toast.success('Plan deleted')
  }, [])

  return { plans, loading, fetchPlans, createPlan, updatePlan, togglePlan, deletePlan }
}
