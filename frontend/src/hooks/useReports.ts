import { useState, useCallback } from 'react'
import type { DashboardMetrics, MonthlyRevenue, OverdueInvoice, PendingInvitation } from '@/types'
import { requestData, withLoading } from './utils'
import { reportsService } from '@/services'

export function useReports() {
  const [loading, setLoading] = useState(false)

  const getDashboard = useCallback(async () => {
    return withLoading(setLoading, () =>
      requestData(() => reportsService.getDashboard(), {
        fallback: null,
      }),
    )
  }, [])

  const getMonthlyRevenue = useCallback(async () => {
    return requestData(() => reportsService.getMonthlyRevenue(), {
      fallback: [],
    })
  }, [])

  const getOverdueInvoices = useCallback(async () => {
    return requestData(() => reportsService.getOverdueInvoices(), {
      fallback: [],
    })
  }, [])

  const getActiveSubscriptions = useCallback(async () => {
    return requestData(() => reportsService.getActiveSubscriptions(), {
      fallback: [],
    })
  }, [])

  const getInvoiceSummary = useCallback(async () => {
    return requestData(() => reportsService.getInvoiceSummary(), {
      fallback: [],
    })
  }, [])

  const getPendingInvitations = useCallback(async () => {
    return requestData(() => reportsService.getPendingInvitations(), {
      fallback: [],
    })
  }, [])

  return { loading, getDashboard, getMonthlyRevenue, getOverdueInvoices, getActiveSubscriptions, getInvoiceSummary, getPendingInvitations }
}
