'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useInvoices } from '@/hooks/useInvoices'
import { usePayments } from '@/hooks/usePayments'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Invoice, InvoicePaymentStatus } from '@/types'
import { ArrowLeftIcon, LoaderIcon, CheckIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

const fieldLabel = (text: string) => (
  <span
    className="text-xs font-semibold uppercase tracking-wider"
    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
  >
    {text}
  </span>
)

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { getInvoice, getPaymentStatus, confirmInvoice, cancelInvoice } = useInvoices()
  const { manualPayment } = usePayments()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [payStatus, setPayStatus] = useState<InvoicePaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'bank_transfer',
    date: new Date().toISOString().split('T')[0],
    reference: '',
  })

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
    try { const updated = await confirmInvoice(invoice.id); setInvoice(updated) }
    finally { setActionLoading(false) }
  }

  const handleCancel = async () => {
    if (!invoice) return
    setActionLoading(true)
    try { const updated = await cancelInvoice(invoice.id); setInvoice(updated) }
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
        <LoaderIcon className="h-8 w-8 animate-spin" style={{ color: '#274e82' }} />
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
              <button className="btn-soft flex items-center gap-2">
                <ArrowLeftIcon className="h-4 w-4" />Back
              </button>
            </Link>
            {invoice.status === 'draft' && (
              <>
                <button
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="btn-gradient flex items-center gap-2"
                  style={{ opacity: actionLoading ? 0.7 : 1 }}
                >
                  <CheckIcon className="h-4 w-4" />Confirm
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="btn-soft flex items-center gap-2"
                  style={{ color: '#dc2626', opacity: actionLoading ? 0.7 : 1 }}
                >
                  <XIcon className="h-4 w-4" />Cancel
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Invoice Details */}
          <div className="section-card">
            <h2
              className="text-sm font-bold mb-5"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
            >
              Invoice Details
            </h2>
            <dl className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>Customer</dt>
                <dd className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>
                  {(invoice as Record<string, string>).customer_name ?? invoice.customer?.name ?? invoice.customer_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>Status</dt>
                <dd><StatusBadge status={invoice.status} type="invoice" /></dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>Issued Date</dt>
                <dd className="text-sm" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}>
                  {new Date(invoice.issued_date).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>Due Date</dt>
                <dd className="text-sm" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}>
                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}
                </dd>
              </div>
            </dl>

            {invoice.lines && invoice.lines.length > 0 && (
              <div className="pt-4" style={{ borderTop: '1px solid var(--surface-container-high)' }}>
                <div className="rounded-xl overflow-hidden mb-4" style={{ background: 'var(--surface-container-low)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--surface-container-high)' }}>
                        {['Description', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                          <th
                            key={h}
                            className={`px-4 py-3 ${i > 0 ? 'text-right' : 'text-left'}`}
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              color: 'var(--on-surface-muted)',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lines.map((line, i) => (
                        <tr
                          key={line.id}
                          style={{ background: i % 2 === 0 ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)' }}
                        >
                          <td className="px-4 py-3" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>
                            {line.description || (line as Record<string, string>).product_name}
                          </td>
                          <td className="px-4 py-3 text-right" style={{ color: 'var(--on-surface-variant)' }}>{line.quantity}</td>
                          <td className="px-4 py-3 text-right" style={{ color: 'var(--on-surface-variant)' }}>₹{line.unit_price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-semibold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
                            ₹{line.line_total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Subtotal', value: `₹${invoice.subtotal.toLocaleString()}` },
                    { label: 'Tax', value: `₹${invoice.tax_total.toLocaleString()}` },
                    { label: 'Discount', value: `-₹${invoice.discount_total.toLocaleString()}` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between">
                      <span style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>{row.label}</span>
                      <span style={{ color: 'var(--on-surface-variant)', fontFamily: 'Inter, sans-serif' }}>{row.value}</span>
                    </div>
                  ))}
                  <div
                    className="flex justify-between font-bold text-base pt-3 mt-1"
                    style={{ borderTop: '1px solid var(--surface-container-high)' }}
                  >
                    <span style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>Grand Total</span>
                    <span style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>₹{invoice.grand_total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Payment Status */}
          {payStatus && (
            <div className="section-card">
              <h2
                className="text-sm font-bold mb-4"
                style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
              >
                Payment Status
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>Amount Paid</span>
                  <span className="font-semibold" style={{ fontFamily: 'Manrope, sans-serif', color: '#10b981' }}>
                    ₹{payStatus.amount_paid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>Outstanding</span>
                  <span className="font-semibold" style={{ fontFamily: 'Manrope, sans-serif', color: '#dc2626' }}>
                    ₹{payStatus.amount_outstanding.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Record Payment */}
          {invoice.status === 'confirmed' && payStatus && payStatus.amount_outstanding > 0 && (
            <div className="section-card">
              <h2
                className="text-sm font-bold mb-4"
                style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
              >
                Record Payment
              </h2>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  {fieldLabel('Amount')}
                  <input
                    type="number"
                    placeholder="0.00"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                    className="input-soft w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  {fieldLabel('Method')}
                  <select
                    className="input-soft w-full"
                    value={paymentForm.method}
                    onChange={e => setPaymentForm(p => ({ ...p, method: e.target.value }))}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="razorpay">Razorpay</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  {fieldLabel('Date')}
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={e => setPaymentForm(p => ({ ...p, date: e.target.value }))}
                    className="input-soft w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  {fieldLabel('Reference #')}
                  <input
                    placeholder="Optional"
                    value={paymentForm.reference}
                    onChange={e => setPaymentForm(p => ({ ...p, reference: e.target.value }))}
                    className="input-soft w-full"
                  />
                </div>
                <button
                  onClick={handleManualPayment}
                  disabled={actionLoading || !paymentForm.amount}
                  className="btn-gradient w-full flex items-center justify-center gap-2"
                  style={{ opacity: (actionLoading || !paymentForm.amount) ? 0.7 : 1 }}
                >
                  {actionLoading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : 'Record Payment'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
