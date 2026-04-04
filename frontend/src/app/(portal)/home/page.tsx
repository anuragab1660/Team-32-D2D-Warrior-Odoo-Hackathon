'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { useInvoices } from '@/hooks/useInvoices'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageHero } from '@/components/shared/PageHero'
import { MetricCard } from '@/components/shared/MetricCard'
import { ShoppingBagIcon, FileTextIcon, ZapIcon, ArrowRightIcon } from 'lucide-react'

export default function PortalHomePage() {
  const { user } = useAuth()
  const { subscriptions, fetchMySubscriptions } = useSubscriptions()
  const { invoices, fetchMyInvoices } = useInvoices()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchMySubscriptions(), fetchMyInvoices()])
      setLoaded(true)
    }
    load()
  }, [fetchMySubscriptions, fetchMyInvoices])

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active')
  const pendingInvoices = invoices.filter(i => i.status === 'confirmed')

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHero
        eyebrow="Portal home"
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'there'}!`}
        description="Here&apos;s a compact view of your account, recent subscriptions, and open invoices."
        action={
          <Link href="/shop">
            <button className="btn-gradient flex items-center gap-2">
              <ShoppingBagIcon className="h-4 w-4" />Go to Shop
            </button>
          </Link>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard label="Active Subscriptions" value={loaded ? activeSubscriptions.length : '—'} icon={ZapIcon} accent="#063669" />
          <MetricCard label="Pending Invoices" value={loaded ? pendingInvoices.length : '—'} icon={FileTextIcon} accent="#d97706" />
          <MetricCard label="Browse Products" value="Shop" icon={ShoppingBagIcon} accent="#1f5a95" description="Jump into the product catalog." />
        </div>
      </PageHero>

      {activeSubscriptions.length > 0 && (
        <div className="section-card">
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-base font-bold"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
            >
              My Subscriptions
            </h2>
            <Link
              href="/orders"
              className="flex items-center gap-1 text-sm font-semibold"
              style={{ color: '#274e82', fontFamily: 'Inter, sans-serif' }}
            >
              View all <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {activeSubscriptions.slice(0, 3).map((sub, i) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: i % 2 === 0 ? 'var(--surface-container-low)' : 'transparent' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>
                    {sub.subscription_number}
                  </p>
                  <p className="text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
                    {(sub as Record<string, string>).plan_name ?? sub.plan?.name ?? 'No plan'} · Started {new Date(sub.start_date).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={sub.status} type="subscription" />
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingInvoices.length > 0 && (
        <div className="section-card">
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-base font-bold"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
            >
              Invoices Due
            </h2>
            <Link
              href="/my-invoices"
              className="flex items-center gap-1 text-sm font-semibold"
              style={{ color: '#274e82', fontFamily: 'Inter, sans-serif' }}
            >
              View all <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {pendingInvoices.slice(0, 3).map((inv, i) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: i % 2 === 0 ? 'rgba(245,158,11,0.06)' : 'transparent' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>
                    {inv.invoice_number}
                  </p>
                  <p className="text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
                    Due {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
                  >
                    ₹{inv.grand_total.toLocaleString()}
                  </p>
                  <Link
                    href={`/my-invoices/${inv.id}`}
                    className="text-xs font-semibold"
                    style={{ color: '#274e82', fontFamily: 'Inter, sans-serif' }}
                  >
                    Pay now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
