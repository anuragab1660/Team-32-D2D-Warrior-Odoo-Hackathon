import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, BillingPeriod } from '@/types'
import { getPeriodPrice } from '@/lib/utils'

function resolvePrice(item: CartItem, period: BillingPeriod): number {
  if (period === 'yearly') {
    return item.yearly_price ?? getPeriodPrice(item.monthly_price, 'yearly')
  }
  return item.monthly_price
}

interface CartStore {
  items: CartItem[]
  billing_period: BillingPeriod
  start_date: string
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  totalItems: () => number
  subtotal: () => number
  setBillingPeriod: (bp: BillingPeriod) => void
  setStartDate: (d: string) => void
}

const todayISO = () => new Date().toISOString().split('T')[0]

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      billing_period: 'monthly',
      start_date: todayISO(),
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.product_id === item.product_id && i.variant_id === item.variant_id
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id && i.variant_id === item.variant_id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        }),
      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product_id === productId && i.variant_id === variantId)
          ),
        })),
      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) { get().removeItem(productId, variantId); return }
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId && i.variant_id === variantId ? { ...i, quantity } : i
          ),
        }))
      },
      clearCart: () => set({ items: [], billing_period: 'monthly', start_date: todayISO() }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
      setBillingPeriod: (bp) => set((state) => ({
        billing_period: bp,
        items: state.items.map((item) => ({
          ...item,
          unit_price: resolvePrice(item, bp),
        })),
      })),
      setStartDate: (d) => set({ start_date: d }),
    }),
    { name: 'prosubx-cart' }
  )
)
