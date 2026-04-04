'use client'

import { useEffect } from 'react'
import { usePayments } from '@/hooks/usePayments'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaginationControls } from '@/components/shared/PaginationControls'
import type { ColumnDef } from '@tanstack/react-table'
import type { Payment } from '@/types'

const columns: ColumnDef<Payment, unknown>[] = [
  {
    accessorKey: 'id',
    header: 'Payment ID',
    cell: ({ row }) => (
      <span
        className="font-mono text-xs"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        {row.original.id.slice(0, 8)}...
      </span>
    ),
  },
  {
    accessorKey: 'invoice_number',
    header: 'Invoice',
    cell: ({ row }) => (row.original as Record<string, string>).invoice_number ?? row.original.invoice?.invoice_number ?? row.original.invoice_id,
  },
  {
    accessorKey: 'customer_name',
    header: 'Customer',
    cell: ({ row }) => (row.original as Record<string, string>).customer_name ?? row.original.customer?.name ?? row.original.customer_id,
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>
        ₹{row.original.amount.toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: 'payment_method',
    header: 'Method',
    cell: ({ row }) => <span className="capitalize">{row.original.payment_method.replace('_', ' ')}</span>,
  },
  {
    accessorKey: 'payment_date',
    header: 'Date',
    cell: ({ row }) => new Date(row.original.payment_date).toLocaleDateString(),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} type="payment" />,
  },
]

export default function PaymentsPage() {
  const { payments, loading, pagination, fetchPayments } = usePayments()

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Track all payment transactions" />
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        emptyTitle="No payments found"
        emptyDescription="Payments will appear here once invoices are paid."
      />
      <PaginationControls
        page={pagination.page}
        totalPages={pagination.pages}
        onPageChange={(p) => fetchPayments({ page: p })}
      />
    </div>
  )
}
