'use client'

import { useEffect, useState } from 'react'
import { useReports } from '@/hooks/useReports'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardMetrics, MonthlyRevenue, OverdueInvoice } from '@/types'
import { ZapIcon, FileTextIcon, CreditCardIcon, TrendingUpIcon, AlertCircleIcon, UsersIcon, BuildingIcon, ClockIcon } from 'lucide-react'
import { motion } from 'framer-motion'

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
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Monthly Revenue',
      value: metrics ? `₹${(metrics.monthly_revenue ?? 0).toLocaleString()}` : '--',
      icon: TrendingUpIcon,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Overdue Invoices',
      value: metrics?.overdue_invoices ?? '--',
      icon: FileTextIcon,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Pending Payments',
      value: metrics?.pending_payments ?? '--',
      icon: CreditCardIcon,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
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
      <PageHeader title="Dashboard" description="Overview of your subscription business" />

      {loading && !metrics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              className="h-28 rounded-xl bg-slate-100 animate-pulse"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35, ease: 'easeOut' }}
            >
              <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <Card className="border-slate-200 hover:border-indigo-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <motion.div
                        className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center`}
                        whileHover={{ scale: 1.12, rotate: 6 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </motion.div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
        >
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {revenue.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No revenue data available</p>
              ) : (
                <div className="space-y-2">
                  {revenue.slice(-6).map((item, i) => (
                    <motion.div
                      key={item.month}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.05 }}
                    >
                      <span className="text-sm text-slate-600">{item.month}</span>
                      <span className="text-sm font-semibold text-slate-900">₹{(item.revenue ?? 0).toLocaleString()}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.35 }}
        >
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircleIcon className="h-4 w-4 text-red-500" />
                <CardTitle className="text-base font-semibold text-slate-800">Overdue Invoices</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {overdue.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No overdue invoices</p>
              ) : (
                <div className="space-y-2">
                  {overdue.slice(0, 6).map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.invoice_number}</p>
                        <p className="text-xs text-slate-500">{item.customer_name} · {item.days_overdue}d overdue</p>
                      </div>
                      <span className="text-sm font-semibold text-red-600">₹{(item.amount ?? 0).toLocaleString()}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
