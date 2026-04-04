import { useState, useCallback } from 'react'
import api, { handleApiError } from '@/lib/api'
import type { Product, ProductVariant, PaginatedResponse, ApiResponse } from '@/types'
import { toast } from 'sonner'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })

  const fetchProducts = useCallback(async (filters: {
    is_active?: boolean; type?: string; search?: string; page?: number; limit?: number
  } = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.is_active !== undefined) params.set('is_active', String(filters.is_active))
      if (filters.type) params.set('type', filters.type)
      if (filters.search) params.set('search', filters.search)
      params.set('page', String(filters.page || 1))
      params.set('limit', String(filters.limit || 20))
      const { data } = await api.get<PaginatedResponse<Product>>(`/api/products?${params}`)
      setProducts(data.data)
      setPagination(data.pagination)
    } catch (err) { handleApiError(err) }
    finally { setLoading(false) }
  }, [])

  const createProduct = useCallback(async (payload: Partial<Product>) => {
    const { data } = await api.post<ApiResponse<Product>>('/api/products', payload)
    toast.success(data.message || 'Product created')
    return data.data
  }, [])

  const updateProduct = useCallback(async (id: string, payload: Partial<Product>) => {
    const { data } = await api.put<ApiResponse<Product>>(`/api/products/${id}`, payload)
    toast.success(data.message || 'Product updated')
    return data.data
  }, [])

  const toggleProduct = useCallback(async (id: string) => {
    const { data } = await api.patch<ApiResponse<Product>>(`/api/products/${id}/toggle`)
    toast.success(data.message || 'Product updated')
    return data.data
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    const { data } = await api.delete<ApiResponse<unknown>>(`/api/products/${id}`)
    toast.success(data.message || 'Product deleted')
  }, [])

  const getVariants = useCallback(async (productId: string) => {
    const { data } = await api.get<ApiResponse<ProductVariant[]>>(`/api/products/${productId}/variants`)
    return data.data
  }, [])

  const createVariant = useCallback(async (productId: string, payload: Partial<ProductVariant>) => {
    const { data } = await api.post<ApiResponse<ProductVariant>>(`/api/products/${productId}/variants`, payload)
    toast.success(data.message || 'Variant added')
    return data.data
  }, [])

  const updateVariant = useCallback(async (productId: string, variantId: string, payload: Partial<ProductVariant>) => {
    const { data } = await api.put<ApiResponse<ProductVariant>>(`/api/products/${productId}/variants/${variantId}`, payload)
    toast.success(data.message || 'Variant updated')
    return data.data
  }, [])

  const deleteVariant = useCallback(async (productId: string, variantId: string) => {
    await api.delete(`/api/products/${productId}/variants/${variantId}`)
    toast.success('Variant deleted')
  }, [])

  return {
    products, loading, pagination,
    fetchProducts, createProduct, updateProduct, toggleProduct, deleteProduct,
    getVariants, createVariant, updateVariant, deleteVariant,
  }
}
