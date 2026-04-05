'use client'

import { useEffect, useCallback, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInvoices } from '@/hooks/useInvoices'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileTextIcon } from 'lucide-react'
import type { Invoice } from '@/types'

const STATUS_TABS = ['all', 'paid', 'cancelled'] as const
type StatusTab = typeof STATUS_TABS[number]

export default function InvoicesPage() {
  const { invoices, loading, pagination, fetchInvoices } = useInvoices()
  const [activeTab, setActiveTab] = useState<StatusTab>('all')

  const load = useCallback((page = 1) => {
    fetchInvoices({ status: activeTab === 'all' ? undefined : activeTab, page })
  }, [fetchInvoices, activeTab])

  useEffect(() => { load(1) }, [load])

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader title="Invoices" description="View and manage all invoices" />

      {/* Status tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'all' ? 'All' : tab}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Total</TableHead>
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
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                  <FileTextIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">No invoices found</p>
                  <p className="text-sm">Invoices are generated from subscriptions.</p>
                </TableCell>
              </TableRow>
            ) : (
              (invoices as (Invoice & Record<string, unknown>)[]).map((inv, i) => (
                <motion.tr
                  key={inv.id}
                  className="hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <TableCell>
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-indigo-600 hover:underline">
                      {(inv.invoice_number as string)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-700 text-sm">
                    {(inv.customer_name as string) ?? inv.customer?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {new Date(inv.issued_date).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {inv.due_date ? new Date(inv.due_date as string).toLocaleDateString('en-IN') : '—'}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    ₹{Number(inv.grand_total).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} type="invoice" />
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
