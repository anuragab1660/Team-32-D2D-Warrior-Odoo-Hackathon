import api from '@/lib/api'
import type { Product, ProductVariant, PaginatedResponse, ApiResponse } from '@/types'

export const productsService = {
  getProducts(query: string) {
    return api.get<PaginatedResponse<Product>>(`/api/products?${query}`)
  },

  createProduct(payload: Partial<Product>) {
    return api.post<ApiResponse<Product>>('/api/products', payload)
  },

  updateProduct(id: string, payload: Partial<Product>) {
    return api.put<ApiResponse<Product>>(`/api/products/${id}`, payload)
  },

  toggleProduct(id: string) {
    return api.patch<ApiResponse<Product>>(`/api/products/${id}/toggle`)
  },

  deleteProduct(id: string) {
    return api.delete<ApiResponse<unknown>>(`/api/products/${id}`)
  },

  getVariants(productId: string) {
    return api.get<ApiResponse<ProductVariant[]>>(`/api/products/${productId}/variants`)
  },

  createVariant(productId: string, payload: Partial<ProductVariant>) {
    return api.post<ApiResponse<ProductVariant>>(`/api/products/${productId}/variants`, payload)
  },

  updateVariant(productId: string, variantId: string, payload: Partial<ProductVariant>) {
    return api.put<ApiResponse<ProductVariant>>(`/api/products/${productId}/variants/${variantId}`, payload)
  },

  deleteVariant(productId: string, variantId: string) {
    return api.delete<ApiResponse<unknown>>(`/api/products/${productId}/variants/${variantId}`)
  },
}
