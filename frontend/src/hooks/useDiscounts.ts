import { useState, useCallback } from 'react'
import api, { handleApiError } from '@/lib/api'
import type { Discount, PaginatedResponse, ApiResponse } from '@/types'
import { toast } from 'sonner'

export function useDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDiscounts = useCallback(async (active?: boolean) => {
    setLoading(true)
    try {
      const params = active !== undefined ? `?is_active=${active}` : ''
      const { data } = await api.get<PaginatedResponse<Discount>>(`/api/discounts${params}`)
      setDiscounts(data.data)
    } catch (err) { handleApiError(err) }
    finally { setLoading(false) }
  }, [])

  const createDiscount = useCallback(async (payload: Partial<Discount>) => {
    const { data } = await api.post<ApiResponse<Discount>>('/api/discounts', payload)
    toast.success(data.message || 'Discount created')
    return data.data
  }, [])

  const updateDiscount = useCallback(async (id: string, payload: Partial<Discount>) => {
    const { data } = await api.put<ApiResponse<Discount>>(`/api/discounts/${id}`, payload)
    toast.success(data.message || 'Discount updated')
    return data.data
  }, [])

  const toggleDiscount = useCallback(async (id: string) => {
    const { data } = await api.patch<ApiResponse<Discount>>(`/api/discounts/${id}/toggle`)
    toast.success(data.message || 'Discount updated')
    return data.data
  }, [])

  const deleteDiscount = useCallback(async (id: string) => {
    await api.delete(`/api/discounts/${id}`)
    toast.success('Discount deleted')
  }, [])

  return { discounts, loading, fetchDiscounts, createDiscount, updateDiscount, toggleDiscount, deleteDiscount }
}
