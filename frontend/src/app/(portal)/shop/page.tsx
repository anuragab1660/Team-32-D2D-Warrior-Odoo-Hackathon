'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useProducts } from '@/hooks/useProducts'
import { useCartStore } from '@/stores/cart'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ShoppingCartIcon, SearchIcon, PackageIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/types'

export default function ShopPage() {
  const { products, loading, fetchProducts } = useProducts()
  const addItem = useCartStore(s => s.addItem)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchProducts({ is_active: true })
  }, [fetchProducts])

  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
    : products

  const handleAddToCart = (product: Product) => {
    addItem({
      product_id: product.id,
      quantity: 1,
      product_name: product.name,
      unit_price: product.sales_price,
    })
    toast.success(`${product.name} added to cart`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shop</h1>
        <p className="text-slate-500 mt-1">Browse and subscribe to our products</p>
      </div>

      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search products..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <PackageIcon className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => (
            <Card key={product.id} className="border-slate-200 hover:shadow-md transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Badge variant="outline" className="text-xs capitalize mb-2">{product.product_type}</Badge>
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      <Link href={`/shop/${product.id}`}>{product.name}</Link>
                    </h3>
                    {product.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <p className="text-xl font-bold text-slate-900">₹{product.sales_price.toLocaleString()}</p>
                    {(product.variants_count ?? 0) > 0 && (
                      <p className="text-xs text-slate-400">{product.variants_count} variant{(product.variants_count ?? 0) > 1 ? 's' : ''}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <ShoppingCartIcon className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
