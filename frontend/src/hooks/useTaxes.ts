import { useState, useCallback } from 'react'
import type { Tax } from '@/types'
import { buildQueryString, requestData, withLoading } from './utils'
import { taxesService } from '@/services'

export function useTaxes() {
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTaxes = useCallback(async (active?: boolean) => {
    await withLoading(setLoading, async () => {
      const query = buildQueryString({ is_active: active })
      const data = await requestData(() => taxesService.getTaxes(query || undefined))
      setTaxes(Array.isArray(data) ? data : [])
    })
  }, [])

  const createTax = useCallback(async (payload: Partial<Tax>) => {
    return requestData(() => taxesService.createTax(payload), {
      successMessage: 'Tax created',
    })
  }, [])

  const updateTax = useCallback(async (id: string, payload: Partial<Tax>) => {
    return requestData(() => taxesService.updateTax(id, payload), {
      successMessage: 'Tax updated',
    })
  }, [])

  const toggleTax = useCallback(async (id: string) => {
    return requestData(() => taxesService.toggleTax(id), {
      successMessage: 'Tax updated',
    })
  }, [])

  const deleteTax = useCallback(async (id: string) => {
    await requestData(() => taxesService.deleteTax(id), {
      successMessage: 'Tax deleted',
    })
  }, [])

  return { taxes, loading, fetchTaxes, createTax, updateTax, toggleTax, deleteTax }
}
