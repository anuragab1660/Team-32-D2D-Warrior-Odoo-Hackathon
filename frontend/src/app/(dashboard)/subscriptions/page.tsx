'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PlusIcon, SearchIcon, ZapIcon } from 'lucide-react'
import type { Subscription } from '@/types'

const STATUS_TABS = ['all', 'active', 'paused', 'cancelled', 'expired', 'quotation', 'confirmed'] as const
type StatusTab = typeof STATUS_TABS[number]

export default function SubscriptionsPage() {
  const { subscriptions, loading, pagination, fetchSubscriptions } = useSubscriptions()
  const [activeTab, setActiveTab] = useState<StatusTab>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback((page = 1) => {
    fetchSubscriptions({
      status: activeTab === 'all' ? undefined : activeTab,
      customer: debouncedSearch || undefined,
      page,
    })
  }, [fetchSubscriptions, activeTab, debouncedSearch])

  useEffect(() => { load(1) }, [load])

  const tabLabel = (s: StatusTab) => s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Subscriptions"
        description="Manage all customer subscriptions"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 rounded-lg p-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>

        {/* Search */}
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
              <TableHead>Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Renewal Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                  <ZapIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">No subscriptions found</p>
                  <p className="text-sm mb-3">No subscriptions found.</p>
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub: Subscription & Record<string, unknown>, i) => (
                <motion.tr
                  key={sub.id}
                  className="hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <TableCell>
                    <Link href={`/subscriptions/${sub.id}`} className="font-medium text-indigo-600 hover:underline">
                      {sub.subscription_number}
                    </Link>
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
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        page={pagination.page}
        totalPages={pagination.pages}
        onPageChange={(p) => load(p)}
      />
    </motion.div>
  )
}
