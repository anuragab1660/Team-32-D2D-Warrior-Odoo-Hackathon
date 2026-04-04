'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCartIcon, TrashIcon, LoaderIcon, ArrowRightIcon } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCartStore()
  const router = useRouter()
  const [checkingOut, setCheckingOut] = useState(false)

  const handleCheckout = async () => {
    if (items.length === 0) return
    setCheckingOut(true)
    try {
      // Create a subscription/order from cart items
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
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <Card key={`${item.product_id}-${item.variant_id}`} className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-slate-500">{item.variant_name}</p>
                    )}
                    {item.plan_id && (
                      <p className="text-xs text-indigo-600">Subscription plan</p>
                    )}
                    <p className="text-sm text-slate-600 mt-1">₹{item.unit_price.toLocaleString()} each</p>
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
                      ₹{(item.unit_price * item.quantity).toLocaleString()}
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
          ))}
        </div>

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
                    <span className="font-medium text-slate-900 shrink-0">₹{(item.unit_price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-base">
                <span>Subtotal</span>
                <span>₹{subtotal().toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-400">Taxes and final pricing calculated at checkout</p>
              <Button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {checkingOut ? (
                  <><LoaderIcon className="h-4 w-4 animate-spin" />Processing...</>
                ) : (
                  <>Checkout <ArrowRightIcon className="h-4 w-4" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
