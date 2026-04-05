import { useState, useCallback } from 'react'
import type { Payment } from '@/types'
import { DEFAULT_PAGINATION, buildQueryString, requestData, withLoading } from './utils'
import { paymentsService } from '@/services'
import { handleApiError } from '@/lib/api'

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION)

  const fetchPayments = useCallback(async (filters: {
    status?: string; method?: string; page?: number; limit?: number
  } = {}) => {
    await withLoading(setLoading, async () => {
      const query = buildQueryString({
        status: filters.status,
        method: filters.method,
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
      })

      try {
        const res = await paymentsService.getPayments(query)
        setPayments(Array.isArray(res.data.data) ? res.data.data : [])
        setPagination(res.data.pagination ?? DEFAULT_PAGINATION)
      } catch (err) { handleApiError(err) }
    })
  }, [])

  const createOrder = useCallback(async (invoiceId: string) => {
    return requestData(() => paymentsService.createOrder(invoiceId))
  }, [])

  const verifyPayment = useCallback(async (params: {
    order_id: string; payment_id: string; signature: string; invoice_id: string
  }) => {
    return requestData(
      () => paymentsService.verifyPayment(params),
      { successMessage: 'Payment successful!' },
    )
  }, [])

  const manualPayment = useCallback(async (payload: {
    invoice_id: string; amount: number; payment_method: string
    payment_date: string; reference_number?: string; notes?: string
  }) => {
    return requestData(() => paymentsService.manualPayment(payload), {
      successMessage: 'Payment recorded',
    })
  }, [])

  return { payments, loading, pagination, fetchPayments, createOrder, verifyPayment, manualPayment }
}
