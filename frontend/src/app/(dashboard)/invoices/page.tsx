'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useInvoices } from '@/hooks/useInvoices'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaginationControls } from '@/components/shared/PaginationControls'
import type { ColumnDef } from '@tanstack/react-table'
import type { Invoice } from '@/types'

const columns: ColumnDef<Invoice, unknown>[] = [
  {
    accessorKey: 'invoice_number',
    header: 'Invoice #',
    cell: ({ row }) => (
      <Link href={`/invoices/${row.original.id}`} className="font-medium text-indigo-600 hover:underline">
        {row.original.invoice_number}
      </Link>
    ),
  },
  {
    accessorKey: 'customer_name',
    header: 'Customer',
    cell: ({ row }) => (row.original as Record<string, string>).customer_name ?? row.original.customer?.name ?? row.original.customer_id,
  },
  {
    accessorKey: 'issued_date',
    header: 'Issued',
    cell: ({ row }) => new Date(row.original.issued_date).toLocaleDateString(),
  },
  {
    accessorKey: 'due_date',
    header: 'Due',
    cell: ({ row }) => row.original.due_date ? new Date(row.original.due_date).toLocaleDateString() : '—',
  },
  {
    accessorKey: 'grand_total',
    header: 'Total',
    cell: ({ row }) => `₹${row.original.grand_total.toLocaleString()}`,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} type="invoice" />,
  },
]

export default function InvoicesPage() {
  const { invoices, loading, pagination, fetchInvoices } = useInvoices()

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="View and manage all invoices" />
      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        emptyTitle="No invoices found"
        emptyDescription="Invoices are generated from subscriptions."
      />
      <PaginationControls
        page={pagination.page}
        totalPages={pagination.pages}
        onPageChange={(p) => fetchInvoices({ page: p })}
      />
    </div>
  )
}
