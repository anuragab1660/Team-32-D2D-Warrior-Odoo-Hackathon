'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  TrendingUpIcon, ZapIcon, FileTextIcon, PackageIcon,
} from 'lucide-react'
import type { MonthlyRevenue, OverdueInvoice, DashboardMetrics } from '@/types'

interface StatusBreakdown { status: string; count: string }
interface TopProduct { id: string; name: string; total_revenue: number; invoice_count: number }

const PIE_COLORS: Record<string, string> = {
  active: '#10b981', paused: '#f59e0b', cancelled: '#ef4444',
  expired: '#94a3b8', quotation: '#06b6d4', confirmed: '#6366f1', closed: '#64748b',
}

export default function InternalReportsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([])
  const [overdue, setOverdue] = useState<OverdueInvoice[]>([])
  const [breakdown, setBreakdown] = useState<StatusBreakdown[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, rRes, oRes, bRes, pRes] = await Promise.all([
          api.get('/api/reports/dashboard'),
          api.get('/api/reports/monthly-revenue'),
          api.get('/api/reports/overdue-invoices'),
          api.get('/api/reports/subscription-status-breakdown'),
          api.get('/api/reports/top-products'),
        ])
        setMetrics(mRes.data.data)
        setRevenue(rRes.data.data || [])
        setOverdue(oRes.data.data || [])
        setBreakdown(bRes.data.data || [])
        setTopProducts(pRes.data.data || [])
      } catch {
        // non-critical
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const revenueChartData = revenue.slice(-12).map(r => ({
    month: r.month?.toString().slice(-7) || '',
    revenue: Number(r.revenue) || 0,
  }))

  const pieData = breakdown.map(b => ({
    name: b.status.charAt(0).toUpperCase() + b.status.slice(1),
    value: parseInt(b.count),
    fill: PIE_COLORS[b.status] || '#94a3b8',
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Business insights and analytics overview" />

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Subscriptions', value: metrics?.active_subscriptions ?? '--', icon: ZapIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Monthly Revenue', value: metrics ? `₹${Number(metrics.monthly_revenue ?? 0).toLocaleString('en-IN')}` : '--', icon: TrendingUpIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Overdue Invoices', value: metrics?.overdue_invoices ?? '--', icon: FileTextIcon, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Pending Payments', value: metrics?.pending_payments ?? '--', icon: PackageIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="border-slate-200 hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-500 leading-tight">{stat.label}</p>
                    <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-base font-semibold text-slate-800">Monthly Revenue</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {revenueChartData.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenueChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ZapIcon className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-base font-semibold text-slate-800">Subscription Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
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

      {/* Top Products + Overdue Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <PackageIcon className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-base font-semibold text-slate-800">Top Products by Revenue</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
              ) : topProducts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No data available</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.invoice_count} invoices</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-emerald-700">
                        ₹{Number(p.total_revenue ?? 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileTextIcon className="h-4 w-4 text-red-500" />
                <CardTitle className="text-base font-semibold text-slate-800">Overdue Invoices</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
              ) : overdue.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No overdue invoices</p>
              ) : (
                <div className="space-y-2">
                  {overdue.slice(0, 8).map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.invoice_number}</p>
                        <p className="text-xs text-slate-500">
                          {item.customer_name}
                          <Badge variant="destructive" className="ml-2 text-[10px] py-0 h-4">{item.days_overdue}d</Badge>
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-red-600">
                        ₹{Number(item.amount ?? 0).toLocaleString('en-IN')}
                      </p>
                    </div>
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
