'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoaderIcon, ArrowLeftIcon, TagIcon, ReceiptIcon } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import { toast } from 'sonner'
import type { Customer, Product, Discount } from '@/types'

type ExtendedProduct = Product & { default_discount_id?: string; tax_id?: string }

const schema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  product_id: z.string().min(1, 'Product is required'),
  billing_period: z.enum(['monthly', 'yearly']),
  quantity: z.coerce.number().min(1, 'Min 1'),
  start_date: z.string().min(1, 'Start date is required'),
  expiration_date: z.string().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function calcExpiry(startDate: string, period: 'monthly' | 'yearly') {
  if (!startDate) return ''
  const d = new Date(startDate)
  if (period === 'monthly') d.setMonth(d.getMonth() + 1)
  else d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

export default function NewSubscriptionPage() {
  const router = useRouter()
  const { createSubscription, addLine } = useSubscriptions()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<ExtendedProduct[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      start_date: new Date().toISOString().split('T')[0],
      quantity: 1,
      billing_period: 'monthly',
    },
  })

  const selectedProductId = watch('product_id')
  const billingPeriod = watch('billing_period')
  const quantity = watch('quantity') || 1
  const startDate = watch('start_date')

  const selectedProduct = products.find(p => p.id === selectedProductId)
  const defaultDiscount = selectedProduct?.default_discount_id
    ? discounts.find(d => d.id === selectedProduct.default_discount_id)
    : undefined

  // Derived pricing
  const unitPrice = billingPeriod === 'yearly'
    ? (selectedProduct?.yearly_price || (selectedProduct ? Number(selectedProduct.sales_price) * 12 : 0))
    : (selectedProduct ? Number(selectedProduct.sales_price) : 0)

  const subtotal = unitPrice * quantity

  const discountAmount = defaultDiscount
    ? defaultDiscount.type === 'percentage'
      ? Math.round((subtotal * defaultDiscount.value) / 100 * 100) / 100
      : defaultDiscount.value * quantity
    : 0

  const total = subtotal - discountAmount

  useEffect(() => {
    api.get('/api/customers?limit=200').then(({ data }) => setCustomers(data.data || [])).catch(() => {})
    api.get('/api/products?is_active=true&limit=200').then(({ data }) => setProducts(data.data || [])).catch(() => {})
    api.get('/api/discounts?is_active=true&limit=200').then(({ data }) => setDiscounts(data.data || [])).catch(() => {})
  }, [])

  // Auto-fill expiration date when billing period or start date changes
  useEffect(() => {
    if (startDate && billingPeriod) {
      setValue('expiration_date', calcExpiry(startDate, billingPeriod))
    }
  }, [startDate, billingPeriod, setValue])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError('')
    try {
      const sub = await createSubscription({
        customer_id: data.customer_id,
        start_date: data.start_date,
        expiration_date: data.expiration_date || undefined,
        payment_terms: data.payment_terms || undefined,
        notes: data.notes || undefined,
      })
      if (sub) {
        try {
          await addLine(sub.id, {
            product_id: data.product_id,
            quantity: data.quantity,
            unit_price: unitPrice,
            discount_id: defaultDiscount?.id || undefined,
            discount_amount: discountAmount,
            tax_amount: 0,
          })
        } catch {
          toast.warning('Subscription created, but failed to add product line')
        }
        router.push(`/subscriptions/${sub.id}`)
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error || 'Failed to create subscription')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="space-y-6 max-w-2xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="New Subscription"
        description="Create a new customer subscription"
        action={
          <Link href="/subscriptions">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeftIcon className="h-4 w-4" />Back
            </Button>
          </Link>
        }
      />

      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Subscription Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
            )}

            {/* Customer */}
            <div className="space-y-2">
              <Label>Customer <span className="text-red-500">*</span></Label>
              <Select onValueChange={(v) => setValue('customer_id', v)}>
                <SelectTrigger className={errors.customer_id ? 'border-red-400' : ''}>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name || c.name || c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer_id && <p className="text-xs text-red-500">{errors.customer_id.message}</p>}
            </div>

            {/* Product */}
            <div className="space-y-2">
              <Label>Product <span className="text-red-500">*</span></Label>
              <Select onValueChange={(v) => setValue('product_id', v)}>
                <SelectTrigger className={errors.product_id ? 'border-red-400' : ''}>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.product_id && <p className="text-xs text-red-500">{errors.product_id.message}</p>}
            </div>

            {/* Billing Period + Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Billing Period <span className="text-red-500">*</span></Label>
                <Select
                  defaultValue="monthly"
                  onValueChange={(v) => setValue('billing_period', v as 'monthly' | 'yearly')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">
                      Monthly
                      {selectedProduct ? ` — ₹${Number(selectedProduct.sales_price).toLocaleString('en-IN')}` : ''}
                    </SelectItem>
                    <SelectItem value="yearly">
                      Yearly
                      {selectedProduct
                        ? ` — ₹${Number(selectedProduct.yearly_price || Number(selectedProduct.sales_price) * 12).toLocaleString('en-IN')}`
                        : ''}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min="1"
                  {...register('quantity')}
                  className={errors.quantity ? 'border-red-400' : ''}
                />
                {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
              </div>
            </div>

            {/* Pricing Summary */}
            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ReceiptIcon className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-slate-700">Pricing Summary</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Unit Price ({billingPeriod})</span>
                    <span>₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Quantity</span>
                    <span>× {quantity}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium border-t border-slate-200 pt-2">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {defaultDiscount ? (
                    <div className="flex justify-between text-emerald-600">
                      <span className="flex items-center gap-1.5">
                        <TagIcon className="h-3.5 w-3.5" />
                        {defaultDiscount.name}
                        <span className="text-xs text-slate-400">
                          ({defaultDiscount.type === 'percentage' ? `${defaultDiscount.value}%` : `₹${defaultDiscount.value} flat`})
                        </span>
                      </span>
                      <span>− ₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-400 text-xs italic">
                      <span>No default discount on this product</span>
                      <span>—</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-900 font-bold text-base border-t border-slate-300 pt-2">
                    <span>Total</span>
                    <span className="text-indigo-600">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date <span className="text-red-500">*</span></Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date')}
                  className={errors.start_date ? 'border-red-400' : ''}
                />
                {errors.start_date && <p className="text-xs text-red-500">{errors.start_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration_date">
                  Expiration Date
                  <span className="ml-1.5 text-xs font-normal text-slate-400">(auto-filled)</span>
                </Label>
                <Input id="expiration_date" type="date" {...register('expiration_date')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Input id="payment_terms" placeholder="e.g. Net 30" {...register('payment_terms')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Optional notes about this subscription" rows={3} {...register('notes')} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                {isLoading ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Subscription'}
              </Button>
              <Link href="/subscriptions">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
