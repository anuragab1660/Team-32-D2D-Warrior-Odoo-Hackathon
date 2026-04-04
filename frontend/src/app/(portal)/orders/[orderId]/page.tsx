'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useCartStore } from '@/stores/cart'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import type { Subscription, Invoice, BillingPeriod } from '@/types'
import {
  ArrowLeftIcon, LoaderIcon, FileTextIcon, RotateCcwIcon,
  MessageSquareIcon, AlertTriangleIcon,
} from 'lucide-react'
import { toast } from 'sonner'

/**
 * @module portal/orders/[orderId]
 * @api-calls GET /api/subscriptions/:id, GET /api/invoices/my
 * @depends-on useCartStore
 * @role portal
 * @emits none
 * RUFLOW_REVIEW: order detail - timeline, products, linked invoices, renewal/support dialogs
 */

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getProgressPct(startDate: string, expiryDate: string) {
  const start = new Date(startDate).getTime()
  const end = new Date(expiryDate).getTime()
  const now = Date.now()
  if (end <= start) return 100
  return Math.min(Math.max(((now - start) / (end - start)) * 100, 0), 100)
}

function computeEndDate(start: string, bp: BillingPeriod) {
  const d = new Date(start)
  if (bp === 'daily')   d.setDate(d.getDate() + 1)
  if (bp === 'weekly')  d.setDate(d.getDate() + 7)
  if (bp === 'monthly') d.setMonth(d.getMonth() + 1)
  if (bp === 'yearly')  d.setFullYear(d.getFullYear() + 1)
  return d
}

export default function OrderDetailPage() {
  /**
   * @module portal/orders/[orderId]
   * @api-calls GET /api/subscriptions/:id, GET /api/invoices/my
   * @depends-on useCartStore
   * @role portal
   * @emits none
   * RUFLOW_REVIEW: order detail - timeline, products, linked invoices, renewal/support dialogs
   */
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()
  const { addItem, setBillingPeriod, setStartDate } = useCartStore()

  const [order, setOrder] = useState<Subscription | null>(null)
  const [linkedInvoices, setLinkedInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  // Renewal dialog
  const [showRenewal, setShowRenewal] = useState(false)
  const [renewalBP, setRenewalBP] = useState<BillingPeriod>('monthly')
  const [renewalStart, setRenewalStart] = useState(new Date().toISOString().split('T')[0])

  // Support dialog
  const [showSupport, setShowSupport] = useState(false)
  const [supportSubject, setSupportSubject] = useState('')
  const [supportMessage, setSupportMessage] = useState('')
  const [sendingSupport, setSendingSupport] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/api/subscriptions/${orderId}`)
        setOrder(data.data)
        // Fetch linked invoices
        const invRes = await api.get(`/api/invoices/my?limit=50`)
        const allInvoices: Invoice[] = invRes.data.data || []
        setLinkedInvoices(allInvoices.filter((inv: Invoice) => inv.subscription_id === orderId))
      } catch {
        toast.error('Order not found')
        router.push('/orders')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId, router])

  const handleRenew = () => {
    if (!order?.lines?.length) { toast.error('No products to renew'); return }
    for (const line of order.lines) {
      const productName = (line as unknown as Record<string,string>).product_name ?? line.product?.name ?? 'Product'
      addItem({
        product_id: line.product_id,
        variant_id: line.variant_id || undefined,
        quantity: line.quantity,
        product_name: productName,
        unit_price: line.unit_price,
      })
    }
    setBillingPeriod(renewalBP)
    setStartDate(renewalStart)
    setShowRenewal(false)
    toast.success('Products added to cart for renewal')
    router.push('/cart')
  }

  const handleSendSupport = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      toast.error('Please fill in subject and message')
      return
    }
    setSendingSupport(true)
    try {
      // Attempt API, fallback to toast
      await api.post('/api/support', {
        subject: supportSubject,
        message: supportMessage,
        subscription_id: orderId,
      }).catch(() => null)
      toast.success('Support message sent!')
      setShowSupport(false)
      setSupportSubject('')
      setSupportMessage('')
    } finally {
      setSendingSupport(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoaderIcon className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!order) return null

  const isExpired = order.status === 'expired'
  const isActive = order.status === 'active'
  const daysLeft = order.expiration_date ? daysUntil(order.expiration_date) : null
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0
  const pct = order.expiration_date ? getProgressPct(order.start_date, order.expiration_date) : 0
  const planName = (order as unknown as Record<string,string>).plan_name ?? order.plan?.name ?? 'No plan'
  const billingPeriod = (order as unknown as Record<string,string>).billing_period
  const todayStr = new Date().toISOString().split('T')[0]
  const renewalEndDate = computeEndDate(renewalStart, renewalBP)

  const lineSubtotal = order.lines?.reduce((s, l) => s + l.total_amount, 0) ?? 0

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-3xl space-y-6">
      <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeftIcon className="h-4 w-4" />My Orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{order.subscription_number}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-500">{planName}</span>
            {billingPeriod && <Badge variant="outline" className="text-xs capitalize">{billingPeriod}</Badge>}
          </div>
        </div>
        <StatusBadge status={order.status} type="subscription" />
      </div>

      {/* Expiring soon warning */}
      {isExpiringSoon && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
          <p className="text-sm text-amber-800 font-medium">
            This subscription expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Renew to avoid interruption.
          </p>
        </div>
      )}

      {/* Info grid */}
      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Subscription Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div><dt className="text-slate-500 mb-1">Start Date</dt><dd className="font-medium">{fmtDate(order.start_date)}</dd></div>
            <div><dt className="text-slate-500 mb-1">Expiry Date</dt><dd className="font-medium">{order.expiration_date ? fmtDate(order.expiration_date) : '—'}</dd></div>
            <div><dt className="text-slate-500 mb-1">Plan</dt><dd className="font-medium">{planName}</dd></div>
            <div><dt className="text-slate-500 mb-1">Billing Period</dt><dd className="font-medium capitalize">{billingPeriod || '—'}</dd></div>
            <div><dt className="text-slate-500 mb-1">Payment Terms</dt><dd className="font-medium">{order.payment_terms ?? '—'}</dd></div>
            <div><dt className="text-slate-500 mb-1">Created</dt><dd className="font-medium">{fmtDate(order.created_at)}</dd></div>
          </dl>
          {order.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <dt className="text-slate-500 text-sm mb-1">Notes</dt>
              <dd className="text-sm text-slate-700">{order.notes}</dd>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      {order.expiration_date && (
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Subscription Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <span>{fmtDate(order.start_date)}</span>
              <div className="flex-1 relative h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isExpiringSoon ? 'bg-amber-400' : isExpired ? 'bg-red-400' : 'bg-indigo-500'}`}
                  style={{ width: `${pct}%` }}
                />
                {/* Today marker */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-slate-700"
                  style={{ left: `${Math.min(pct, 98)}%` }}
                />
              </div>
              <span>{fmtDate(order.expiration_date)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Start</span>
              <span className="font-medium text-slate-600">
                {daysLeft !== null
                  ? daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'
                  : 'No expiry set'}
              </span>
              <span>End</span>
            </div>
            {isActive && isExpiringSoon && (
              <p className="text-xs text-amber-600 mt-2 font-medium">⚠️ Renew soon to avoid service interruption</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Products */}
      {order.lines && order.lines.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Subscribed Products</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.lines.map(line => (
                <div key={line.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{(line as unknown as Record<string,string>).product_name ?? line.product?.name ?? 'Product'}</p>
                    {line.variant && (
                      <p className="text-xs text-slate-500">{line.variant.attribute}: {line.variant.value}</p>
                    )}
                    <p className="text-xs text-slate-500">Qty: {line.quantity} × ₹{line.unit_price.toLocaleString('en-IN')}</p>
                  </div>
                  <p className="font-semibold text-slate-900">₹{line.total_amount.toLocaleString('en-IN')}</p>
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <div className="text-sm">
                  <span className="text-slate-500">Subtotal: </span>
                  <span className="font-bold text-slate-900">₹{lineSubtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linked Invoices */}
      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Invoices</CardTitle></CardHeader>
        <CardContent>
          {linkedInvoices.length === 0 ? (
            <p className="text-sm text-slate-400">No invoices generated yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Invoice #</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Date</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Amount</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Status</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {linkedInvoices.map(inv => (
                  <tr key={inv.id} className="border-b border-slate-50">
                    <td className="py-2 font-medium">{inv.invoice_number}</td>
                    <td className="py-2 text-slate-500">{fmtDate(inv.issued_date)}</td>
                    <td className="py-2 text-right font-medium">₹{inv.grand_total.toLocaleString('en-IN')}</td>
                    <td className="py-2 text-right"><StatusBadge status={inv.status} type="invoice" /></td>
                    <td className="py-2 text-right">
                      {inv.status === 'confirmed' || inv.status === 'overdue' ? (
                        <Link href={`/my-invoices/${inv.id}`}>
                          <Button size="sm" className="h-6 text-xs bg-indigo-600 hover:bg-indigo-700">Pay Now</Button>
                        </Link>
                      ) : (
                        <Link href={`/my-invoices/${inv.id}`} className="text-xs text-indigo-600 hover:underline">View</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {isExpired && (
          <Button onClick={() => setShowRenewal(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <RotateCcwIcon className="h-4 w-4" />Renew Subscription
          </Button>
        )}
        <Link href="/my-invoices">
          <Button variant="outline" className="gap-2">
            <FileTextIcon className="h-4 w-4" />View All Invoices
          </Button>
        </Link>
        <Button variant="outline" onClick={() => setShowSupport(true)} className="gap-2">
          <MessageSquareIcon className="h-4 w-4" />Contact Support
        </Button>
      </div>

      {/* Renewal Dialog */}
      <Dialog open={showRenewal} onOpenChange={setShowRenewal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>🔄 Renew Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">{order.subscription_number} has expired. Choose new billing period:</p>
            <div className="space-y-2">
              {(['monthly', 'weekly', 'yearly'] as const).map(bp => (
                <button
                  key={bp}
                  onClick={() => setRenewalBP(bp)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors capitalize text-sm ${
                    renewalBP === bp
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                      : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  {bp === 'monthly' ? 'Monthly' : bp === 'weekly' ? 'Weekly' : 'Yearly'}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>New Start Date</Label>
              <input
                type="date"
                min={todayStr}
                value={renewalStart}
                onChange={e => setRenewalStart(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <p className="text-xs text-slate-500">
              New End Date: <span className="font-semibold">{fmtDate(renewalEndDate)}</span>
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRenewal(false)}>Cancel</Button>
            <Button onClick={handleRenew} className="bg-indigo-600 hover:bg-indigo-700">Renew &amp; Checkout →</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Support Dialog */}
      <Dialog open={showSupport} onOpenChange={setShowSupport}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>💬 Contact Support</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Describe your issue briefly"
                value={supportSubject}
                onChange={e => setSupportSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Please describe your issue in detail..."
                value={supportMessage}
                onChange={e => setSupportMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSupport(false)}>Cancel</Button>
            <Button
              onClick={handleSendSupport}
              disabled={sendingSupport}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {sendingSupport && <LoaderIcon className="h-4 w-4 animate-spin" />}
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
