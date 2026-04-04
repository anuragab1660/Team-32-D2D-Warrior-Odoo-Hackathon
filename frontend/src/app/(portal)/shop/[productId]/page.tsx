'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useCartStore } from '@/stores/cart'
import { usePlans } from '@/hooks/usePlans'
import type { Product, ProductVariant } from '@/types'
import { ArrowLeftIcon, LoaderIcon, ShoppingCartIcon } from 'lucide-react'
import { toast } from 'sonner'
import { PageHero } from '@/components/shared/PageHero'

const fieldLabel = (text: string) => (
  <span
    className="text-xs font-semibold uppercase tracking-wider"
    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
  >
    {text}
  </span>
)

export default function ProductDetailPortalPage() {
  const { productId } = useParams<{ productId: string }>()
  const router = useRouter()
  const addItem = useCartStore(s => s.addItem)
  const { plans, fetchPlans } = usePlans()
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: productData }, { data: variantData }] = await Promise.all([
          api.get(`/api/products/${productId}`),
          api.get(`/api/products/${productId}/variants`),
        ])
        setProduct(productData.data)
        setVariants(variantData.data || [])
        fetchPlans(true)
      } catch {
        toast.error('Product not found')
        router.push('/shop')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [productId, router, fetchPlans])

  const handleAddToCart = () => {
    if (!product) return
    const variant = variants.find(v => v.id === selectedVariant)
    const basePrice = product.sales_price + (variant?.extra_price ?? 0)

    addItem({
      product_id: product.id,
      variant_id: selectedVariant || undefined,
      plan_id: selectedPlan || undefined,
      quantity,
      product_name: product.name,
      variant_name: variant ? `${variant.attribute}: ${variant.value}` : undefined,
      unit_price: basePrice,
    })
    toast.success(`${product.name} added to cart`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoaderIcon className="h-8 w-8 animate-spin" style={{ color: '#274e82' }} />
      </div>
    )
  }

  if (!product) return null

  const selectedVariantObj = variants.find(v => v.id === selectedVariant)
  const totalPrice = (product.sales_price + (selectedVariantObj?.extra_price ?? 0)) * quantity

  return (
    <div className="max-w-3xl space-y-6 mx-auto">
      <PageHero
        eyebrow="Product details"
        title={product.name}
        description="Choose a variant, plan, and quantity before adding the item to your cart."
        action={
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: '#17457d', fontFamily: 'Inter, sans-serif' }}
          >
            <ArrowLeftIcon className="h-4 w-4" />Back to shop
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product info */}
        <div>
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
          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}
          >
            {product.name}
          </h1>
          {product.description && (
            <p
              className="text-sm mb-4"
              style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
            >
              {product.description}
            </p>
          )}
          <p
            className="text-3xl font-bold"
            style={{ fontFamily: 'Manrope, sans-serif', color: '#063669', letterSpacing: '-0.03em' }}
          >
            ₹{product.sales_price.toLocaleString()}
          </p>
          {selectedVariantObj && (
            <p
              className="text-sm mt-1"
              style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
            >
              +₹{selectedVariantObj.extra_price} for this variant
            </p>
          )}
        </div>

        {/* Add to cart panel */}
        <div className="section-card p-5 space-y-4">
          {variants.length > 0 && (
            <div className="space-y-1.5">
              {fieldLabel('Select Variant')}
              <select
                className="input-soft w-full"
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
              >
                <option value="">No variant</option>
                {variants.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.attribute}: {v.value} {v.extra_price > 0 ? `(+₹${v.extra_price})` : ''}
                  </option>
                ))}
              </select>
>>>>>>> Stashed changes
            </div>
          )}

              </div>
            </div>
          </div>
        )
      }
                    <SelectItem value="__none__">One-time purchase</SelectItem>
