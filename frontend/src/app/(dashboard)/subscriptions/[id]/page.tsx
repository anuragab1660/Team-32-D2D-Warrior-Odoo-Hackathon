'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Subscription, SubscriptionStatus } from '@/types'
import { ArrowLeftIcon, LoaderIcon, FileTextIcon } from 'lucide-react'
import { toast } from 'sonner'

const STATUSES: SubscriptionStatus[] = ['draft', 'quotation', 'confirmed', 'active', 'closed']

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { updateStatus, generateInvoice } = useSubscriptions()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
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
    load()
  }, [id, router])

  const handleStatusChange = async (status: string) => {
    if (!subscription) return
    setActionLoading(true)
    try {
      const updated = await updateStatus(subscription.id, status)
      setSubscription(updated)
    } finally {
      setActionLoading(false)
    }
  }

  const handleGenerateInvoice = async () => {
    if (!subscription) return
    setActionLoading(true)
    try {
      await generateInvoice(subscription.id)
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

  if (!subscription) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title={subscription.subscription_number}
        description="Subscription details and management"
        action={
          <div className="flex items-center gap-2">
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
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200">
            <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Customer</dt>
                  <dd className="text-sm font-medium text-slate-900">{subscription.customer?.name ?? subscription.customer_id}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Status</dt>
                  <dd><StatusBadge status={subscription.status} type="subscription" /></dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Start Date</dt>
                  <dd className="text-sm text-slate-700">{new Date(subscription.start_date).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Expiration</dt>
                  <dd className="text-sm text-slate-700">{subscription.expiration_date ? new Date(subscription.expiration_date).toLocaleDateString() : '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Plan</dt>
                  <dd className="text-sm text-slate-700">{subscription.plan?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Payment Terms</dt>
                  <dd className="text-sm text-slate-700">{subscription.payment_terms ?? '—'}</dd>
                </div>
              </dl>
              {subscription.notes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <dt className="text-xs text-slate-500 mb-1">Notes</dt>
                  <dd className="text-sm text-slate-700">{subscription.notes}</dd>
                </div>
              )}
            </CardContent>
          </Card>

          {subscription.lines && subscription.lines.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader><CardTitle className="text-base">Subscription Lines</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Product</th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Qty</th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Unit Price</th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscription.lines.map(line => (
                        <tr key={line.id} className="border-b border-slate-100">
                          <td className="py-2">{line.product?.name ?? line.product_id}</td>
                          <td className="py-2 text-right">{line.quantity}</td>
                          <td className="py-2 text-right">₹{line.unit_price.toLocaleString()}</td>
                          <td className="py-2 text-right font-medium">₹{line.total_amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader><CardTitle className="text-base">Update Status</CardTitle></CardHeader>
            <CardContent>
              <Select onValueChange={handleStatusChange} defaultValue={subscription.status} disabled={actionLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader><CardTitle className="text-base">Metadata</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">ID</span>
                <span className="font-mono text-xs text-slate-700">{subscription.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-700">{new Date(subscription.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
