'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ZapIcon, ChevronRightIcon } from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'

export default function OrdersPage() {
  const { subscriptions, loading, fetchMySubscriptions } = useSubscriptions()

  useEffect(() => {
    fetchMySubscriptions()
  }, [fetchMySubscriptions])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHero
        eyebrow="Portal orders"
        title="My orders"
        description="Your subscription history and active orders in a cleaner list layout."
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl animate-pulse"
              style={{ background: 'var(--surface-container-low)' }}
            />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--surface-container-low)' }}
          >
            <ZapIcon className="h-6 w-6" style={{ color: 'var(--on-surface-muted)' }} />
          </div>
          <p
            className="font-bold mb-1"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
          >
            No orders yet
          </p>
          <p className="text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
            Browse the shop and subscribe to products.
          </p>
          <Link href="/shop" className="font-semibold text-sm" style={{ color: '#274e82', fontFamily: 'Inter, sans-serif' }}>
            Browse Shop
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map(sub => (
            <Link key={sub.id} href={`/orders/${sub.id}`}>
              <div className="section-card p-4 flex items-center justify-between hover:shadow-[0_26px_55px_-34px_rgba(6,54,105,0.4)] transition-shadow cursor-pointer">
                <div>
                  <p
                    className="font-semibold"
                    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}
                  >
                    {sub.subscription_number}
                  </p>
                  <p
                    className="text-sm mt-0.5"
                    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
                  >
                    {(sub as Record<string, string>).plan_name ?? sub.plan?.name ?? 'No plan'} · Started {new Date(sub.start_date).toLocaleDateString()}
                  </p>
                  {sub.expiration_date && (
                    <p
                      className="text-xs mt-0.5"
                      style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
                    >
                      Expires {new Date(sub.expiration_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={sub.status} type="subscription" />
                  <ChevronRightIcon className="h-4 w-4" style={{ color: 'var(--on-surface-muted)' }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
