'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageHero } from '@/components/shared/PageHero'
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
        <LoaderIcon className="h-8 w-8 animate-spin" style={{ color: '#274e82' }} />
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="max-w-2xl space-y-6 mx-auto">
      <PageHero
        eyebrow="Order details"
        title={order.subscription_number}
        description="A concise view of this subscription order and its line items."
        action={
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: '#17457d', fontFamily: 'Inter, sans-serif' }}
          >
            <ArrowLeftIcon className="h-4 w-4" />Back to orders
          </Link>
        }
      >
        <StatusBadge status={order.status} type="subscription" />
      </PageHero>

      {/* Subscription Details */}
      <div className="section-card">
        <h2
          className="text-sm font-bold mb-5"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
        >
          Subscription Details
        </h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>Plan</dt>
            <dd className="font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>
              {(order as Record<string, string>).plan_name ?? order.plan?.name ?? 'No plan'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>Start Date</dt>
            <dd style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}>
              {new Date(order.start_date).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>Expiration</dt>
            <dd style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}>
              {order.expiration_date ? new Date(order.expiration_date).toLocaleDateString() : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>Payment Terms</dt>
            <dd style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}>
              {order.payment_terms ?? '—'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Items */}
      {order.lines && order.lines.length > 0 && (
        <div className="section-card">
          <h2
            className="text-sm font-bold mb-5"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
          >
            Items
          </h2>
          <div className="space-y-2">
            {order.lines.map((line, i) => (
              <div
                key={line.id}
                className="flex items-center justify-between py-3 px-3 rounded-xl"
                style={{ background: i % 2 === 0 ? 'var(--surface-container-low)' : 'transparent' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>
                    {(line as Record<string, string>).product_name ?? line.product?.name ?? 'Product'}
                  </p>
                  {line.variant && (
                    <p className="text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
                      {line.variant.attribute}: {line.variant.value}
                    </p>
                  )}
                  <p className="text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
                    Qty: {line.quantity} × ₹{line.unit_price.toLocaleString()}
                  </p>
                </div>
                <p className="font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
                  ₹{line.total_amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="section-card">
          <h2
            className="text-sm font-bold mb-3"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
          >
            Notes
          </h2>
          <p className="text-sm" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}>
            {order.notes}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/my-invoices">
          <button className="btn-soft">View Invoices</button>
        </Link>
      </div>
    </div>
  )
}
