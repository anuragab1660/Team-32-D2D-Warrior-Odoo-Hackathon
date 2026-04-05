'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePayments } from '@/hooks/usePayments'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CopyIcon, CreditCardIcon } from 'lucide-react'
import { toast } from 'sonner'

export default function PaymentsPage() {
  const { payments, loading, pagination, fetchPayments } = usePayments()

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!')).catch(() => {})
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Payments"
        description="Track all payment transactions"
      />

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Payment ID</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
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
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                  <CreditCardIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">No payments found</p>
                  <p className="text-sm">Payments will appear here once invoices are paid.</p>
                </TableCell>
              </TableRow>
            ) : (
              (payments as (typeof payments[0] & Record<string, unknown>)[]).map((pay, i) => (
                <motion.tr
                  key={pay.id}
                  className="hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="text-xs font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        {pay.id.slice(0, 12)}...
                      </code>
                      <button
                        onClick={() => copyToClipboard(pay.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Copy full ID"
                      >
                        <CopyIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {pay.invoice_id ? (
                      <Link
                        href={`/invoices/${pay.invoice_id as string}`}
                        className="text-indigo-600 hover:underline text-sm font-medium"
                      >
                        {(pay.invoice_number as string) ?? pay.invoice?.invoice_number ?? '—'}
                      </Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-slate-700 text-sm">
                    {(pay.customer_name as string) ?? pay.customer?.name ?? '—'}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    ₹{Number(pay.amount).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm capitalize">
                    {pay.payment_method.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {new Date(pay.payment_date).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={pay.status} type="payment" />
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
        onPageChange={(p) => fetchPayments({ page: p })}
      />
    </motion.div>
  )
}
