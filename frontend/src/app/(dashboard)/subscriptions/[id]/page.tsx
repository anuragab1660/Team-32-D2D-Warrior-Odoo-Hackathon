'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Subscription, SubscriptionStatus } from '@/types'
import { ArrowLeftIcon, LoaderIcon, FileTextIcon } from 'lucide-react'
import { toast } from 'sonner'

const STATUSES: SubscriptionStatus[] = ['draft', 'quotation', 'confirmed', 'active', 'closed']

const infoLabel = (text: string) => (
  <dt className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
    {text}
  </dt>
)

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
        <LoaderIcon className="h-8 w-8 animate-spin" style={{ color: '#274e82' }} />
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
              <button className="btn-soft flex items-center gap-2">
                <ArrowLeftIcon className="h-4 w-4" />Back
              </button>
            </Link>
            <button
              onClick={handleGenerateInvoice}
              disabled={actionLoading}
              className="btn-soft flex items-center gap-2"
              style={{ opacity: actionLoading ? 0.7 : 1 }}
            >
              <FileTextIcon className="h-4 w-4" />Generate Invoice
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Overview */}
          <div className="section-card">
            <h2
              className="text-sm font-bold mb-5"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
            >
              Overview
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                {infoLabel('Customer')}
                <dd className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>
                  {(subscription as Record<string, string>).customer_name ?? subscription.customer?.name ?? subscription.customer_id}
                </dd>
              </div>
              <div>
                {infoLabel('Status')}
                <dd><StatusBadge status={subscription.status} type="subscription" /></dd>
              </div>
              <div>
                {infoLabel('Start Date')}
                <dd className="text-sm" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}>
                  {new Date(subscription.start_date).toLocaleDateString()}
                </dd>
              </div>
              <div>
                {infoLabel('Expiration')}
                <dd className="text-sm" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}>
                  {subscription.expiration_date ? new Date(subscription.expiration_date).toLocaleDateString() : '—'}
                </dd>
              </div>
              <div>
                {infoLabel('Plan')}
                <dd className="text-sm" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}>
                  {(subscription as Record<string, string>).plan_name ?? subscription.plan?.name ?? '—'}
                </dd>
              </div>
              <div>
                {infoLabel('Payment Terms')}
                <dd className="text-sm" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}>
                  {subscription.payment_terms ?? '—'}
                </dd>
              </div>
            </dl>
            {subscription.notes && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--surface-container-high)' }}>
                {infoLabel('Notes')}
                <dd className="text-sm" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}>
                  {subscription.notes}
                </dd>
              </div>
            )}
          </div>

          {/* Lines */}
          {subscription.lines && subscription.lines.length > 0 && (
            <div className="section-card">
              <h2
                className="text-sm font-bold mb-5"
                style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
              >
                Subscription Lines
              </h2>
              <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-container-low)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--surface-container-high)' }}>
                      {['Product', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
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
                    {subscription.lines.map((line, i) => (
                      <tr
                        key={line.id}
                        style={{ background: i % 2 === 0 ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)' }}
                      >
                        <td className="px-4 py-3" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>
                          {(line as Record<string, string>).product_name ?? line.product?.name ?? line.product_id}
                        </td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--on-surface-variant)' }}>{line.quantity}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--on-surface-variant)' }}>₹{line.unit_price.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
                          ₹{line.total_amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Update Status */}
          <div className="section-card">
            <h2
              className="text-sm font-bold mb-4"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
            >
              Update Status
            </h2>
            <select
              className="input-soft w-full"
              defaultValue={subscription.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={actionLoading}
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Metadata */}
          <div className="section-card">
            <h2
              className="text-sm font-bold mb-4"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
            >
              Metadata
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>ID</span>
                <span
                  className="font-mono text-xs"
                  style={{ color: 'var(--on-surface-variant)' }}
                >
                  {subscription.id.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>Created</span>
                <span style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}>
                  {new Date(subscription.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
