'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useProducts } from '@/hooks/useProducts'
import { useCartStore } from '@/stores/cart'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShoppingCartIcon, SearchIcon, PackageIcon, CheckIcon, MinusIcon, PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { Product, ProductType } from '@/types'

/**
 * @module portal/shop
 * @api-calls GET /api/products?is_active=true
 * @depends-on useProducts, useCartStore
 * @role portal
 * @emits none
 * RUFLOW_REVIEW: shop page - product grid with filters, sort, cart integration
 */

const TYPE_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Service', value: 'service' },
  { label: 'Physical', value: 'physical' },
  { label: 'Digital', value: 'digital' },
  { label: 'Other', value: 'other' },
]

const COLORS = ['bg-indigo-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']

function colorForProduct(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

export default function ShopPage() {
  /**
   * @module portal/shop
   * @api-calls GET /api/products?is_active=true
   * @depends-on useProducts, useCartStore
   * @role portal
   * @emits none
   * RUFLOW_REVIEW: shop page - product grid with filters, sort, cart integration
   */
  const { products, loading, fetchProducts } = useProducts()
  const { items, addItem, updateQuantity, billing_period } = useCartStore()
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    fetchProducts({ is_active: true })
  }, [fetchProducts])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const getCartItem = useCallback((product: Product) => {
    return items.find(i => i.product_id === product.id && !i.variant_id)
  }, [items])

  const filtered = products
    .filter(p => typeFilter === 'all' || p.product_type === (typeFilter as ProductType))
    .filter(p =>
      !searchDebounced ||
      p.name.toLowerCase().includes(searchDebounced.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchDebounced.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'price_asc') return a.sales_price - b.sales_price
      if (sort === 'price_desc') return b.sales_price - a.sales_price
      if (sort === 'name_az') return a.name.localeCompare(b.name)
      // newest: default order (by created_at desc)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const handleAddToCart = (product: Product) => {
    const monthlyPrice = product.sales_price
    const yearlyPrice = product.yearly_price
    const unitPrice = billing_period === 'yearly' && yearlyPrice
      ? yearlyPrice
      : monthlyPrice
    addItem({
      product_id: product.id,
      quantity: 1,
      product_name: product.name,
      unit_price: unitPrice,
      monthly_price: monthlyPrice,
      yearly_price: yearlyPrice,
    })
    toast.success(`${product.name} added to cart`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shop</h1>
        <p className="text-slate-500 mt-1">Browse and subscribe to our services</p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="name_az">Name A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              typeFilter === f.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {f.label}
          </button>
        ))}
        {!loading && <span className="text-sm text-slate-400 self-center ml-2">Showing {filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <PackageIcon className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-600 mb-1">No products found</h3>
          <p className="text-sm text-slate-400">No products match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product, index) => {
            const cartItem = getCartItem(product)
            const isInCart = !!cartItem

            return (
              <motion.div
                key={product.id}
                custom={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border-slate-200 hover:shadow-md transition-shadow group h-full flex flex-col">
                  {/* Image */}
                  <div className="relative h-36 rounded-t-xl overflow-hidden">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className={`h-full w-full flex items-center justify-center ${colorForProduct(product.id)}`}>
                        <span className="text-4xl font-bold text-white/80">{product.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <Badge className="absolute top-2 left-2 capitalize bg-white/90 text-slate-700 border-slate-200 shadow-sm text-xs">
                      {product.product_type}
                    </Badge>
                    {isInCart && (
                      <Badge className="absolute top-2 right-2 bg-green-500 text-white text-xs">In Cart ✓</Badge>
                    )}
                  </div>

                  <CardContent className="p-4 flex flex-col flex-1">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="text-xl font-bold text-indigo-700">
                            ₹{product.sales_price.toLocaleString('en-IN')}
                            <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>
                          </p>
                          {product.yearly_price && (
                            <p className="text-xs text-emerald-600 font-medium">
                              ₹{product.yearly_price.toLocaleString('en-IN')}/yr
                              <span className="ml-1 text-slate-400">· save {Math.round(100 - (product.yearly_price / (product.sales_price * 12)) * 100)}%</span>
                            </p>
                          )}
                        </div>
                        {(product.variants_count ?? 0) > 0 && (
                          <Badge variant="outline" className="text-xs">{product.variants_count} variant{(product.variants_count ?? 0) > 1 ? 's' : ''}</Badge>
                        )}
                      </div>

                      {isInCart ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline" size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                          ><MinusIcon className="h-3 w-3" /></Button>
                          <span className="text-sm font-semibold w-6 text-center text-indigo-700">{cartItem.quantity}</span>
                          <Button
                            variant="outline" size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                          ><PlusIcon className="h-3 w-3" /></Button>
                          <Badge className="bg-green-100 text-green-700 border-green-200 ml-auto flex items-center gap-1 text-xs">
                            <CheckIcon className="h-3 w-3" />Added
                          </Badge>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 mt-2"
                        >
                          <ShoppingCartIcon className="h-3.5 w-3.5" />Add to Cart
                        </Button>
                      )}
                      <Link href={`/shop/${product.id}`} className="block text-center text-xs text-slate-400 hover:text-indigo-600 mt-2">
                        View Details →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
