'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useProducts } from '@/hooks/useProducts'
import { useCartStore } from '@/stores/cart'
import { ShoppingCartIcon, SearchIcon, PackageIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/types'
import { PageHero } from '@/components/shared/PageHero'

export default function ShopPage() {
  const { products, loading, fetchProducts } = useProducts()
  const addItem = useCartStore(s => s.addItem)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchProducts({ is_active: true })
  }, [fetchProducts])

  const filtered = search
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      )
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHero
        eyebrow="Portal shop"
        title="Browse products"
        description="Search the catalog, review product details, and add subscription-ready items to your cart."
      >
        <div className="relative max-w-xl">
          <SearchIcon
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: 'var(--on-surface-muted)' }}
          />
          <input
            placeholder="Search products..."
            className="input-soft w-full pl-11"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </PageHero>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-2xl animate-pulse"
              style={{ background: 'var(--surface-container-low)' }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--surface-container-low)' }}
          >
            <PackageIcon className="h-6 w-6" style={{ color: 'var(--on-surface-muted)' }} />
          </div>
          <p className="text-base font-semibold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
            No products found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => (
            <div
              key={product.id}
              className="section-card p-5 flex flex-col justify-between group hover:shadow-[0_26px_65px_-40px_rgba(6,54,105,0.45)] transition-shadow"
            >
              <div className="flex-1">
                <span
                  className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg capitalize mb-3"
                  style={{
                    background: 'var(--surface-container-low)',
                    color: 'var(--on-surface-variant)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {product.product_type}
                </span>
                <h3
                  className="font-bold mb-1 group-hover:opacity-70 transition-opacity"
                  style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
                >
                  <Link href={`/shop/${product.id}`}>{product.name}</Link>
                </h3>
                {product.description && (
                  <p
                    className="text-sm mt-1 line-clamp-2"
                    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
                  >
                    {product.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between mt-5">
                <div>
                  <p
                    className="text-xl font-bold"
                    style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}
                  >
                    ₹{product.sales_price.toLocaleString()}
                  </p>
                  {(product.variants_count ?? 0) > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>
                      {product.variants_count} variant{(product.variants_count ?? 0) > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="btn-gradient flex items-center gap-2 text-sm"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <ShoppingCartIcon className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
