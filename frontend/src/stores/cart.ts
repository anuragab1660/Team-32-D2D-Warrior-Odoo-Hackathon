import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  totalItems: () => number
  subtotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
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
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
    }),
    { name: 'prosubx-cart' }
  )
)
