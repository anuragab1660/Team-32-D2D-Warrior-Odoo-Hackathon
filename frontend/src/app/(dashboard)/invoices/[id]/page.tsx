'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useInvoices } from '@/hooks/useInvoices'
import { usePayments } from '@/hooks/usePayments'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Invoice, InvoicePaymentStatus } from '@/types'
import { ArrowLeftIcon, LoaderIcon, CheckIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { getInvoice, getPaymentStatus, confirmInvoice, cancelInvoice } = useInvoices()
  const { manualPayment } = usePayments()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [payStatus, setPayStatus] = useState<InvoicePaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'bank_transfer', date: new Date().toISOString().split('T')[0], reference: '' })

  const load = async () => {
    try {
      const [inv, ps] = await Promise.all([getInvoice(id), getPaymentStatus(id)])
      setInvoice(inv)
      setPayStatus(ps)
    } catch {
      toast.error('Invoice not found')
      router.push('/invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleConfirm = async () => {
    if (!invoice) return
    setActionLoading(true)
    try { const updated = await confirmInvoice(invoice.id); if (updated) setInvoice(updated) }
    finally { setActionLoading(false) }
  }

  const handleCancel = async () => {
    if (!invoice) return
    setActionLoading(true)
    try { const updated = await cancelInvoice(invoice.id); if (updated) setInvoice(updated) }
    finally { setActionLoading(false) }
  }

  const handleManualPayment = async () => {
    if (!invoice) return
    setActionLoading(true)
    try {
      await manualPayment({
        invoice_id: invoice.id,
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.method,
        payment_date: paymentForm.date,
        reference_number: paymentForm.reference || undefined,
      })
      await load()
    } finally {
      setActionLoading(false)
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
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoice_number}
        description="Invoice details and payment management"
        action={
          <div className="flex items-center gap-2">
            <Link href="/invoices">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeftIcon className="h-4 w-4" />Back
              </Button>
            </Link>
            {invoice.status === 'draft' && (
              <>
                <Button size="sm" onClick={handleConfirm} disabled={actionLoading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <CheckIcon className="h-4 w-4" />Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} disabled={actionLoading} className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
                  <XIcon className="h-4 w-4" />Cancel
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200">
            <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Customer</dt>
                  <dd className="text-sm font-medium">{(invoice as unknown as Record<string, string>).customer_name ?? invoice.customer?.name ?? invoice.customer_id}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Status</dt>
                  <dd><StatusBadge status={invoice.status} type="invoice" /></dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Issued Date</dt>
                  <dd className="text-sm text-slate-700">{new Date(invoice.issued_date).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Due Date</dt>
                  <dd className="text-sm text-slate-700">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</dd>
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
                          <td className="py-2">{line.description || (line as unknown as Record<string, string>).product_name}</td>
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
        </div>

        <div className="space-y-4">
          {payStatus && (
            <Card className="border-slate-200">
              <CardHeader><CardTitle className="text-base">Payment Status</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid</span>
                  <span className="font-medium text-green-600">₹{payStatus.amount_paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Outstanding</span>
                  <span className="font-medium text-red-600">₹{payStatus.amount_outstanding.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {invoice.status === 'confirmed' && payStatus && payStatus.amount_outstanding > 0 && (
            <Card className="border-slate-200">
              <CardHeader><CardTitle className="text-base">Record Payment</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Method</Label>
                  <Select value={paymentForm.method} onValueChange={v => setPaymentForm(p => ({ ...p, method: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="razorpay">Razorpay</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={paymentForm.date} onChange={e => setPaymentForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Reference #</Label>
                  <Input placeholder="Optional" value={paymentForm.reference} onChange={e => setPaymentForm(p => ({ ...p, reference: e.target.value }))} />
                </div>
                <Button onClick={handleManualPayment} disabled={actionLoading || !paymentForm.amount} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {actionLoading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : 'Record Payment'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
