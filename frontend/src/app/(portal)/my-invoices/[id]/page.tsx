'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useInvoices } from '@/hooks/useInvoices'
import { usePayments } from '@/hooks/usePayments'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Invoice, InvoicePaymentStatus } from '@/types'
import { ArrowLeftIcon, LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'

declare const Razorpay: new (options: Record<string, unknown>) => { open: () => void }

export default function PortalInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { getInvoice, getPaymentStatus } = useInvoices()
  const { createOrder, verifyPayment } = usePayments()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [payStatus, setPayStatus] = useState<InvoicePaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  const load = async () => {
    try {
      const [inv, ps] = await Promise.all([getInvoice(id), getPaymentStatus(id)])
      setInvoice(inv)
      setPayStatus(ps)
    } catch {
      toast.error('Invoice not found')
      router.push('/my-invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleRazorpayPayment = async () => {
    if (!invoice) return
    setPaying(true)
    try {
      const order = await createOrder(invoice.id)
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'ProsubX',
        description: `Invoice ${invoice.invoice_number}`,
        order_id: order.order_id,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verifyPayment({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              invoice_id: invoice.id,
            })
            await load()
          } catch {
            toast.error('Payment verification failed')
          }
        },
        theme: { color: '#4f46e5' },
      }
      const rzp = new Razorpay(options)
      rzp.open()
    } catch {
      toast.error('Failed to initiate payment')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoaderIcon className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!invoice) return null

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/my-invoices" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeftIcon className="h-4 w-4" />Back to invoices
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{invoice.invoice_number}</h1>
          <p className="text-sm text-slate-500 mt-1">Invoice details</p>
        </div>
        <StatusBadge status={invoice.status} type="invoice" />
      </div>

      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <dt className="text-slate-500 mb-1">Issued Date</dt>
              <dd className="text-slate-700">{new Date(invoice.issued_date).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-slate-500 mb-1">Due Date</dt>
              <dd className="text-slate-700">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</dd>
            </div>
          </dl>

          {invoice.lines && invoice.lines.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Description</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Qty</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Unit Price</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map(line => (
                    <tr key={line.id} className="border-b border-slate-100">
                      <td className="py-2">{line.description || (line as Record<string, string>).product_name}</td>
                      <td className="py-2 text-right">{line.quantity}</td>
                      <td className="py-2 text-right">₹{line.unit_price.toLocaleString()}</td>
                      <td className="py-2 text-right font-medium">₹{line.line_total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 space-y-1 text-sm text-right">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>₹{invoice.subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>₹{invoice.tax_total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>-₹{invoice.discount_total.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-2">
                  <span>Grand Total</span><span>₹{invoice.grand_total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {payStatus && (
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Payment Status</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-medium text-green-600">₹{payStatus.amount_paid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Outstanding</span>
              <span className="font-medium text-red-600">₹{payStatus.amount_outstanding.toLocaleString()}</span>
            </div>
            {invoice.status === 'confirmed' && payStatus.amount_outstanding > 0 && (
              <Button
                onClick={handleRazorpayPayment}
                disabled={paying}
                className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2"
              >
                {paying ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Processing...</> : `Pay ₹${payStatus.amount_outstanding.toLocaleString()}`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
