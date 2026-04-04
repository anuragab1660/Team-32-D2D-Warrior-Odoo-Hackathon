'use client'

import { useEffect, useState } from 'react'
import { useReports } from '@/hooks/useReports'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Business analytics and insights" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Total Revenue (All Time)</p>
              <TrendingUpIcon className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">₹{totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Active Subscriptions</p>
              <ZapIcon className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{activeSubs.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Overdue Invoices</p>
              <AlertCircleIcon className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{overdue.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3Icon className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-base">Monthly Revenue</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}
              </div>
            ) : revenue.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No revenue data available</p>
            ) : (
              <div className="space-y-3">
                {revenue.slice(-12).map(item => (
                  <div key={item.month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600">{item.month}</span>
                      <span className="text-sm font-semibold text-slate-900">₹{(item.revenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-indigo-500 rounded-full"
                        style={{ width: `${((item.revenue || 0) / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircleIcon className="h-4 w-4 text-red-500" />
              <CardTitle className="text-base">Overdue Invoices</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {overdue.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No overdue invoices</p>
            ) : (
              <div className="space-y-3">
                {overdue.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.invoice_number}</p>
                      <p className="text-xs text-slate-500">{item.customer_name} · {item.days_overdue} days overdue</p>
                    </div>
                    <span className="text-sm font-bold text-red-600">₹{(item.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {invoiceSummary.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Invoice Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Status</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Count</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoiceSummary as Array<{ status: string; count: number; total: number }>).map(row => (
                    <tr key={row.status} className="border-b border-slate-100">
                      <td className="py-2 capitalize">{row.status}</td>
                      <td className="py-2 text-right">{row.count}</td>
                      <td className="py-2 text-right font-medium">₹{(row.total || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
