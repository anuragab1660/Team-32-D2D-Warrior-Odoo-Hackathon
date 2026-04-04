'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useCartStore } from '@/stores/cart'
import { usePlans } from '@/hooks/usePlans'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { Product, ProductVariant, RecurringPlan, BillingPeriod } from '@/types'
import { ArrowLeftIcon, LoaderIcon, ShoppingCartIcon, ZapIcon, CheckCircleIcon, TagIcon } from 'lucide-react'
import { toast } from 'sonner'
import { getPeriodPrice, getPeriodSavings } from '@/lib/utils'

/**
 * @module portal/shop/[productId]
 * @api-calls GET /api/products/:id, GET /api/products/:id/variants, GET /api/recurring-plans
 * @depends-on useCartStore, usePlans
 * @role portal
 * @emits none
 * RUFLOW_REVIEW: product detail page - variant/plan selection, date calc, add to cart
 */

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function computeEndDate(start: string, bp: BillingPeriod | 'onetime'): Date | null {
  if (bp === 'onetime') return null
  const d = new Date(start)
  if (bp === 'daily')   d.setDate(d.getDate() + 1)
  if (bp === 'weekly')  d.setDate(d.getDate() + 7)
  if (bp === 'monthly') d.setMonth(d.getMonth() + 1)
  if (bp === 'yearly')  d.setFullYear(d.getFullYear() + 1)
  return d
}

function periodLabel(bp: BillingPeriod | 'onetime') {
  const map: Record<string, string> = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year', onetime: 'one-time' }
  return map[bp] ?? bp
}

export default function ProductDetailPortalPage() {
  /**
   * @module portal/shop/[productId]
   * @api-calls GET /api/products/:id, GET /api/products/:id/variants, GET /api/recurring-plans
   * @depends-on useCartStore, usePlans
   * @role portal
   * @emits none
   * RUFLOW_REVIEW: product detail page - variant/plan selection, date calc, add to cart
   */
  const { productId } = useParams<{ productId: string }>()
  const router = useRouter()
  const { addItem, setBillingPeriod, setStartDate, start_date: globalStartDate, billing_period: globalBP } = useCartStore()
  const { plans, fetchPlans } = usePlans()
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [selectedPlan, setSelectedPlan] = useState<RecurringPlan | null>(null)
  const [billingMode, setBillingMode] = useState<BillingPeriod | 'onetime'>('monthly')
  const [startDate, setLocalStartDate] = useState(globalStartDate || new Date().toISOString().split('T')[0])
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
        await fetchPlans(true)
      } catch {
        toast.error('Product not found')
        router.push('/shop')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [productId, router, fetchPlans])

  // Sync billing mode from global store on first load
  useEffect(() => {
    if (globalBP) setBillingMode(globalBP)
  }, [globalBP])

  const selectedVariantObj = variants.find(v => v.id === selectedVariant)
  const variantExtra = selectedVariantObj?.extra_price ?? 0
  const monthlyPrice = (product?.sales_price ?? 0) + variantExtra
  // Use admin-set yearly_price + variant extra; fall back to 10× monthly if not set
  const yearlyPrice = product?.yearly_price != null
    ? product.yearly_price + variantExtra
    : getPeriodPrice(monthlyPrice, 'yearly')
  const periodPrice = billingMode === 'yearly' ? yearlyPrice : monthlyPrice
  const totalPrice = periodPrice * quantity
  const yearlySavings = Math.round(monthlyPrice * 12 - yearlyPrice)

  const endDate = billingMode !== 'onetime' ? computeEndDate(startDate, billingMode) : null

  const handleBillingModeChange = (mode: BillingPeriod | 'onetime') => {
    setBillingMode(mode)
    // Find matching plan
    if (mode !== 'onetime') {
      const matchingPlan = plans.find(p => p.billing_period === mode)
      setSelectedPlan(matchingPlan ?? null)
    } else {
      setSelectedPlan(null)
    }
  }

  const handleAddToCart = (goToCart = false) => {
    if (!product) return
    // Update global cart store
    if (billingMode !== 'onetime') {
      setBillingPeriod(billingMode as BillingPeriod)
    }
    setStartDate(startDate)

    addItem({
      product_id: product.id,
      variant_id: selectedVariant || undefined,
      plan_id: selectedPlan?.id || undefined,
      quantity,
      product_name: product.name,
      variant_name: selectedVariantObj ? `${selectedVariantObj.attribute}: ${selectedVariantObj.value}` : undefined,
      unit_price: periodPrice,
      monthly_price: monthlyPrice,
      yearly_price: yearlyPrice,
    })

    const periodText = billingMode === 'onetime' ? '' : ` and renews ${billingMode}`
    toast.success(`Added! Your subscription starts ${fmtDate(startDate)}${periodText}.`)

    if (goToCart) router.push('/cart')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoaderIcon className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!product) return null

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeftIcon className="h-4 w-4" />Back to shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column */}
        <div>
          {/* Image */}
          <div className="h-64 rounded-xl overflow-hidden mb-5">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} width={600} height={400} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-6xl font-bold text-white/70">{product.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>

          <Badge variant="outline" className="capitalize mb-2">{product.product_type}</Badge>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{product.name}</h1>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 font-medium">Active product</span>
          </div>
          {product.description && (
            <div className="text-slate-500 text-sm space-y-1">
              {product.description.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
        </div>

        {/* Right column — purchase card */}
        <div className="md:sticky md:top-24 self-start">
          <Card className="border-slate-200">
            <CardContent className="p-5 space-y-5">
              {/* Price */}
              <div>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-bold text-indigo-700">₹{periodPrice.toLocaleString('en-IN')}</p>
                  {billingMode === 'yearly' && (
                    <p className="text-sm text-slate-400 line-through mb-1">
                      ₹{(monthlyPrice * 12).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
                {billingMode !== 'onetime' && (
                  <p className="text-sm text-slate-500 mt-0.5">per {periodLabel(billingMode)}</p>
                )}
                {billingMode === 'yearly' && yearlySavings > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 bg-green-50 text-green-700 px-2.5 py-1 rounded-full w-fit">
                    <TagIcon className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">Save ₹{yearlySavings.toLocaleString('en-IN')} vs monthly</span>
                  </div>
                )}
                {billingMode === 'yearly' && (
                  <p className="text-xs text-slate-400 mt-1">
                    ≈ ₹{Math.round(yearlyPrice / 12).toLocaleString('en-IN')}/month equivalent
                  </p>
                )}
              </div>

              {/* Variant select */}
              {variants.length > 0 && (
                <div className="space-y-2">
                  <Label>Variant</Label>
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

              {/* Billing period selector — Monthly / Yearly only */}
              <div className="space-y-2">
                <Label>Billing Period</Label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Monthly */}
                  <button
                    onClick={() => handleBillingModeChange('monthly')}
                    className={`relative flex flex-col items-start px-4 py-3 rounded-xl border-2 transition-all text-left ${
                      billingMode === 'monthly'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <span className={`text-xs font-semibold ${billingMode === 'monthly' ? 'text-indigo-600' : 'text-slate-500'}`}>Monthly</span>
                    <span className={`text-base font-bold mt-0.5 ${billingMode === 'monthly' ? 'text-indigo-900' : 'text-slate-800'}`}>
                      ₹{monthlyPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-400">per month</span>
                  </button>

                  {/* Yearly */}
                  <button
                    onClick={() => handleBillingModeChange('yearly')}
                    className={`relative flex flex-col items-start px-4 py-3 rounded-xl border-2 transition-all text-left ${
                      billingMode === 'yearly'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    {yearlySavings > 0 && (
                      <span className="absolute -top-2.5 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        BEST VALUE
                      </span>
                    )}
                    <span className={`text-xs font-semibold ${billingMode === 'yearly' ? 'text-indigo-600' : 'text-slate-500'}`}>Yearly</span>
                    <span className={`text-base font-bold mt-0.5 ${billingMode === 'yearly' ? 'text-indigo-900' : 'text-slate-800'}`}>
                      ₹{yearlyPrice.toLocaleString('en-IN')}
                    </span>
                    {yearlySavings > 0 ? (
                      <span className="text-[11px] text-green-600 font-medium">Save ₹{yearlySavings.toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-[11px] text-slate-400">per year</span>
                    )}
                  </button>
                </div>

                {/* One-time */}
                <button
                  onClick={() => handleBillingModeChange('onetime')}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 transition-all ${
                    billingMode === 'onetime'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  <span className="text-sm font-medium">One-time purchase</span>
                  <span className="text-sm font-bold">₹{monthlyPrice.toLocaleString('en-IN')}</span>
                </button>
                {selectedPlan && (
                  <p className="text-xs text-slate-400 mt-1">{selectedPlan.name}</p>
                )}
              </div>

              {/* Start / End date */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <input
                  type="date"
                  min={todayStr}
                  value={startDate}
                  onChange={e => setLocalStartDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                {endDate && (
                  <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                    <ZapIcon className="h-3.5 w-3.5 text-indigo-500" />
                    <p className="text-xs text-indigo-700 font-medium">
                      {fmtDate(startDate)} → {fmtDate(endDate)}
                    </p>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label>Quantity</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-8 w-8 p-0">-</Button>
                  <span className="text-sm font-semibold w-8 text-center">{quantity}</span>
                  <Button variant="outline" size="sm" onClick={() => setQuantity(q => q + 1)} className="h-8 w-8 p-0">+</Button>
                </div>
              </div>

              {/* Total + Actions */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">
                    Total {billingMode !== 'onetime' ? `/ ${periodLabel(billingMode)}` : ''}
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900">₹{totalPrice.toLocaleString('en-IN')}</span>
                    {billingMode === 'yearly' && yearlySavings > 0 && quantity > 0 && (
                      <p className="text-xs text-green-600 font-medium">
                        You save ₹{(yearlySavings * quantity).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
                <Button onClick={() => handleAddToCart(false)} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
                  <ShoppingCartIcon className="h-4 w-4" />Add to Cart
                </Button>
                <Button variant="outline" onClick={() => handleAddToCart(true)} className="w-full gap-2">
                  Buy Now →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
