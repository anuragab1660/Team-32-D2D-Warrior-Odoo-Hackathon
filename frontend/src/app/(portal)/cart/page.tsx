'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart'
import { ShoppingCartIcon, TrashIcon, LoaderIcon, ArrowRightIcon } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'
import { PageHero } from '@/components/shared/PageHero'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCartStore()
  const router = useRouter()
  const [checkingOut, setCheckingOut] = useState(false)

  const handleCheckout = async () => {
    if (items.length === 0) return
    setCheckingOut(true)
    try {
      const { data } = await api.post('/api/subscriptions/from-cart', {
        items: items.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          plan_id: item.plan_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      })
      clearCart()
      toast.success('Order placed successfully!')
      router.push(`/orders/${data.data.id}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      toast.error(e?.response?.data?.error || 'Checkout failed. Please try again.')
    } finally {
      setCheckingOut(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHero eyebrow="Portal cart" title="Your cart" description="Your selected items will appear here before checkout." />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--surface-container-low)' }}
          >
            <ShoppingCartIcon className="h-8 w-8" style={{ color: 'var(--on-surface-muted)' }} />
          </div>
          <h2
            className="text-lg font-bold mb-2"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
          >
            Your cart is empty
          </h2>
          <p className="text-sm mb-6" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
            Browse our products and add items to your cart.
          </p>
          <Link href="/shop">
            <button className="btn-gradient">Browse Shop</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHero
        eyebrow="Portal cart"
        title="Your cart"
        description="Review quantities, pricing, and proceed when the order looks right."
        action={
          <button
            onClick={() => clearCart()}
            className="text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: '#dc2626', fontFamily: 'Inter, sans-serif' }}
          >
            Clear cart
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div
              key={`${item.product_id}-${item.variant_id}`}
              className="section-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p
                    className="font-semibold"
                    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}
                  >
                    {item.product_name}
                  </p>
                  {item.variant_name && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>
                      {item.variant_name}
                    </p>
                  )}
                  {item.plan_id && (
                    <p className="text-xs mt-0.5 font-medium" style={{ color: '#274e82', fontFamily: 'Inter, sans-serif' }}>
                      Subscription plan
                    </p>
                  )}
                  <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)', fontFamily: 'Inter, sans-serif' }}>
                    ₹{item.unit_price.toLocaleString()} each
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center gap-2 rounded-xl px-2 py-1"
                    style={{ background: 'var(--surface-container-low)' }}
                  >
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_id)}
                      className="h-6 w-6 rounded-lg flex items-center justify-center font-bold text-sm hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--on-surface)' }}
                    >-</button>
                    <span
                      className="text-sm font-semibold w-5 text-center"
                      style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_id)}
                      className="h-6 w-6 rounded-lg flex items-center justify-center font-bold text-sm hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--on-surface)' }}
                    >+</button>
                  </div>
                  <p
                    className="font-bold w-20 text-right"
                    style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
                  >
                    ₹{(item.unit_price * item.quantity).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeItem(item.product_id, item.variant_id)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
                    style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <div className="section-card sticky top-24">
            <h2
              className="text-base font-bold mb-5"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
            >
              Order Summary
            </h2>
            <div className="space-y-2 text-sm mb-4">
              {items.map(item => (
                <div key={`${item.product_id}-${item.variant_id}`} className="flex justify-between">
                  <span
                    className="truncate mr-2"
                    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-variant)' }}
                  >
                    {item.product_name} ×{item.quantity}
                  </span>
                  <span
                    className="font-semibold shrink-0"
                    style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
                  >
                    ₹{(item.unit_price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="pt-4 flex justify-between font-bold text-base mb-1"
              style={{ borderTop: '1px solid var(--surface-container-high)' }}
            >
              <span style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>Subtotal</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
                ₹{subtotal().toLocaleString()}
              </span>
            </div>
            <p
              className="text-xs mb-5"
              style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
            >
              Taxes and final pricing calculated at checkout
            </p>
            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="btn-gradient w-full flex items-center justify-center gap-2"
              style={{ opacity: checkingOut ? 0.7 : 1 }}
            >
              {checkingOut ? (
                <><LoaderIcon className="h-4 w-4 animate-spin" />Processing...</>
              ) : (
                <>Checkout <ArrowRightIcon className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
