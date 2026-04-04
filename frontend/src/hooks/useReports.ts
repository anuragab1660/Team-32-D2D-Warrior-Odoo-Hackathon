import { useState, useCallback } from 'react'
import api, { handleApiError } from '@/lib/api'
import type { DashboardMetrics, MonthlyRevenue, OverdueInvoice, PendingInvitation, ApiResponse } from '@/types'

export function useReports() {
  const [loading, setLoading] = useState(false)

  const getDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<ApiResponse<DashboardMetrics>>('/api/reports/dashboard')
      return data.data
    } catch (err) { handleApiError(err); return null }
    finally { setLoading(false) }
  }, [])

  const getMonthlyRevenue = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<MonthlyRevenue[]>>('/api/reports/monthly-revenue')
      return data.data
    } catch (err) { handleApiError(err); return [] }
  }, [])

  const getOverdueInvoices = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<OverdueInvoice[]>>('/api/reports/overdue-invoices')
      return data.data
    } catch (err) { handleApiError(err); return [] }
  }, [])

  const getActiveSubscriptions = useCallback(async () => {
    try {
      const { data } = await api.get('/api/reports/active-subscriptions')
      return data.data
    } catch (err) { handleApiError(err); return [] }
  }, [])

  const getInvoiceSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/api/reports/invoice-summary')
      return data.data
    } catch (err) { handleApiError(err); return [] }
  }, [])

  const getPendingInvitations = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<PendingInvitation[]>>('/api/reports/pending-invitations')
      return data.data
    } catch (err) { handleApiError(err); return [] }
  }, [])

  return { loading, getDashboard, getMonthlyRevenue, getOverdueInvoices, getActiveSubscriptions, getInvoiceSummary, getPendingInvitations }
}
