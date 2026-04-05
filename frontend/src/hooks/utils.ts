import { toast } from 'sonner'
import { handleApiError } from '@/lib/api'

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  pages: 1,
}

export function buildQueryString(params: Record<string, unknown>) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })

  return searchParams.toString()
}

export async function withLoading<T>(
  setLoading: (isLoading: boolean) => void,
  action: () => Promise<T>,
): Promise<T> {
  setLoading(true)
  try {
    return await action()
  } finally {
    setLoading(false)
  }
}

export async function requestData<T>(
  request: () => Promise<{ data: { message?: string; data?: T } }>,
  options: { successMessage?: string; fallback?: T } = {},
): Promise<T | undefined> {
  try {
    const response = await request()

    if (options.successMessage) {
      toast.success(response.data.message || options.successMessage)
    }

    return response.data.data
  } catch (error) {
    handleApiError(error)
    return options.fallback
  }
}
