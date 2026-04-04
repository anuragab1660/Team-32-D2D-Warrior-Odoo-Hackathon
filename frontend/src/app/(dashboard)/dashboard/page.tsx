'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useReports } from '@/hooks/useReports'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardMetrics, MonthlyRevenue, OverdueInvoice } from '@/types'
import {
  ZapIcon, FileTextIcon, CreditCardIcon, TrendingUpIcon,
  AlertCircleIcon, UsersIcon, BuildingIcon, ClockIcon,
  PlusIcon, PackageIcon, UserCheckIcon, BarChart3Icon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import api from '@/lib/api'

interface ActivityItem {
  type: string
  id: string
  ref: string
  customer_name: string
  created_at: string
  description: string
}

interface StatusBreakdown {
  status: string
  count: string
}

const PIE_COLORS: Record<string, string> = {
  active: '#6366f1',
  paused: '#f59e0b',
  cancelled: '#ef4444',
  expired: '#94a3b8',
  quotation: '#06b6d4',
  confirmed: '#10b981',
  closed: '#64748b',
}

export default function DashboardPage() {
  const { getDashboard, getMonthlyRevenue, getOverdueInvoices, loading } = useReports()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([])
  const [overdue, setOverdue] = useState<OverdueInvoice[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [breakdown, setBreakdown] = useState<StatusBreakdown[]>([])

  useEffect(() => {
    const load = async () => {
      const [m, r, o] = await Promise.all([getDashboard(), getMonthlyRevenue(), getOverdueInvoices()])
      if (m) setMetrics(m)
      if (r) setRevenue(r)
      if (o) setOverdue(o)
      try {
        const [actRes, bkRes] = await Promise.all([
          api.get('/api/reports/recent-activity'),
          api.get('/api/reports/subscription-status-breakdown'),
        ])
        setActivity(actRes.data.data || [])
        setBreakdown(bkRes.data.data || [])
      } catch { /* non-critical */ }
    }
    load()
  }, [getDashboard, getMonthlyRevenue, getOverdueInvoices])

  const stats = [
    { label: 'Active Subscriptions', value: metrics?.active_subscriptions ?? '--', icon: ZapIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Monthly Revenue', value: metrics ? `₹${Number(metrics.monthly_revenue ?? 0).toLocaleString('en-IN')}` : '--', icon: TrendingUpIcon, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Overdue Invoices', value: metrics?.overdue_invoices ?? '--', icon: FileTextIcon, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Pending Payments', value: metrics?.pending_payments ?? '--', icon: CreditCardIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Expiring (30 days)', value: metrics?.expiring_soon ?? '--', icon: ClockIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Users', value: metrics?.total_users ?? '--', icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Customers', value: metrics?.total_customers ?? '--', icon: BuildingIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  const pieData = breakdown.map(b => ({
    name: b.status.charAt(0).toUpperCase() + b.status.slice(1),
    value: parseInt(b.count),
    fill: PIE_COLORS[b.status] || '#94a3b8',
  }))

  const revenueChartData = revenue.slice(-12).map(r => ({
    month: r.month?.toString().slice(-7) || '',
    revenue: r.revenue || 0,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your subscription business" />

      {/* KPI Cards */}
      {loading && !metrics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
            >
              <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <Card className="border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/subscriptions/new">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                <PlusIcon className="h-3.5 w-3.5" />New Subscription
              </Button>
            </Link>
            <Link href="/products/new">
              <Button size="sm" variant="outline" className="gap-2">
                <PackageIcon className="h-3.5 w-3.5" />New Product
              </Button>
            </Link>
            <Link href="/users/internal">
              <Button size="sm" variant="outline" className="gap-2">
                <UserCheckIcon className="h-3.5 w-3.5" />Add Employee
              </Button>
            </Link>
            <Link href="/reports">
              <Button size="sm" variant="outline" className="gap-2">
                <BarChart3Icon className="h-3.5 w-3.5" />View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="h-4 w-4 text-indigo-600" />
                <CardTitle className="text-base font-semibold text-slate-800">Monthly Revenue</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {revenueChartData.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No revenue data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Status Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ZapIcon className="h-4 w-4 text-indigo-600" />
                <CardTitle className="text-base font-semibold text-slate-800">Subscription Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No subscription data</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Activity + Overdue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {activity.map((item, i) => (
                    <motion.div
                      key={`${item.type}-${item.id}`}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.04 }}
                    >
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        item.type === 'payment' ? 'bg-green-100' : item.type === 'subscription' ? 'bg-indigo-100' : 'bg-amber-100'
                      }`}>
                        {item.type === 'payment' ? <CreditCardIcon className="h-3.5 w-3.5 text-green-600" /> :
                         item.type === 'subscription' ? <ZapIcon className="h-3.5 w-3.5 text-indigo-600" /> :
                         <FileTextIcon className="h-3.5 w-3.5 text-amber-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.description} <span className="text-indigo-600 font-mono text-xs">{item.ref}</span></p>
                        <p className="text-xs text-slate-500">{item.customer_name} · {new Date(item.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Overdue Invoices */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
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
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + i * 0.04 }}
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.invoice_number}</p>
                        <p className="text-xs text-slate-500">{item.customer_name} · {item.days_overdue}d overdue</p>
                      </div>
                      <span className="text-sm font-semibold text-red-600">₹{Number(item.amount ?? 0).toLocaleString('en-IN')}</span>
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
