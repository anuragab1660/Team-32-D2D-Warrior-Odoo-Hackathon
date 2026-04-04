'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInvoices } from '@/hooks/useInvoices'
import { usePayments } from '@/hooks/usePayments'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Invoice, InvoicePaymentStatus, Payment } from '@/types'
import { ArrowLeftIcon, LoaderIcon, PrinterIcon, DownloadIcon, CheckCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

/**
 * @module portal/my-invoices/[id]
 * @api-calls GET /api/invoices/:id, GET /api/invoices/:id/payment-status, GET /api/payments, POST /api/payments/order, POST /api/payments/verify
 * @depends-on useInvoices, usePayments
 * @role portal
 * @emits none
 * RUFLOW_REVIEW: invoice detail - payment, PDF download, print, payment history
 */

declare const Razorpay: new (options: Record<string, unknown>) => { open: () => void }

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function methodIcon(method: string) {
  const m: Record<string, string> = {
    razorpay: '💳',
    bank_transfer: '🏦',
    cash: '💰',
    cheque: '📝',
    upi: '📱',
    other: '💳',
  }
  return m[method] ?? '💳'
}

export default function PortalInvoiceDetailPage() {
  /**
   * @module portal/my-invoices/[id]
   * @api-calls GET /api/invoices/:id, GET /api/invoices/:id/payment-status, GET /api/payments
   * @depends-on useInvoices, usePayments
   * @role portal
   * @emits none
   * RUFLOW_REVIEW: invoice detail - payment, PDF download, print, payment history
   */
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { getInvoice, getPaymentStatus } = useInvoices()
  const { createOrder, verifyPayment } = usePayments()
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [payStatus, setPayStatus] = useState<InvoicePaymentStatus | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const load = async () => {
    try {
      const [inv, ps] = await Promise.all([getInvoice(id), getPaymentStatus(id)])
      setInvoice(inv)
      setPayStatus(ps)
      // Fetch payment history
      try {
        const pRes = await api.get(`/api/payments?invoice_id=${id}&limit=20`)
        setPayments(pRes.data.data || [])
      } catch { /* optional */ }
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
      if (!order) return
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
            toast.success('✅ Payment received!')
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

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !invoice) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).jsPDF
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${invoice.invoice_number}.pdf`)
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      setDownloading(false)
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

  const isFullyPaid = payStatus && payStatus.amount_outstanding <= 0
  const canPay = !isFullyPaid && (invoice.status === 'confirmed' || invoice.status === 'overdue')

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl space-y-6">
      <div className="print:hidden">
        <Link href="/my-invoices" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeftIcon className="h-4 w-4" />Back to invoices
        </Link>
      </div>

      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{invoice.invoice_number}</h1>
          <p className="text-sm text-slate-500 mt-1">Invoice details</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={invoice.status} type="invoice" />
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <PrinterIcon className="h-3.5 w-3.5" />Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={downloading} className="gap-1.5">
            {downloading ? <LoaderIcon className="h-3.5 w-3.5 animate-spin" /> : <DownloadIcon className="h-3.5 w-3.5" />}
            PDF
          </Button>
        </div>
      </div>

      {/* Invoice content (printable) */}
      <div ref={invoiceRef}>
        <Card className="border-slate-200">
          <CardContent className="p-6">
            {/* Invoice header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center mb-2">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <p className="font-bold text-slate-900 text-lg">ProsubX</p>
                <p className="text-xs text-slate-400">Subscription Management Platform</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-slate-900">{invoice.invoice_number}</p>
                <StatusBadge status={invoice.status} type="invoice" />
                <p className="text-xs text-slate-400 mt-1">Issued: {fmtDate(invoice.issued_date)}</p>
                {invoice.due_date && (
                  <p className="text-xs text-slate-400">Due: {fmtDate(invoice.due_date)}</p>
                )}
              </div>
            </div>

            {/* Invoice table */}
            {invoice.lines && invoice.lines.length > 0 && (
              <div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">#</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Description</th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Qty</th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Unit Price</th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Tax</th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lines.map((line, i) => (
                      <tr key={line.id} className="border-b border-slate-100">
                        <td className="py-2 text-slate-400">{i + 1}</td>
                        <td className="py-2">{line.description || (line as unknown as Record<string,string>).product_name || 'Product'}</td>
                        <td className="py-2 text-right">{line.quantity}</td>
                        <td className="py-2 text-right">₹{line.unit_price.toLocaleString('en-IN')}</td>
                        <td className="py-2 text-right text-slate-400">
                          {line.tax_amount > 0 ? `₹${line.tax_amount.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-2 text-right font-medium">₹{line.line_total.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span>₹{invoice.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax (GST)</span>
                    <span>+₹{invoice.tax_total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Discount</span>
                    <span>-₹{invoice.discount_total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-1">
                    <span>Grand Total</span>
                    <span className="text-indigo-700">₹{invoice.grand_total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Card */}
      {payStatus && (
        <Card className="border-slate-200 print:hidden">
          <CardHeader><CardTitle className="text-base">Payment Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isFullyPaid ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <p className="text-sm font-semibold text-green-800">✅ Fully Paid</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">Amount Paid</p>
                    <p className="font-bold text-green-600 text-lg">₹{payStatus.amount_paid.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Outstanding</p>
                    <p className="font-bold text-red-600 text-lg">₹{payStatus.amount_outstanding.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                {canPay && (
                  <Button
                    onClick={handleRazorpayPayment}
                    disabled={paying}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {paying
                      ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                      : `Pay ₹${payStatus.amount_outstanding.toLocaleString('en-IN')} via Razorpay`
                    }
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card className="border-slate-200 print:hidden">
        <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-400">No payments recorded</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Date</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Method</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Amount</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Ref #</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="py-2">{fmtDate(p.payment_date)}</td>
                    <td className="py-2">
                      <span className="mr-1">{methodIcon(p.payment_method)}</span>
                      <span className="capitalize">{p.payment_method.replace('_', ' ')}</span>
                    </td>
                    <td className="py-2 text-right font-medium">₹{p.amount.toLocaleString('en-IN')}</td>
                    <td className="py-2 text-right text-slate-400 text-xs">
                      {p.razorpay_payment_id || p.reference_number || '—'}
                    </td>
                    <td className="py-2 text-right">
                      <StatusBadge status={p.status} type="invoice" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          header, nav, .sticky { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </motion.div>
  )
}
