'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useReports } from '@/hooks/useReports'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import type { MonthlyRevenue, OverdueInvoice } from '@/types'
import {
  BarChart3Icon, TrendingUpIcon, AlertCircleIcon, ZapIcon, PackageIcon, DownloadIcon, CheckCircleIcon,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import api from '@/lib/api'

interface StatusBreakdown { status: string; count: string }
interface TopProduct { product_name: string; total_revenue: number }
interface InvoiceSummaryRow { status: string; count: number; total: number }

const PIE_COLORS: Record<string, string> = {
  active: '#6366f1',
  paused: '#f59e0b',
  cancelled: '#ef4444',
  expired: '#94a3b8',
  quotation: '#06b6d4',
  confirmed: '#10b981',
  closed: '#64748b',
}

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const { getMonthlyRevenue, getOverdueInvoices, getInvoiceSummary, loading } = useReports()
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([])
  const [overdue, setOverdue] = useState<OverdueInvoice[]>([])
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummaryRow[]>([])
  const [breakdown, setBreakdown] = useState<StatusBreakdown[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])

  useEffect(() => {
    const load = async () => {
      const [r, o, i] = await Promise.all([
        getMonthlyRevenue(),
        getOverdueInvoices(),
        getInvoiceSummary(),
      ])
      if (r) setRevenue(r)
      if (o) setOverdue(o)
      if (i) setInvoiceSummary(Array.isArray(i) ? i as InvoiceSummaryRow[] : [])
      try {
        const [bkRes, tpRes] = await Promise.all([
          api.get('/api/reports/subscription-status-breakdown'),
          api.get('/api/reports/top-products'),
        ])
        setBreakdown(bkRes.data.data || [])
        setTopProducts(tpRes.data.data || [])
      } catch { /* non-critical */ }
    }
    load()
  }, [getMonthlyRevenue, getOverdueInvoices, getInvoiceSummary])

  const totalRevenue = revenue.reduce((sum, r) => sum + Number(r.revenue || 0), 0)
  const pieData = breakdown.map(b => ({
    name: b.status.charAt(0).toUpperCase() + b.status.slice(1),
    value: parseInt(b.count),
    fill: PIE_COLORS[b.status] || '#94a3b8',
  }))
  const revenueChartData = revenue.map(r => ({
    month: r.month?.toString() || '',
    revenue: Number(r.revenue || 0),
  }))

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader title="Reports" description="Business analytics and insights" />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue (All Time)', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: TrendingUpIcon, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Active Subscriptions', value: breakdown.find(b => b.status === 'active')?.count ?? '0', icon: ZapIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Paid Invoices', value: invoiceSummary.find(r => r.status === 'paid')?.count ?? '0', icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Overdue Invoices', value: overdue.length, icon: AlertCircleIcon, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{loading ? '—' : stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3Icon className="h-4 w-4 text-indigo-600" />
                  <CardTitle className="text-base font-semibold text-slate-800">Monthly Revenue</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-slate-500"
                  onClick={() => downloadCSV(revenueChartData as unknown as Record<string, unknown>[], 'monthly-revenue.csv')}
                >
                  <DownloadIcon className="h-3.5 w-3.5" />CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : revenueChartData.length === 0 ? (
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ZapIcon className="h-4 w-4 text-indigo-600" />
                  <CardTitle className="text-base font-semibold text-slate-800">Subscription Status</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-slate-500"
                  onClick={() => downloadCSV(breakdown as unknown as Record<string, unknown>[], 'subscription-status.csv')}
                >
                  <DownloadIcon className="h-3.5 w-3.5" />CSV
                </Button>
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

      {/* Invoice Summary + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Summary Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-base font-semibold text-slate-800">Invoice Summary</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-slate-500"
                  onClick={() => downloadCSV(invoiceSummary as unknown as Record<string, unknown>[], 'invoice-summary.csv')}
                >
                  <DownloadIcon className="h-3.5 w-3.5" />CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoiceSummary.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No invoice data</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Status</th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2 w-16">Count</th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2 w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceSummary.map(row => (
                      <tr key={row.status} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 capitalize">{row.status}</td>
                        <td className="py-2 text-right text-slate-600">{row.count}</td>
                        <td className="py-2 text-right font-medium text-slate-800">₹{Number(row.total || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Products */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackageIcon className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-base font-semibold text-slate-800">Top Products by Revenue</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-slate-500"
                  onClick={() => downloadCSV(topProducts as unknown as Record<string, unknown>[], 'top-products.csv')}
                >
                  <DownloadIcon className="h-3.5 w-3.5" />CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No product revenue data</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.slice(0, 5).map((p, i) => {
                    const maxRev = topProducts[0]?.total_revenue || 1
                    const pct = Math.round((p.total_revenue / maxRev) * 100)
                    return (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-700 font-medium truncate max-w-[180px]">{p.product_name}</span>
                          <span className="text-sm font-semibold text-indigo-700">₹{Number(p.total_revenue).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-1.5 bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Overdue Invoices Table */}
      {overdue.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="h-4 w-4 text-red-500" />
                  <CardTitle className="text-base font-semibold text-slate-800">Overdue Invoices</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-slate-500"
                  onClick={() => downloadCSV(overdue as unknown as Record<string, unknown>[], 'overdue-invoices.csv')}
                >
                  <DownloadIcon className="h-3.5 w-3.5" />CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Invoice #</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Customer</th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Days Overdue</th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdue.map((item, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 font-medium text-slate-800">{item.invoice_number}</td>
                        <td className="py-2 text-slate-600">{item.customer_name}</td>
                        <td className="py-2 text-right text-red-600 font-medium">{item.days_overdue}d</td>
                        <td className="py-2 text-right font-bold text-red-700">₹{Number(item.amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
