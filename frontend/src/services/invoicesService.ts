import api from '@/lib/api'
import type { Invoice, InvoicePaymentStatus, PaginatedResponse, ApiResponse } from '@/types'

export const invoicesService = {
  getInvoices(query: string) {
    return api.get<PaginatedResponse<Invoice>>(`/api/invoices?${query}`)
  },

  getMyInvoices(query: string) {
    return api.get<PaginatedResponse<Invoice>>(`/api/invoices/my?${query}`)
  },

  getInvoice(id: string) {
    return api.get<ApiResponse<Invoice>>(`/api/invoices/${id}`)
  },

  getPaymentStatus(id: string) {
    return api.get<ApiResponse<InvoicePaymentStatus>>(`/api/invoices/${id}/payment-status`)
  },

  confirmInvoice(id: string) {
    return api.patch<ApiResponse<Invoice>>(`/api/invoices/${id}/confirm`)
  },

  cancelInvoice(id: string) {
    return api.patch<ApiResponse<Invoice>>(`/api/invoices/${id}/cancel`)
  },

  getCustomerInvoices(customerId: string) {
    return api.get<ApiResponse<Invoice[]>>(`/api/invoices/customer/${customerId}`)
  },
}
