'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useProducts } from '@/hooks/useProducts'
import { PageHeader } from '@/components/shared/PageHeader'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PlusIcon, ImageIcon, PackageIcon } from 'lucide-react'
import Image from 'next/image'
import type { Product } from '@/types'

export default function ProductsPage() {
  const { products, loading, pagination, fetchProducts } = useProducts()

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        action={
          <Link href="/products/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <PlusIcon className="h-4 w-4" />New Product
            </Button>
          </Link>
        }
      />

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sales Price</TableHead>
              <TableHead>Cost Price</TableHead>
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
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                  <PackageIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">No products yet</p>
                  <p className="text-sm mb-3">Add your first product to the catalog.</p>
                  <Link href="/products/new">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                      <PlusIcon className="h-3.5 w-3.5" />New Product
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              (products as (Product & Record<string, unknown>)[]).map((product, i) => (
                <motion.tr
                  key={product.id}
                  className="hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <TableCell>
                    {product.image_url ? (
                      <Image
                        src={product.image_url as string}
                        alt={product.name}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-md bg-slate-100 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-slate-300" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/products/${product.id}`} className="font-medium text-indigo-600 hover:underline">
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600 capitalize text-sm">{product.product_type}</TableCell>
                  <TableCell className="text-slate-500 text-sm">{(product.category as string) ?? '—'}</TableCell>
                  <TableCell className="text-slate-800 font-medium">
                    ₹{Number(product.sales_price).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    ₹{Number(product.cost_price).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <ActiveBadge isActive={product.is_active} />
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
        onPageChange={(p) => fetchProducts({ page: p })}
      />
    </motion.div>
  )
}
