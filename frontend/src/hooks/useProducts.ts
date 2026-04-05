import { useState, useCallback } from 'react'
import type { Product, ProductVariant } from '@/types'
import { DEFAULT_PAGINATION, buildQueryString, requestData, withLoading } from './utils'
import { productsService } from '@/services'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION)

  const fetchProducts = useCallback(async (filters: {
    is_active?: boolean; type?: string; search?: string; page?: number; limit?: number
  } = {}) => {
    await withLoading(setLoading, async () => {
      const query = buildQueryString({
        is_active: filters.is_active,
        type: filters.type,
        search: filters.search,
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
      })

      const data = await requestData(() =>
        productsService.getProducts(query),
      )

      if (!data) return
      setProducts(data.data)
      setPagination(data.pagination)
    })
  }, [])

  const createProduct = useCallback(async (payload: Partial<Product>) => {
    return requestData(() => productsService.createProduct(payload), {
      successMessage: 'Product created',
    })
  }, [])

  const updateProduct = useCallback(async (id: string, payload: Partial<Product>) => {
    return requestData(() => productsService.updateProduct(id, payload), {
      successMessage: 'Product updated',
    })
  }, [])

  const toggleProduct = useCallback(async (id: string) => {
    return requestData(() => productsService.toggleProduct(id), {
      successMessage: 'Product updated',
    })
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    await requestData(() => productsService.deleteProduct(id), {
      successMessage: 'Product deleted',
    })
  }, [])

  const getVariants = useCallback(async (productId: string) => {
    return requestData(() => productsService.getVariants(productId))
  }, [])

  const createVariant = useCallback(async (productId: string, payload: Partial<ProductVariant>) => {
    return requestData(() => productsService.createVariant(productId, payload), { successMessage: 'Variant added' })
  }, [])

  const updateVariant = useCallback(async (productId: string, variantId: string, payload: Partial<ProductVariant>) => {
    return requestData(() => productsService.updateVariant(productId, variantId, payload), { successMessage: 'Variant updated' })
  }, [])

  const deleteVariant = useCallback(async (productId: string, variantId: string) => {
    await requestData(() => productsService.deleteVariant(productId, variantId), { successMessage: 'Variant deleted' })
  }, [])

  return {
    products, loading, pagination,
    fetchProducts, createProduct, updateProduct, toggleProduct, deleteProduct,
    getVariants, createVariant, updateVariant, deleteVariant,
  }
}
