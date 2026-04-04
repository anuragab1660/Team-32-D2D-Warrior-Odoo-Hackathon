'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Subscription } from '@/types'

const columns: ColumnDef<Subscription, unknown>[] = [
  {
    accessorKey: 'subscription_number',
    header: 'Number',
    cell: ({ row }) => (
      <Link href={`/subscriptions/${row.original.id}`} className="font-medium text-indigo-600 hover:underline">
        {row.original.subscription_number}
      </Link>
    ),
  },
  {
    accessorKey: 'customer_name',
    header: 'Customer',
    cell: ({ row }) => (row.original as Record<string, string>).customer_name ?? row.original.customer?.name ?? row.original.customer_id,
  },
  {
    accessorKey: 'plan_name',
    header: 'Plan',
    cell: ({ row }) => (row.original as Record<string, string>).plan_name ?? row.original.plan?.name ?? '—',
  },
  {
    accessorKey: 'start_date',
    header: 'Start Date',
    cell: ({ row }) => new Date(row.original.start_date).toLocaleDateString(),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} type="subscription" />,
  },
]

export default function SubscriptionsPage() {
  const { subscriptions, loading, pagination, fetchSubscriptions } = useSubscriptions()

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Manage all customer subscriptions"
        action={
          <Link href="/subscriptions/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <PlusIcon className="h-4 w-4" />
              New Subscription
            </Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={subscriptions}
        loading={loading}
        emptyTitle="No subscriptions yet"
        emptyDescription="Create your first subscription to get started."
      />
      <PaginationControls
        page={pagination.page}
        totalPages={pagination.pages}
        onPageChange={(p) => fetchSubscriptions({ page: p })}
      />
    </div>
  )
}
