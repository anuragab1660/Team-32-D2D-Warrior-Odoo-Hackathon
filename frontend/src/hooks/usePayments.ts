import { useState, useCallback } from 'react'
import api, { handleApiError } from '@/lib/api'
import type { Payment, RazorpayOrder, PaginatedResponse, ApiResponse } from '@/types'
import { toast } from 'sonner'

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })

  const fetchPayments = useCallback(async (filters: {
    status?: string; method?: string; page?: number; limit?: number
  } = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.method) params.set('method', filters.method)
      params.set('page', String(filters.page || 1))
      params.set('limit', String(filters.limit || 20))
      const { data } = await api.get<PaginatedResponse<Payment>>(`/api/payments?${params}`)
      setPayments(data.data)
      setPagination(data.pagination)
    } catch (err) { handleApiError(err) }
    finally { setLoading(false) }
  }, [])

  const createOrder = useCallback(async (invoiceId: string) => {
    const { data } = await api.post<ApiResponse<RazorpayOrder>>('/api/payments/create-order', {
      invoice_id: invoiceId,
    })
    return data.data
  }, [])

  const verifyPayment = useCallback(async (params: {
    order_id: string; payment_id: string; signature: string; invoice_id: string
  }) => {
    const { data } = await api.post<ApiResponse<Payment>>('/api/payments/verify', {
      razorpay_order_id: params.order_id,
      razorpay_payment_id: params.payment_id,
      razorpay_signature: params.signature,
      invoice_id: params.invoice_id,
    })
    toast.success(data.message || 'Payment successful!')
    return data.data
  }, [])

  const manualPayment = useCallback(async (payload: {
    invoice_id: string; amount: number; payment_method: string
    payment_date: string; reference_number?: string; notes?: string
  }) => {
    const { data } = await api.post<ApiResponse<Payment>>('/api/payments/manual', payload)
    toast.success(data.message || 'Payment recorded')
    return data.data
  }, [])

  return { payments, loading, pagination, fetchPayments, createOrder, verifyPayment, manualPayment }
}
