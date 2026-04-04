'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useCartStore } from '@/stores/cart'
import { usePlans } from '@/hooks/usePlans'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { Product, ProductVariant, RecurringPlan } from '@/types'
import { ArrowLeftIcon, LoaderIcon, ShoppingCartIcon } from 'lucide-react'
import { toast } from 'sonner'

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
    const plan = plans.find(p => p.id === selectedPlan)
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
        <LoaderIcon className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!product) return null

  const selectedVariantObj = variants.find(v => v.id === selectedVariant)
  const totalPrice = (product.sales_price + (selectedVariantObj?.extra_price ?? 0)) * quantity

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeftIcon className="h-4 w-4" />Back to shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Badge variant="outline" className="capitalize mb-3">{product.product_type}</Badge>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{product.name}</h1>
          {product.description && (
            <p className="text-slate-500 text-sm mb-4">{product.description}</p>
          )}
          <p className="text-3xl font-bold text-indigo-700">₹{product.sales_price.toLocaleString()}</p>
          {selectedVariantObj && (
            <p className="text-sm text-slate-500 mt-1">+₹{selectedVariantObj.extra_price} for this variant</p>
          )}
        </div>

        <Card className="border-slate-200">
          <CardContent className="p-5 space-y-4">
            {variants.length > 0 && (
              <div className="space-y-2">
                <Label>Select Variant</Label>
                <Select value={selectedVariant || '__none__'} onValueChange={v => setSelectedVariant(v === '__none__' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Choose variant" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No variant</SelectItem>
                    {variants.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.attribute}: {v.value} {v.extra_price > 0 ? `(+₹${v.extra_price})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {plans.length > 0 && (
              <div className="space-y-2">
                <Label>Billing Plan (optional)</Label>
                <Select value={selectedPlan || '__none__'} onValueChange={v => setSelectedPlan(v === '__none__' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="One-time purchase" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">One-time purchase</SelectItem>
                    {plans.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} — ₹{p.price}/{p.billing_period}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-8 w-8 p-0">-</Button>
                <span className="text-sm font-medium w-8 text-center">{quantity}</span>
                <Button variant="outline" size="sm" onClick={() => setQuantity(q => q + 1)} className="h-8 w-8 p-0">+</Button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-500">Total</span>
                <span className="text-lg font-bold text-slate-900">₹{totalPrice.toLocaleString()}</span>
              </div>
              <Button onClick={handleAddToCart} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
                <ShoppingCartIcon className="h-4 w-4" />Add to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
