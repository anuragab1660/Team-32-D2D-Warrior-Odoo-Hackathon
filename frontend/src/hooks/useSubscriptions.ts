import { useState, useCallback } from 'react'
import type { Subscription } from '@/types'
import { DEFAULT_PAGINATION, buildQueryString, requestData, withLoading } from './utils'
import { subscriptionsService } from '@/services'

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION)

  const fetchSubscriptions = useCallback(async (filters: {
    status?: string; customer?: string; plan?: string; page?: number; limit?: number
  } = {}) => {
    await withLoading(setLoading, async () => {
      const query = buildQueryString({
        status: filters.status,
        customer: filters.customer,
        plan: filters.plan,
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
      })

      const data = await requestData(() =>
        subscriptionsService.getSubscriptions(query),
      )

      if (!data) return
      setSubscriptions(data.data)
      setPagination(data.pagination)
    })
  }, [])

  const fetchMySubscriptions = useCallback(async () => {
    await withLoading(setLoading, async () => {
      const data = await requestData(() => subscriptionsService.getMySubscriptions())
      if (!data) return
      setSubscriptions(data)
    })
  }, [])

  const createSubscription = useCallback(async (payload: Partial<Subscription>) => {
    return requestData(() => subscriptionsService.createSubscription(payload), {
      successMessage: 'Subscription created',
    })
  }, [])

  const updateSubscription = useCallback(async (id: string, payload: Partial<Subscription>) => {
    return requestData(() => subscriptionsService.updateSubscription(id, payload), {
      successMessage: 'Subscription updated',
    })
  }, [])

  const updateStatus = useCallback(async (id: string, status: string) => {
    return requestData(() => subscriptionsService.updateStatus(id, status), { successMessage: 'Status updated' })
  }, [])

  const generateInvoice = useCallback(async (id: string) => {
    return requestData(() => subscriptionsService.generateInvoice(id), {
      successMessage: 'Invoice generated',
    })
  }, [])

  const addLine = useCallback(async (id: string, payload: object) => {
    return requestData(() => subscriptionsService.addLine(id, payload), {
      successMessage: 'Line added',
    })
  }, [])

  const updateLine = useCallback(async (id: string, lineId: string, payload: object) => {
    return requestData(() => subscriptionsService.updateLine(id, lineId, payload), { successMessage: 'Line updated' })
  }, [])

  const deleteLine = useCallback(async (id: string, lineId: string) => {
    await requestData(() => subscriptionsService.deleteLine(id, lineId), {
      successMessage: 'Line deleted',
    })
  }, [])

  return {
    subscriptions, loading, pagination,
    fetchSubscriptions, fetchMySubscriptions, createSubscription,
    updateSubscription, updateStatus, generateInvoice, addLine, updateLine, deleteLine,
  }
}
