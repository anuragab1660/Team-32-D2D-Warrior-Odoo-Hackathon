import { useState, useCallback } from 'react'
import api, { handleApiError } from '@/lib/api'
import type { Tax, PaginatedResponse, ApiResponse } from '@/types'
import { toast } from 'sonner'

export function useTaxes() {
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTaxes = useCallback(async (active?: boolean) => {
    setLoading(true)
    try {
      const params = active !== undefined ? `?is_active=${active}` : ''
      const { data } = await api.get<PaginatedResponse<Tax>>(`/api/taxes${params}`)
      setTaxes(data.data)
    } catch (err) { handleApiError(err) }
    finally { setLoading(false) }
  }, [])

  const createTax = useCallback(async (payload: Partial<Tax>) => {
    const { data } = await api.post<ApiResponse<Tax>>('/api/taxes', payload)
    toast.success(data.message || 'Tax created')
    return data.data
  }, [])

  const updateTax = useCallback(async (id: string, payload: Partial<Tax>) => {
    const { data } = await api.put<ApiResponse<Tax>>(`/api/taxes/${id}`, payload)
    toast.success(data.message || 'Tax updated')
    return data.data
  }, [])

  const toggleTax = useCallback(async (id: string) => {
    const { data } = await api.patch<ApiResponse<Tax>>(`/api/taxes/${id}/toggle`)
    toast.success(data.message || 'Tax updated')
    return data.data
  }, [])

  const deleteTax = useCallback(async (id: string) => {
    await api.delete(`/api/taxes/${id}`)
    toast.success('Tax deleted')
  }, [])

  return { taxes, loading, fetchTaxes, createTax, updateTax, toggleTax, deleteTax }
}
