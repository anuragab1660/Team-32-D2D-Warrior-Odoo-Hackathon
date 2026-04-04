'use client'

import { useEffect, useState } from 'react'
import { useReports } from '@/hooks/useReports'
import { PageHero } from '@/components/shared/PageHero'
import { MetricCard } from '@/components/shared/MetricCard'
import type { MonthlyRevenue, OverdueInvoice } from '@/types'
import { BarChart3Icon, TrendingUpIcon, AlertCircleIcon, ZapIcon } from 'lucide-react'

export default function ReportsPage() {
  const { getMonthlyRevenue, getOverdueInvoices, getActiveSubscriptions, getInvoiceSummary, loading } = useReports()
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([])
  const [overdue, setOverdue] = useState<OverdueInvoice[]>([])
  const [activeSubs, setActiveSubs] = useState<unknown[]>([])
  const [invoiceSummary, setInvoiceSummary] = useState<unknown[]>([])

  useEffect(() => {
    const load = async () => {
      const [r, o, a, i] = await Promise.all([
        getMonthlyRevenue(),
        getOverdueInvoices(),
        getActiveSubscriptions(),
        getInvoiceSummary(),
      ])
      if (r) setRevenue(r)
      if (o) setOverdue(o)
      if (a) setActiveSubs(Array.isArray(a) ? a : [])
      if (i) setInvoiceSummary(Array.isArray(i) ? i : [])
    }
    load()
  }, [getMonthlyRevenue, getOverdueInvoices, getActiveSubscriptions, getInvoiceSummary])

  const totalRevenue = revenue.reduce((sum, r) => sum + (r.revenue || 0), 0)
  const maxRevenue = Math.max(...revenue.map(r => r.revenue || 0), 1)

  const summaryStats = [
    {
      label: 'Total Revenue (All Time)',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: TrendingUpIcon,
      iconBg: 'rgba(16,185,129,0.1)',
      iconColor: '#10b981',
    },
    {
      label: 'Active Subscriptions',
      value: activeSubs.length,
      icon: ZapIcon,
      iconBg: 'rgba(6,54,105,0.1)',
      iconColor: '#063669',
    },
    {
      label: 'Overdue Invoices',
      value: overdue.length,
      icon: AlertCircleIcon,
      iconBg: 'rgba(220,38,38,0.1)',
      iconColor: '#dc2626',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Reports"
        title="Business analytics and insights"
        description="A sharper view of revenue, subscription activity, and invoice performance."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {summaryStats.map(stat => (
            <MetricCard
              key={stat.label}
              label={stat.label}
              value={stat.value as string | number}
              icon={stat.icon}
              accent={stat.iconColor}
            />
          ))}
        </div>
      </PageHero>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div className="section-card">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(6,54,105,0.1)' }}
            >
              <BarChart3Icon className="h-4 w-4" style={{ color: '#063669' }} />
            </div>
            <h2
              className="text-base font-bold"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
            >
              Monthly Revenue
            </h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 rounded-xl animate-pulse"
                  style={{ background: 'var(--surface-container-low)' }}
                />
              ))}
            </div>
          ) : revenue.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>
              No revenue data available
            </p>
          ) : (
            <div className="space-y-3">
              {revenue.slice(-12).map(item => (
                <div key={item.month}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}>
                      {item.month}
                    </span>
                    <span className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
                      ₹{(item.revenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-container-low)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${((item.revenue || 0) / maxRevenue) * 100}%`,
                        background: 'linear-gradient(135deg, #063669, #274e82)',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
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
            <p className="text-sm text-center py-10" style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>
              No overdue invoices
            </p>
          ) : (
            <div className="space-y-1">
              {overdue.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 px-3 rounded-xl"
                  style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface-container-low)' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>
                      {item.invoice_number}
                    </p>
                    <p className="text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
                      {item.customer_name} · {item.days_overdue} days overdue
                    </p>
                  </div>
                  <span className="text-sm font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: '#dc2626' }}>
                    ₹{(item.amount || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {invoiceSummary.length > 0 && (
        <div className="section-card">
          <h2
            className="text-base font-bold mb-5"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
          >
            Invoice Summary
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-container-low)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--surface-container-high)' }}>
                  {['Status', 'Count', 'Total Amount'].map((h, i) => (
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
                {(invoiceSummary as Array<{ status: string; count: number; total: number }>).map((row, i) => (
                  <tr
                    key={row.status}
                    style={{ background: i % 2 === 0 ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)' }}
                  >
                    <td className="px-4 py-3 capitalize" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>
                      {row.status}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}>
                      {row.count}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
                      ₹{(row.total || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
