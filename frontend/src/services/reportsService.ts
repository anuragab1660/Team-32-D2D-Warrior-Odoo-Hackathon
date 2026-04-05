import api from '@/lib/api'
import type { DashboardMetrics, MonthlyRevenue, OverdueInvoice, PendingInvitation, ApiResponse } from '@/types'

export const reportsService = {
  getDashboard() {
    return api.get<ApiResponse<DashboardMetrics>>('/api/reports/dashboard')
  },

  getMonthlyRevenue() {
    return api.get<ApiResponse<MonthlyRevenue[]>>('/api/reports/monthly-revenue')
  },

  getOverdueInvoices() {
    return api.get<ApiResponse<OverdueInvoice[]>>('/api/reports/overdue-invoices')
  },

  getActiveSubscriptions() {
    return api.get('/api/reports/active-subscriptions')
  },

  getInvoiceSummary() {
    return api.get('/api/reports/invoice-summary')
  },

  getPendingInvitations() {
    return api.get<ApiResponse<PendingInvitation[]>>('/api/reports/pending-invitations')
  },
}
