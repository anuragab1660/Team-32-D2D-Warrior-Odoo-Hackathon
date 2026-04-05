'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInvoices } from '@/hooks/useInvoices'
import { usePayments } from '@/hooks/usePayments'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Invoice, InvoicePaymentStatus, Payment } from '@/types'
import {
  ArrowLeftIcon, LoaderIcon, PrinterIcon, DownloadIcon,
  CheckCircleIcon, CheckCircle2Icon, CreditCardIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

declare const Razorpay: new (options: Record<string, unknown>) => { open: () => void }

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function methodLabel(method: string) {
  const m: Record<string, string> = {
    razorpay: 'Razorpay',
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    cheque: 'Cheque',
    upi: 'UPI',
    other: 'Other',
  }
  return m[method] ?? method
}

export default function PortalInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { getInvoice, getPaymentStatus } = useInvoices()
  const { createOrder, verifyPayment } = usePayments()
  const printRef = useRef<HTMLDivElement>(null)
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
      const rzp = new Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'ProsubX',
        description: `Invoice ${(invoice as Invoice & Record<string,unknown>).invoice_number}`,
        order_id: order.order_id,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verifyPayment({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              invoice_id: invoice.id,
            })
            toast.success('Payment successful!')
            await load()
          } catch {
            toast.error('Payment verification failed')
          }
        },
        theme: { color: '#4f46e5' },
      })
      rzp.open()
    } catch {
      toast.error('Failed to initiate payment')
    } finally {
      setPaying(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!printRef.current || !invoice) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgHeight = (canvas.height * pageWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight)
      heightLeft -= pageHeight
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight)
        heightLeft -= pageHeight
      }
      const invNum = (invoice as Invoice & Record<string,unknown>).invoice_number as string || 'invoice'
      pdf.save(`Invoice-${invNum}.pdf`)
      toast.success('PDF downloaded')
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!invoice) return null

  const inv = invoice as Invoice & Record<string, unknown>
  const isFullyPaid = payStatus && payStatus.amount_outstanding <= 0
  const canPay = !isFullyPaid && (invoice.status === 'confirmed' || invoice.status === 'sent' || invoice.status === 'overdue')
  const isPaid = invoice.status === 'paid' || isFullyPaid

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl space-y-5"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/my-invoices" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeftIcon className="h-4 w-4" />Back to Invoices
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <PrinterIcon className="h-3.5 w-3.5" />Print
          </Button>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading
              ? <><span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Generating...</>
              : <><DownloadIcon className="h-3.5 w-3.5" />Download PDF</>
            }
          </Button>
        </div>
      </div>

      {/* ── Invoice Card (captured for PDF) ── */}
      <div ref={printRef} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

        {/* Indigo header */}
        <div className="bg-indigo-600 px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ProsubX</h1>
              <p className="text-indigo-200 text-sm mt-0.5">Subscription Management</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold tracking-wide">INVOICE</p>
              <p className="text-indigo-200 text-sm font-mono">{inv.invoice_number as string}</p>
              {isPaid && (
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-green-400/20 text-green-100 text-xs font-semibold border border-green-400/30">
                  <CheckCircle2Icon className="h-3 w-3" />PAID
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Bill To + Dates */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Bill To</p>
              <p className="font-semibold text-slate-900">{(inv.company_name as string) || (inv.customer_name as string)}</p>
              <p className="text-sm text-slate-600">{inv.customer_email as string}</p>
              {inv.phone && <p className="text-sm text-slate-600">{inv.phone as string}</p>}
              {inv.address && <p className="text-sm text-slate-600">{inv.address as string}</p>}
              {(inv.city || inv.state) && (
                <p className="text-sm text-slate-600">
                  {[inv.city, inv.state, inv.postal_code].filter(Boolean).join(', ')}
                </p>
              )}
              {inv.gstin && <p className="text-xs text-slate-500 mt-1">GSTIN: {inv.gstin as string}</p>}
            </div>
            <div className="text-right space-y-2">
              <div>
                <p className="text-xs text-slate-400">Issue Date</p>
                <p className="text-sm font-medium text-slate-800">{fmtDate(invoice.issued_date)}</p>
              </div>
              {invoice.due_date && (
                <div>
                  <p className="text-xs text-slate-400">Due Date</p>
                  <p className="text-sm font-medium text-slate-800">{fmtDate(invoice.due_date)}</p>
                </div>
              )}
              {inv.paid_at && (
                <div>
                  <p className="text-xs text-slate-400">Paid On</p>
                  <p className="text-sm font-medium text-green-700">{fmtDate(inv.paid_at as string)}</p>
                </div>
              )}
              <Badge className={
                isPaid
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : invoice.status === 'overdue'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-amber-100 text-amber-700 border border-amber-200'
              }>
                {invoice.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Line items */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</th>
                  <th className="text-center py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">Qty</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Rate (₹)</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Tax (₹)</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines && invoice.lines.length > 0 ? invoice.lines.map((line, i) => (
                  <tr key={line.id || i} className="border-b border-slate-100">
                    <td className="py-3">
                      <p className="font-medium text-slate-800">
                        {(line as unknown as Record<string,string>).product_name || line.description || 'Product'}
                      </p>
                      {line.description && (line as unknown as Record<string,string>).product_name && (
                        <p className="text-xs text-slate-400">{line.description}</p>
                      )}
                    </td>
                    <td className="py-3 text-center text-slate-600">{line.quantity}</td>
                    <td className="py-3 text-right text-slate-700">{Number(line.unit_price).toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right text-slate-600">
                      {Number(line.tax_amount) > 0 ? Number(line.tax_amount).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-3 text-right font-medium text-slate-800">{Number(line.line_total).toLocaleString('en-IN')}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">No line items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>₹{Number(invoice.subtotal).toLocaleString('en-IN')}</span>
              </div>
              {Number(invoice.tax_total) > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax</span>
                  <span>₹{Number(invoice.tax_total).toLocaleString('en-IN')}</span>
                </div>
              )}
              {Number(invoice.discount_total) > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Discount</span>
                  <span className="text-green-600">−₹{Number(invoice.discount_total).toLocaleString('en-IN')}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span className="text-slate-800">Grand Total</span>
                <span className="text-indigo-700">₹{Number(invoice.grand_total).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payment reference */}
          {inv.payment_id && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-xs font-semibold text-green-700 mb-0.5">Payment Reference</p>
              <p className="text-sm text-green-800 font-mono break-all">{inv.payment_id as string}</p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 font-medium">Thank you for your business!</p>
            <p className="text-xs text-slate-400 mt-0.5">ProsubX · Subscription Management Platform</p>
          </div>
        </div>
      </div>

      {/* ── Payment Status (not in PDF) ── */}
      {payStatus && (
        <Card className="border-slate-200 print:hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCardIcon className="h-4 w-4 text-indigo-500" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isFullyPaid ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <p className="text-sm font-semibold text-green-800">Fully Paid — No amount due</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Amount Paid</p>
                    <p className="font-bold text-green-700 text-xl">₹{Number(payStatus.amount_paid).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Outstanding</p>
                    <p className="font-bold text-red-600 text-xl">₹{Number(payStatus.amount_outstanding).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                {canPay && (
                  <Button
                    onClick={handleRazorpayPayment}
                    disabled={paying}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
                  >
                    {paying
                      ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                      : <>Pay ₹{Number(payStatus.amount_outstanding).toLocaleString('en-IN')} via Razorpay</>
                    }
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Payment History (not in PDF) ── */}
      {payments.length > 0 && (
        <Card className="border-slate-200 print:hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Date</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Method</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Amount</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Reference</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 text-slate-700">{fmtDate(p.payment_date)}</td>
                    <td className="py-2.5 text-slate-700">{methodLabel(p.payment_method)}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-800">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-right text-slate-400 text-xs font-mono">
                      {p.razorpay_payment_id || p.reference_number || '—'}
                    </td>
                    <td className="py-2.5 text-right">
                      <StatusBadge status={p.status} type="payment" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          header, nav, aside { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </motion.div>
  )
}
