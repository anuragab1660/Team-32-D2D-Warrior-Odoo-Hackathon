'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useCartStore } from '@/stores/cart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  ShoppingCartIcon, TrashIcon, LoaderIcon, ArrowRightIcon,
  CalendarIcon, LockIcon, ZapIcon, CreditCardIcon,
} from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'
import type { BillingPeriod } from '@/types'
import { getPeriodPrice, getPeriodSavings } from '@/lib/utils'
import { processCardPayment } from '@/lib/razorpay'
import { useAuth } from '@/hooks/useAuth'

/**
 * @module portal/cart
 * @api-calls POST /api/subscriptions/from-cart
 * @depends-on useCartStore
 * @role portal
 * @emits none
 * RUFLOW_REVIEW: cart checkout page - billing config, confirm dialog, order placement
 */

function computeEndDate(start: string, bp: BillingPeriod) {
  const d = new Date(start)
  if (bp === 'daily')   d.setDate(d.getDate() + 1)
  if (bp === 'weekly')  d.setDate(d.getDate() + 7)
  if (bp === 'monthly') d.setMonth(d.getMonth() + 1)
  if (bp === 'yearly')  d.setFullYear(d.getFullYear() + 1)
  return d
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CartPage() {
  /**
   * @module portal/cart
   * @api-calls POST /api/subscriptions/from-cart
   * @depends-on useCartStore
   * @role portal
   * @emits none
   * RUFLOW_REVIEW: cart checkout page - billing config, confirm dialog, order placement
   */
  const { items, removeItem, updateQuantity, clearCart, subtotal, billing_period, start_date, setBillingPeriod, setStartDate } = useCartStore()
  const { user } = useAuth()
  const router = useRouter()
  const [checkingOut, setCheckingOut] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoError, setPromoError] = useState('')

  const [card, setCard] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  })
  const [cardError, setCardError] = useState('')

  const formatCardNumber = (val: string) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4)
    if (clean.length >= 3) return clean.slice(0, 2) + '/' + clean.slice(2)
    return clean
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const endDate = computeEndDate(start_date || todayStr, billing_period)

  useEffect(() => {
    if (!start_date) setStartDate(todayStr)
  }, [start_date, setStartDate, todayStr])

  const sub = subtotal()

  const handleApplyPromo = () => {
    setPromoError('')
    if (!promoCode.trim()) return
    // Client-side mock check — backend can validate
    if (promoCode.toUpperCase() === 'SAVE10') {
      setPromoApplied(true)
      toast.success('SAVE10 applied — 10% off')
    } else {
      setPromoError('Invalid or expired code')
      toast.error('Invalid or expired code')
    }
  }

  const discountAmt = promoApplied ? Math.round(sub * 0.1) : 0
  const totalAfterDiscount = sub - discountAmt

  const handleCheckout = async () => {
    setCardError('')
    if (items.length === 0) return

    // Validate card fields
    const rawNumber = card.number.replace(/\s/g, '')
    if (rawNumber.length < 15) { setCardError('Enter a valid card number'); return }
    if (!card.name.trim()) { setCardError('Enter the cardholder name'); return }
    const expiryParts = card.expiry.split('/')
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      setCardError('Enter expiry as MM/YY'); return
    }
    if (card.cvv.length < 3) { setCardError('Enter a valid CVV'); return }

    setCheckingOut(true)
    try {
      // Step 1 — create Razorpay order
      const { data: orderData } = await api.post('/api/payments/create-cart-order', {
        amount: totalAfterDiscount,
      })

      // Step 2 — process card payment via Razorpay Custom Checkout
      await processCardPayment({
        order_id: orderData.data.order_id,
        amount: orderData.data.amount,
        currency: 'INR',
        card_number: rawNumber,
        card_name: card.name,
        card_expiry_month: expiryParts[0],
        card_expiry_year: expiryParts[1],
        card_cvv: card.cvv,
        email: user?.email,
        contact: '9999999999',
        onSuccess: async (paymentData) => {
          try {
            // Step 3 — verify + create subscription atomically
            const { data: verifyData } = await api.post('/api/payments/verify-cart', {
              razorpay_order_id: paymentData.razorpay_order_id,
              razorpay_payment_id: paymentData.razorpay_payment_id,
              razorpay_signature: paymentData.razorpay_signature,
              items: items.map(item => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
              })),
              billing_period,
              start_date: start_date || todayStr,
              plan_id: items.find(i => i.plan_id)?.plan_id || null,
              notes: promoApplied ? `Promo: ${promoCode}` : '',
              amount: totalAfterDiscount,
            })
            clearCart()
            toast.success('Payment successful! Subscription activated.')
            router.push(`/orders/${verifyData.data.id}`)
          } catch (err: unknown) {
            const e = err as { response?: { data?: { error?: string } } }
            toast.error(e?.response?.data?.error || 'Payment received but activation failed. Contact support.')
            setCheckingOut(false)
          }
        },
        onError: () => setCheckingOut(false),
      })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      toast.error(e?.response?.data?.error || 'Checkout failed. Please try again.')
      setCheckingOut(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Your Cart</h1>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShoppingCartIcon className="h-16 w-16 text-slate-200 mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">Your cart is empty</h2>
          <p className="text-slate-400 mb-6">Browse our products and add items to your cart.</p>
          <Link href="/shop">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Browse Shop</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Your Cart</h1>
        <Button variant="ghost" size="sm" onClick={() => clearCart()} className="text-red-500 hover:text-red-600 hover:bg-red-50">
          Clear cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-4">
          {/* Cart items */}
          {items.map((item, i) => (
            <motion.div
              key={`${item.product_id}-${item.variant_id}`}
              custom={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.product_name}</p>
                      {item.variant_name && (
                        <p className="text-xs text-slate-500">{item.variant_name}</p>
                      )}
                      {item.plan_id && (
                        <Badge className="bg-indigo-100 text-indigo-700 text-xs mt-1 capitalize">{billing_period} Plan</Badge>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-600">
                          ₹{item.unit_price.toLocaleString('en-IN')}
                          <span className="text-slate-400 text-xs ml-1">/{billing_period === 'daily' ? 'day' : billing_period === 'weekly' ? 'week' : billing_period === 'monthly' ? 'month' : 'year'}</span>
                        </p>
                        {billing_period === 'yearly' && item.monthly_price && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{(item.monthly_price * 12).toLocaleString('en-IN')}/yr
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline" size="sm"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_id)}
                          className="h-7 w-7 p-0"
                        >-</Button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_id)}
                          className="h-7 w-7 p-0"
                        >+</Button>
                      </div>
                      <p className="font-semibold text-slate-900 w-20 text-right">
                        ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
                      </p>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => removeItem(item.product_id, item.variant_id)}
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Subscription Configuration */}
          <Card className="border-slate-200 border-indigo-100 bg-indigo-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-indigo-500" />
                Subscription Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Billing Period</Label>
                  <Select value={billing_period} onValueChange={v => setBillingPeriod(v as BillingPeriod)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">
                        Monthly — ₹{items[0]?.monthly_price.toLocaleString('en-IN') ?? '0'}/month
                      </SelectItem>
                      <SelectItem value="yearly">
                        Yearly — ₹{(items[0]?.yearly_price ?? getPeriodPrice(items[0]?.monthly_price ?? 0, 'yearly')).toLocaleString('en-IN')}/year ⭐ Best value
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <input
                    type="date"
                    min={todayStr}
                    value={start_date || todayStr}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg border border-indigo-100 px-3 py-2">
                <ZapIcon className="h-3.5 w-3.5 text-indigo-400" />
                <p className="text-xs text-slate-600">
                  End Date: <span className="font-semibold text-indigo-700">{fmtDate(endDate)}</span>
                </p>
              </div>
              {billing_period === 'yearly' && items.some(i => i.monthly_price) && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <span className="text-green-600 text-sm">🎉</span>
                  <p className="text-xs text-green-700 font-medium">
                    {(() => {
                      const saved = items.reduce((acc, i) => {
                        const yr = i.yearly_price ?? getPeriodPrice(i.monthly_price, 'yearly')
                        return acc + (i.monthly_price * 12 - yr) * i.quantity
                      }, 0)
                      return saved > 0
                        ? `You're saving ₹${Math.round(saved).toLocaleString('en-IN')} with the yearly plan!`
                        : 'You\'re on the yearly plan!'
                    })()}
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Your subscription will auto-renew on {fmtDate(endDate)} unless cancelled.
              </p>
            </CardContent>
          </Card>

          {/* Promo code */}
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <Label className="mb-2 block">Promo Code</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={e => { setPromoCode(e.target.value); setPromoError('') }}
                  disabled={promoApplied}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={promoApplied}
                >Apply</Button>
              </div>
              {promoApplied && <p className="text-xs text-green-600 mt-1.5">✅ {promoCode.toUpperCase()} applied — 10% off</p>}
              {promoError && <p className="text-xs text-red-500 mt-1.5">❌ {promoError}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Right — Order Summary */}
        <div>
          <Card className="border-slate-200 sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                {items.map(item => (
                  <div key={`${item.product_id}-${item.variant_id}`} className="flex justify-between">
                    <span className="text-slate-600 truncate mr-2">{item.product_name} ×{item.quantity}</span>
                    <span className="font-medium text-slate-900 shrink-0">₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal <span className="capitalize text-slate-400">({billing_period})</span></span>
                  <span>₹{sub.toLocaleString('en-IN')}</span>
                </div>
                {billing_period === 'yearly' && (() => {
                  const totalSavings = items.reduce((acc, i) => {
                    const yr = i.yearly_price ?? getPeriodPrice(i.monthly_price, 'yearly')
                    return acc + Math.max(0, (i.monthly_price * 12 - yr) * i.quantity)
                  }, 0)
                  return totalSavings > 0 ? (
                    <div className="flex justify-between text-green-600">
                      <span>Yearly savings</span>
                      <span>-₹{totalSavings.toLocaleString('en-IN')}</span>
                    </div>
                  ) : null
                })()}
                {promoApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo ({promoCode.toUpperCase()})</span>
                    <span>-₹{discountAmt.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t border-slate-100 pt-2">
                  <span>Total / {billing_period}</span>
                  <span>₹{totalAfterDiscount.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="text-xs text-slate-500 space-y-0.5">
                <p>Billing: <span className="capitalize font-medium">{billing_period}</span></p>
                <p>Period: {fmtDate(start_date || todayStr)} – {fmtDate(endDate)}</p>
                {billing_period === 'yearly' && (
                  <p className="text-slate-400">≈ ₹{Math.round(totalAfterDiscount / 12).toLocaleString('en-IN')}/month equivalent</p>
                )}
              </div>
              <Button
                onClick={() => setShowConfirm(true)}
                disabled={checkingOut}
                className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {checkingOut ? (
                  <><LoaderIcon className="h-4 w-4 animate-spin" />Processing...</>
                ) : (
                  <>Proceed to Checkout <ArrowRightIcon className="h-4 w-4" /></>
                )}
              </Button>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <LockIcon className="h-3 w-3" />Secure checkout
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Card Payment Dialog */}
      <Dialog open={showConfirm} onOpenChange={(o) => { if (!checkingOut) { setShowConfirm(o); setCardError('') } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-indigo-500" />
              Secure Payment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Order summary strip */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 capitalize">{billing_period} billing</span>
                <span className="font-bold text-indigo-700 text-base">₹{totalAfterDiscount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>{fmtDate(start_date || todayStr)} → {fmtDate(endDate)}</span>
                <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {cardError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{cardError}</div>
            )}

            {/* Card Number */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Card Number</Label>
              <div className="relative">
                <Input
                  placeholder="4100 2800 0000 1007"
                  value={card.number}
                  onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))}
                  maxLength={19}
                  className="pr-10 tracking-widest font-mono text-sm"
                />
                <CreditCardIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              </div>
            </div>

            {/* Cardholder Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Cardholder Name</Label>
              <Input
                placeholder="Name on card"
                value={card.name}
                onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
              />
            </div>

            {/* Expiry + CVV */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Expiry Date</Label>
                <Input
                  placeholder="MM/YY"
                  value={card.expiry}
                  onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                  maxLength={5}
                  className="tracking-widest font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">CVV</Label>
                <Input
                  placeholder="123"
                  type="password"
                  value={card.cvv}
                  onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  maxLength={4}
                  className="tracking-widest font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
              <LockIcon className="h-3 w-3" />
              Payments secured by Razorpay. Test mode — no real money charged.
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={checkingOut}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {checkingOut
                ? <><LoaderIcon className="h-4 w-4 animate-spin" />Processing...</>
                : <>Pay ₹{totalAfterDiscount.toLocaleString('en-IN')}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
