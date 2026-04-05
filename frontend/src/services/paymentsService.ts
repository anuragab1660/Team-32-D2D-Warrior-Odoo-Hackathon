import api from '@/lib/api'
import type { Payment, RazorpayOrder, PaginatedResponse, ApiResponse } from '@/types'

export const paymentsService = {
  getPayments(query: string) {
    return api.get<PaginatedResponse<Payment>>(`/api/payments?${query}`)
  },

  createOrder(invoiceId: string) {
    return api.post<ApiResponse<RazorpayOrder>>('/api/payments/create-order', {
      invoice_id: invoiceId,
    })
  },

  verifyPayment(params: {
    order_id: string
    payment_id: string
    signature: string
    invoice_id: string
  }) {
    return api.post<ApiResponse<Payment>>('/api/payments/verify', {
      razorpay_order_id: params.order_id,
      razorpay_payment_id: params.payment_id,
      razorpay_signature: params.signature,
      invoice_id: params.invoice_id,
    })
  },

  manualPayment(payload: {
    invoice_id: string
    amount: number
    payment_method: string
    payment_date: string
    reference_number?: string
    notes?: string
  }) {
    return api.post<ApiResponse<Payment>>('/api/payments/manual', payload)
  },
}
