'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useProducts } from '@/hooks/useProducts'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { PlusIcon, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import type { ColumnDef } from '@tanstack/react-table'
import type { Product } from '@/types'

const columns: ColumnDef<Product, unknown>[] = [
  {
    id: 'image',
    header: '',
    cell: ({ row }) => row.original.image_url ? (
      <Image src={row.original.image_url} alt={row.original.name} width={36} height={36} className="h-9 w-9 rounded-xl object-cover" />
    ) : (
      <div
        className="h-9 w-9 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--surface-container-low)' }}
      >
        <ImageIcon className="h-4 w-4" style={{ color: 'var(--on-surface-muted)' }} />
      </div>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link
        href={`/products/${row.original.id}`}
        className="font-semibold hover:opacity-70 transition-opacity"
        style={{ fontFamily: 'Inter, sans-serif', color: '#274e82' }}
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'product_type',
    header: 'Type',
    cell: ({ row }) => (
      <span className="capitalize" style={{ color: 'var(--on-surface-variant)' }}>
        {row.original.product_type}
      </span>
    ),
  },
  {
    accessorKey: 'sales_price',
    header: 'Sales Price',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>
        ₹{row.original.sales_price.toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: 'cost_price',
    header: 'Cost Price',
    cell: ({ row }) => `₹${row.original.cost_price.toLocaleString()}`,
  },
  {
    accessorKey: 'variants_count',
    header: 'Variants',
    cell: ({ row }) => row.original.variants_count ?? 0,
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => <ActiveBadge isActive={row.original.is_active} />,
  },
]

export default function ProductsPage() {
  const { products, loading, pagination, fetchProducts } = useProducts()

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        action={
          <Link href="/products/new">
            <button className="btn-gradient flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              New Product
            </button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        emptyTitle="No products yet"
        emptyDescription="Add your first product to the catalog."
      />
      <PaginationControls
        page={pagination.page}
        totalPages={pagination.pages}
        onPageChange={(p) => fetchProducts({ page: p })}
      />
    </div>
  )
}
