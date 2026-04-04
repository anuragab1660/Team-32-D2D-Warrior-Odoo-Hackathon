'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchIcon, ZapIcon, XIcon, CalendarIcon, UserIcon, PackageIcon } from 'lucide-react'
import api from '@/lib/api'
import type { Subscription } from '@/types'

const STATUS_TABS = ['all', 'active', 'paused', 'cancelled', 'expired', 'quotation', 'confirmed'] as const
type StatusTab = typeof STATUS_TABS[number]

export default function InternalOrdersPage() {
  const [subscriptions, setSubscriptions] = useState<(Subscription & Record<string, unknown>)[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<StatusTab>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<(Subscription & Record<string, unknown>) | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(p), limit: '15' }
      if (activeTab !== 'all') params.status = activeTab
      if (debouncedSearch) params.customer = debouncedSearch
      const { data } = await api.get('/api/subscriptions', { params })
      setSubscriptions(data.data || [])
      setTotalPages(data.pagination?.pages ?? 1)
      setPage(p)
    } catch {
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, debouncedSearch])

  useEffect(() => { load(1) }, [load])

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader title="Customer Orders" description="View all customer subscriptions and orders (read-only)" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex flex-wrap gap-1 bg-slate-100 rounded-lg p-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search by customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                  <ZapIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">No orders found</p>
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub, i) => (
                <motion.tr
                  key={sub.id}
                  className="hover:bg-slate-50 border-b border-slate-100 last:border-0 cursor-pointer"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(sub)}
                >
                  <TableCell>
                    <span className="font-medium text-emerald-600">{sub.subscription_number}</span>
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {(sub.customer_name as string) ?? sub.customer?.name ?? sub.customer_id}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {(sub.plan_name as string) ?? sub.plan?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {new Date(sub.start_date).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {sub.expiration_date
                      ? new Date(sub.expiration_date as string).toLocaleDateString('en-IN')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sub.status} type="subscription" />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600">
                      View
                    </Button>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>Previous</Button>
          <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next</Button>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg font-bold text-slate-900">
                    {selected.subscription_number}
                  </SheetTitle>
                  <StatusBadge status={selected.status} type="subscription" />
                </div>
              </SheetHeader>

              <div className="space-y-5">
                {/* Customer */}
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <UserIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Customer</p>
                    <p className="font-semibold text-slate-900">
                      {(selected.customer_name as string) ?? selected.customer?.name ?? '—'}
                    </p>
                    {(selected.customer_email as string) && (
                      <p className="text-sm text-slate-500">{selected.customer_email as string}</p>
                    )}
                  </div>
                </div>

                {/* Plan */}
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <ZapIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Plan</p>
                    <p className="font-semibold text-slate-900">
                      {(selected.plan_name as string) ?? selected.plan?.name ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 mb-0.5">Dates</p>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Start:</span>{' '}
                      {new Date(selected.start_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                    </p>
                    {selected.expiration_date && (
                      <p className="text-sm text-slate-700">
                        <span className="font-medium">Expiry:</span>{' '}
                        {new Date(selected.expiration_date as string).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lines */}
                {Array.isArray(selected.lines) && selected.lines.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <PackageIcon className="h-4 w-4 text-slate-400" />
                      <p className="text-sm font-semibold text-slate-700">Order Items</p>
                    </div>
                    <div className="space-y-2">
                      {(selected.lines as Record<string, unknown>[]).map((line, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {(line.product as Record<string, unknown>)?.name as string ?? `Item ${i + 1}`}
                            </p>
                            <p className="text-xs text-slate-500">Qty: {line.quantity as number}</p>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            ₹{Number(line.total_amount ?? 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selected.notes && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-xs text-amber-600 font-medium mb-1">Notes</p>
                    <p className="text-sm text-slate-700">{selected.notes as string}</p>
                  </div>
                )}

                <div className="pt-2">
                  <Badge variant="outline" className="text-xs text-slate-500">
                    Created {new Date(selected.created_at).toLocaleDateString('en-IN')}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  )
}
