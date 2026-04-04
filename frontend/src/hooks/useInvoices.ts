import { useState, useCallback } from 'react'
import api, { handleApiError } from '@/lib/api'
import type { Invoice, InvoicePaymentStatus, PaginatedResponse, ApiResponse } from '@/types'
import { toast } from 'sonner'

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })

  const fetchInvoices = useCallback(async (filters: {
    status?: string; customer?: string; page?: number; limit?: number
  } = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.customer) params.set('customer', filters.customer)
      params.set('page', String(filters.page || 1))
      params.set('limit', String(filters.limit || 20))
      const { data } = await api.get<PaginatedResponse<Invoice>>(`/api/invoices?${params}`)
      setInvoices(data.data)
      setPagination(data.pagination)
    } catch (err) { handleApiError(err) }
    finally { setLoading(false) }
  }, [])

  const getInvoice = useCallback(async (id: string) => {
    const { data } = await api.get<ApiResponse<Invoice>>(`/api/invoices/${id}`)
    return data.data
  }, [])

  const getPaymentStatus = useCallback(async (id: string) => {
    const { data } = await api.get<ApiResponse<InvoicePaymentStatus>>(`/api/invoices/${id}/payment-status`)
    return data.data
  }, [])

  const confirmInvoice = useCallback(async (id: string) => {
    const { data } = await api.patch<ApiResponse<Invoice>>(`/api/invoices/${id}/confirm`)
    toast.success(data.message || 'Invoice confirmed')
    return data.data
  }, [])

  const cancelInvoice = useCallback(async (id: string) => {
    const { data } = await api.patch<ApiResponse<Invoice>>(`/api/invoices/${id}/cancel`)
    toast.success(data.message || 'Invoice cancelled')
    return data.data
  }, [])

  const fetchMyInvoices = useCallback(async (filters: {
    page?: number; limit?: number
  } = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(filters.page || 1))
      params.set('limit', String(filters.limit || 20))
      const { data } = await api.get<PaginatedResponse<Invoice>>(`/api/invoices/my?${params}`)
      setInvoices(data.data)
      setPagination(data.pagination)
    } catch (err) { handleApiError(err) }
    finally { setLoading(false) }
  }, [])

  const getCustomerInvoices = useCallback(async (customerId: string) => {
    const { data } = await api.get<ApiResponse<Invoice[]>>(`/api/invoices/customer/${customerId}`)
    return data.data
  }, [])

  return {
    invoices, loading, pagination,
    fetchInvoices, fetchMyInvoices, getInvoice, getPaymentStatus,
    confirmInvoice, cancelInvoice, getCustomerInvoices,
  }
}
