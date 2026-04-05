import { useState, useCallback } from 'react'
import type { Discount } from '@/types'
import { buildQueryString, requestData, withLoading } from './utils'
import { discountsService } from '@/services'

export function useDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDiscounts = useCallback(async (active?: boolean) => {
    await withLoading(setLoading, async () => {
      const query = buildQueryString({ is_active: active })
      const data = await requestData(() => discountsService.getDiscounts(query || undefined))
      setDiscounts(Array.isArray(data) ? data : [])
    })
  }, [])

  const createDiscount = useCallback(async (payload: Partial<Discount>) => {
    return requestData(() => discountsService.createDiscount(payload), {
      successMessage: 'Discount created',
    })
  }, [])

  const updateDiscount = useCallback(async (id: string, payload: Partial<Discount>) => {
    return requestData(() => discountsService.updateDiscount(id, payload), {
      successMessage: 'Discount updated',
    })
  }, [])

  const toggleDiscount = useCallback(async (id: string) => {
    return requestData(() => discountsService.toggleDiscount(id), {
      successMessage: 'Discount updated',
    })
  }, [])

  const deleteDiscount = useCallback(async (id: string) => {
    await requestData(() => discountsService.deleteDiscount(id), {
      successMessage: 'Discount deleted',
    })
  }, [])

  return { discounts, loading, fetchDiscounts, createDiscount, updateDiscount, toggleDiscount, deleteDiscount }
}
