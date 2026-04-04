import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from './auth'
import type { ApiError } from '@/types'
import { toast } from 'sonner'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearTokens()
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/refresh-token`,
          { refreshToken }
        )
        setAccessToken(data.data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(originalRequest)
      } catch {
        clearTokens()
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default api

export function handleApiError(err: unknown, form?: { setError: (field: string, error: { message: string }) => void }): void {
  const axiosErr = err as AxiosError<ApiError>
  const res = axiosErr.response?.data
  if (res) {
    if (form && res.details) {
      res.details.forEach(({ field, message }) => form.setError(field, { message }))
    }
    const detail = (res as Record<string, string>).detail
    toast.error(detail ? `${res.error}: ${detail}` : res.error || 'Something went wrong')
  } else {
    toast.error('Network error. Please try again.')
  }
}
