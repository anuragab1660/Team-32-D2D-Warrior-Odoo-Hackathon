'use client'

import { useEffect, useState } from 'react'
import { useReports } from '@/hooks/useReports'
import { PageHero } from '@/components/shared/PageHero'
import { MetricCard } from '@/components/shared/MetricCard'
import type { DashboardMetrics, MonthlyRevenue, OverdueInvoice } from '@/types'
import { ZapIcon, FileTextIcon, CreditCardIcon, TrendingUpIcon, AlertCircleIcon, UsersIcon, BuildingIcon, ClockIcon } from 'lucide-react'

export default function DashboardPage() {
  const { getDashboard, getMonthlyRevenue, getOverdueInvoices, loading } = useReports()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([])
  const [overdue, setOverdue] = useState<OverdueInvoice[]>([])

  useEffect(() => {
    const load = async () => {
      const [m, r, o] = await Promise.all([getDashboard(), getMonthlyRevenue(), getOverdueInvoices()])
      if (m) setMetrics(m)
      if (r) setRevenue(r)
      if (o) setOverdue(o)
    }
    load()
  }, [getDashboard, getMonthlyRevenue, getOverdueInvoices])

  const stats = [
    {
      label: 'Active Subscriptions',
      value: metrics?.active_subscriptions ?? '--',
      icon: ZapIcon,
      iconBg: 'rgba(6,54,105,0.1)',
      iconColor: '#063669',
    },
    {
      label: 'Monthly Revenue',
      value: metrics ? `₹${(metrics.monthly_revenue ?? 0).toLocaleString()}` : '--',
      icon: TrendingUpIcon,
      iconBg: 'rgba(16,185,129,0.1)',
      iconColor: '#10b981',
    },
    {
      label: 'Overdue Invoices',
      value: metrics?.overdue_invoices ?? '--',
      icon: FileTextIcon,
      iconBg: 'rgba(220,38,38,0.1)',
      iconColor: '#dc2626',
    },
    {
      label: 'Pending Payments',
      value: metrics?.pending_payments ?? '--',
      icon: CreditCardIcon,
      iconBg: 'rgba(245,158,11,0.1)',
      iconColor: '#d97706',
    },
    {
      label: 'Expiring (30 days)',
      value: metrics?.expiring_soon ?? '--',
      icon: ClockIcon,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Total Users',
      value: metrics?.total_users ?? '--',
      icon: UsersIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Customers',
      value: metrics?.total_customers ?? '--',
      icon: BuildingIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Dashboard"
        title="Overview of your subscription business"
        description="Track revenue, active subscriptions, and overdue invoices from a calmer, more information-dense workspace."
      >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {loading && !metrics
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 rounded-[1.5rem] animate-pulse border border-white/70 bg-white/80 shadow-[0_24px_60px_-42px_rgba(6,54,105,0.28)]"
                  />
                ))
              : stats.map(stat => (
                  <MetricCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value as string | number}
                    icon={stat.icon}
                    accent={stat.iconColor}
                    className="bg-white/75"
                  />
                ))}
          </div>
      </PageHero>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div className="section-card">
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-base font-bold"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
            >
              Monthly Revenue
            </h2>
          </div>
          {revenue.length === 0 ? (
            <p
              className="text-sm text-center py-10"
              style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
            >
              No revenue data available
            </p>
          ) : (
            <div className="space-y-1">
              {revenue.slice(-6).map(item => {
                const maxRevenue = Math.max(...revenue.slice(-6).map(r => r.revenue ?? 0))
                const pct = maxRevenue > 0 ? ((item.revenue ?? 0) / maxRevenue) * 100 : 0
                return (
                  <div key={item.month} className="py-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-sm"
                        style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}
                      >
                        {item.month}
                      </span>
                      <span
                        className="text-sm font-semibold"
                        style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
                      >
                        ₹{(item.revenue ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'var(--surface-container-low)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(135deg, #063669, #274e82)',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Overdue Invoices */}
        <div className="section-card">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.1)' }}
            >
              <AlertCircleIcon className="h-4 w-4" style={{ color: '#dc2626' }} />
            </div>
            <h2
              className="text-base font-bold"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
            >
              Overdue Invoices
            </h2>
          </div>
          {overdue.length === 0 ? (
            <p
              className="text-sm text-center py-10"
              style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
            >
              No overdue invoices
            </p>
          ) : (
            <div className="space-y-1">
              {overdue.slice(0, 6).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 rounded-xl px-3"
                  style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface-container-low)' }}
                >
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}
                    >
                      {item.invoice_number}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
                    >
                      {item.customer_name} · {item.days_overdue}d overdue
                    </p>
                  </div>
                  <span
                    className="text-sm font-bold"
                    style={{ fontFamily: 'Manrope, sans-serif', color: '#dc2626' }}
                  >
                    ₹{(item.amount ?? 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
