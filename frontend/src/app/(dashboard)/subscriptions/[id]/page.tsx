'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Subscription } from '@/types'
import {
  ArrowLeftIcon, FileTextIcon, PauseIcon, PlayIcon, XCircleIcon,
  RefreshCwIcon, CreditCardIcon,
} from 'lucide-react'
import { toast } from 'sonner'

interface InvoiceRow {
  id: string; invoice_number: string; status: string; grand_total: number; issued_date: string
}
interface PaymentRow {
  id: string; amount: number; payment_method: string; status: string; payment_date: string; reference_number?: string
}

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { updateStatus, generateInvoice } = useSubscriptions()
  const [subscription, setSubscription] = useState<Subscription & Record<string, unknown> | null>(null)
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get(`/api/subscriptions/${id}`)
      setSubscription(data.data)
    } catch {
      toast.error('Subscription not found')
      router.push('/subscriptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Fetch linked invoices and payments
    api.get(`/api/invoices?subscription_id=${id}&limit=10`).then(r => setInvoices(r.data.data || [])).catch(() => {})
    api.get(`/api/payments?subscription_id=${id}&limit=10`).then(r => setPayments(r.data.data || [])).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleAction = async (status: string) => {
    if (!subscription) return
    setActionLoading(true)
    try {
      const updated = await updateStatus(subscription.id, status)
      if (updated) setSubscription(updated as Subscription & Record<string, unknown>)
    } finally {
      setActionLoading(false)
    }
  }

  const handleGenerateInvoice = async () => {
    if (!subscription) return
    setActionLoading(true)
    try {
      await generateInvoice(subscription.id)
      // Refresh invoices
      const r = await api.get(`/api/invoices?subscription_id=${id}&limit=10`)
      setInvoices(r.data.data || [])
    } catch {
      toast.error('Failed to generate invoice')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!subscription) return null

  const status = subscription.status as string
  const canPause = status === 'active'
  const canResume = status === 'paused'
  const canCancel = ['active', 'paused', 'quotation', 'confirmed'].includes(status)
  const canRenew = status === 'expired'

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <PageHeader
        title={subscription.subscription_number as string}
        description="Subscription details and management"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/subscriptions">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeftIcon className="h-4 w-4" />Back
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateInvoice}
              disabled={actionLoading}
              className="gap-2"
            >
              <FileTextIcon className="h-4 w-4" />Generate Invoice
            </Button>
            {canPause && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('paused')}
                disabled={actionLoading}
                className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <PauseIcon className="h-4 w-4" />Pause
              </Button>
            )}
            {canResume && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('active')}
                disabled={actionLoading}
                className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
              >
                <PlayIcon className="h-4 w-4" />Resume
              </Button>
            )}
            {canRenew && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('active')}
                disabled={actionLoading}
                className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <RefreshCwIcon className="h-4 w-4" />Renew
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCancelOpen(true)}
                disabled={actionLoading}
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircleIcon className="h-4 w-4" />Cancel
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Overview */}
          <Card className="border-slate-200">
            <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Customer</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    {(subscription.customer_name as string) ?? subscription.customer?.name ?? subscription.customer_id}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Status</dt>
                  <dd><StatusBadge status={status} type="subscription" /></dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Start Date</dt>
                  <dd className="text-sm text-slate-700">
                    {new Date(subscription.start_date as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Renewal / Expiry</dt>
                  <dd className="text-sm text-slate-700">
                    {subscription.expiration_date
                      ? new Date(subscription.expiration_date as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Plan</dt>
                  <dd className="text-sm text-slate-700">{(subscription.plan_name as string) ?? subscription.plan?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Payment Terms</dt>
                  <dd className="text-sm text-slate-700">{(subscription.payment_terms as string) ?? '—'}</dd>
                </div>
              </dl>
              {subscription.notes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <dt className="text-xs text-slate-500 mb-1">Notes</dt>
                  <dd className="text-sm text-slate-700">{subscription.notes as string}</dd>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Lines */}
          {Array.isArray(subscription.lines) && (subscription.lines as unknown[]).length > 0 && (
            <Card className="border-slate-200">
              <CardHeader><CardTitle className="text-base">Products / Lines</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Product</th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2 w-16">Qty</th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2 w-28">Unit Price</th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2 w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(subscription.lines as unknown as Record<string, unknown>[]).map((line) => (
                        <tr key={line.id as string} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2">{(line.product_name as string) ?? (line.product as Record<string,unknown>)?.name as string ?? line.product_id as string}</td>
                          <td className="py-2 text-right text-slate-600">{line.quantity as number}</td>
                          <td className="py-2 text-right text-slate-700">₹{Number(line.unit_price).toLocaleString('en-IN')}</td>
                          <td className="py-2 text-right font-medium">₹{Number(line.total_amount).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Linked Invoices */}
          {invoices.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader><CardTitle className="text-base">Linked Invoices</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <FileTextIcon className="h-4 w-4 text-slate-400" />
                        <div>
                          <Link href={`/invoices/${inv.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                            {inv.invoice_number}
                          </Link>
                          <p className="text-xs text-slate-500">{new Date(inv.issued_date).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">₹{Number(inv.grand_total).toLocaleString('en-IN')}</span>
                        <Badge className={inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                          {inv.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Linked Payments */}
          {payments.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader><CardTitle className="text-base">Linked Payments</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {payments.map(pay => (
                    <div key={pay.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <CreditCardIcon className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-800 capitalize">
                            {pay.payment_method.replace('_', ' ')}
                            {pay.reference_number && <span className="text-xs text-slate-500 ml-1 font-mono">#{pay.reference_number}</span>}
                          </p>
                          <p className="text-xs text-slate-500">{new Date(pay.payment_date).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-green-700">₹{Number(pay.amount).toLocaleString('en-IN')}</span>
                        <Badge className="bg-green-100 text-green-700">{pay.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader><CardTitle className="text-base">Metadata</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">ID</span>
                <span className="font-mono text-xs text-slate-700 break-all">{subscription.id as string}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-700">
                  {new Date(subscription.created_at as string).toLocaleDateString('en-IN')}
                </span>
              </div>
              {subscription.updated_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Updated</span>
                  <span className="text-slate-700">
                    {new Date(subscription.updated_at as string).toLocaleDateString('en-IN')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Subscription"
        description="Are you sure you want to cancel this subscription? This action cannot be undone."
        confirmLabel="Cancel Subscription"
        variant="destructive"
        onConfirm={async () => {
          await handleAction('cancelled')
          setCancelOpen(false)
        }}
      />
    </motion.div>
  )
}
