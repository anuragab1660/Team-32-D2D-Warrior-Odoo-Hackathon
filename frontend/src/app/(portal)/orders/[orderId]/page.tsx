'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Subscription } from '@/types'
import { ArrowLeftIcon, LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/api/subscriptions/${orderId}`)
        setOrder(data.data)
      } catch {
        toast.error('Order not found')
        router.push('/orders')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoaderIcon className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeftIcon className="h-4 w-4" />Back to orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{order.subscription_number}</h1>
          <p className="text-sm text-slate-500 mt-1">Order details</p>
        </div>
        <StatusBadge status={order.status} type="subscription" />
      </div>

      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Subscription Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500 mb-1">Plan</dt>
              <dd className="font-medium text-slate-900">{(order as unknown as Record<string, string>).plan_name ?? order.plan?.name ?? 'No plan'}</dd>
            </div>
            <div>
              <dt className="text-slate-500 mb-1">Start Date</dt>
              <dd className="text-slate-700">{new Date(order.start_date).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-slate-500 mb-1">Expiration</dt>
              <dd className="text-slate-700">{order.expiration_date ? new Date(order.expiration_date).toLocaleDateString() : '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500 mb-1">Payment Terms</dt>
              <dd className="text-slate-700">{order.payment_terms ?? '—'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {order.lines && order.lines.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.lines.map(line => (
                <div key={line.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{(line as unknown as Record<string, string>).product_name ?? line.product?.name ?? 'Product'}</p>
                    {line.variant && (
                      <p className="text-xs text-slate-500">{line.variant.attribute}: {line.variant.value}</p>
                    )}
                    <p className="text-xs text-slate-500">Qty: {line.quantity} × ₹{line.unit_price.toLocaleString()}</p>
                  </div>
                  <p className="font-semibold text-slate-900">₹{line.total_amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {order.notes && (
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Link href="/my-invoices">
          <Button variant="outline">View Invoices</Button>
        </Link>
      </div>
    </div>
  )
}
