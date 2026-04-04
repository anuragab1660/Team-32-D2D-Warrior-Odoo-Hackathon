'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  ZapIcon, FileTextIcon, CreditCardIcon, TrendingUpIcon,
  BuildingIcon, ClipboardListIcon, BarChart3Icon, ReceiptIcon, PenLineIcon,
} from 'lucide-react'
import type { DashboardMetrics, MonthlyRevenue } from '@/types'

interface ActivityItem {
  type: string
  id: string
  ref: string
  customer_name: string
  created_at: string
  description: string
}

export default function InternalDashboardPage() {
  const { user } = useAuthStore()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, rRes, aRes] = await Promise.all([
          api.get('/api/reports/dashboard'),
          api.get('/api/reports/monthly-revenue'),
          api.get('/api/reports/recent-activity'),
        ])
        setMetrics(mRes.data.data)
        setRevenue(rRes.data.data || [])
        setActivity(aRes.data.data || [])
      } catch {
        // non-critical
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const stats = [
    { label: 'Active Subscriptions', value: metrics?.active_subscriptions ?? '--', icon: ZapIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Monthly Revenue', value: metrics ? `₹${Number(metrics.monthly_revenue ?? 0).toLocaleString('en-IN')}` : '--', icon: TrendingUpIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Overdue Invoices', value: metrics?.overdue_invoices ?? '--', icon: FileTextIcon, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total Customers', value: metrics?.total_customers ?? '--', icon: BuildingIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Pending Payments', value: metrics?.pending_payments ?? '--', icon: CreditCardIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  const revenueChartData = revenue.slice(-12).map(r => ({
    month: r.month?.toString().slice(-7) || '',
    revenue: r.revenue || 0,
  }))

  const quickLinks = [
    { label: 'Customer Orders', href: '/internal/orders', icon: ClipboardListIcon, color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'Reports', href: '/internal/reports', icon: BarChart3Icon, color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Taxes', href: '/internal/taxes', icon: ReceiptIcon, color: 'bg-amber-600 hover:bg-amber-700' },
    { label: 'Content', href: '/internal/content', icon: PenLineIcon, color: 'bg-purple-600 hover:bg-purple-700' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] ?? 'there'}`}
        description="Internal staff portal — manage content, view orders, taxes and reports"
      />

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
            >
              <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <Card className="border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-slate-500 leading-tight">{stat.label}</p>
                      <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
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

      {/* Quick Links */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {quickLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <Button size="sm" className={`${link.color} text-white gap-2`}>
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Revenue Chart + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="h-4 w-4 text-emerald-600" />
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
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
                </div>
              ) : activity.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {activity.slice(0, 8).map((item, i) => (
                    <motion.div
                      key={`${item.type}-${item.id}`}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.04 }}
                    >
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        item.type === 'payment' ? 'bg-green-100' : item.type === 'subscription' ? 'bg-emerald-100' : 'bg-amber-100'
                      }`}>
                        {item.type === 'payment'
                          ? <CreditCardIcon className="h-3.5 w-3.5 text-green-600" />
                          : item.type === 'subscription'
                          ? <ZapIcon className="h-3.5 w-3.5 text-emerald-600" />
                          : <FileTextIcon className="h-3.5 w-3.5 text-amber-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {item.description}{' '}
                          <span className="text-emerald-600 font-mono text-xs">{item.ref}</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.customer_name} · {new Date(item.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
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
