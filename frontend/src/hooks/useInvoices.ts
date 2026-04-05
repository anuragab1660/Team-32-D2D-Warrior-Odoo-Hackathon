import { useState, useCallback } from 'react'
import type { Invoice, InvoicePaymentStatus } from '@/types'
import { DEFAULT_PAGINATION, buildQueryString, requestData, withLoading } from './utils'
import { invoicesService } from '@/services'

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION)

  const fetchInvoices = useCallback(async (filters: {
    status?: string; customer?: string; page?: number; limit?: number
  } = {}) => {
    await withLoading(setLoading, async () => {
      const query = buildQueryString({
        status: filters.status,
        customer: filters.customer,
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
      })

      const data = await requestData(() =>
        invoicesService.getInvoices(query),
      )

      if (!data) return
      setInvoices(data.data)
      setPagination(data.pagination)
    })
  }, [])

  const getInvoice = useCallback(async (id: string) => {
    return requestData(() => invoicesService.getInvoice(id))
  }, [])

  const getPaymentStatus = useCallback(async (id: string) => {
    return requestData(() => invoicesService.getPaymentStatus(id))
  }, [])

  const confirmInvoice = useCallback(async (id: string) => {
    return requestData(() => invoicesService.confirmInvoice(id), {
      successMessage: 'Invoice confirmed',
    })
  }, [])

  const cancelInvoice = useCallback(async (id: string) => {
    return requestData(() => invoicesService.cancelInvoice(id), {
      successMessage: 'Invoice cancelled',
    })
  }, [])

  const fetchMyInvoices = useCallback(async (filters: {
    page?: number; limit?: number
  } = {}) => {
    await withLoading(setLoading, async () => {
      const query = buildQueryString({
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
      })

      const data = await requestData(() =>
        invoicesService.getMyInvoices(query),
      )

      if (!data) return
      setInvoices(data.data)
      setPagination(data.pagination)
    })
  }, [])

  const getCustomerInvoices = useCallback(async (customerId: string) => {
    return requestData(() => invoicesService.getCustomerInvoices(customerId), { fallback: [] })
  }, [])

  return {
    invoices, loading, pagination,
    fetchInvoices, fetchMyInvoices, getInvoice, getPaymentStatus,
    confirmInvoice, cancelInvoice, getCustomerInvoices,
  }
}
