'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { setAccessToken, setRefreshToken, clearTokens, getRefreshToken } from '@/lib/auth'
import type { User, UserRole, LoginResponse } from '@/types'

let globalUser: User | null = null

export function useAuth() {
  const [user, setUser] = useState<User | null>(globalUser)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/me')
      globalUser = data.data as User
      setUser(data.data)
    } catch {
      globalUser = null
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (globalUser) { setUser(globalUser); setLoading(false); return }
    const token = getRefreshToken()
    if (!token) { setLoading(false); return }
    const restore = async () => {
      try {
        const { data } = await api.post('/api/auth/refresh-token', { refreshToken: token })
        setAccessToken(data.data.accessToken)
        await refreshUser()
      } catch {
        clearTokens()
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [refreshUser])

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{ success: boolean; data: LoginResponse }>('/api/auth/login', {
        email,
        password,
      })
      const { accessToken, refreshToken, user: userData } = data.data
      setAccessToken(accessToken)
      setRefreshToken(refreshToken)
      globalUser = userData
      setUser(userData)
      if (userData.role === 'portal') router.push('/home')
      else router.push('/dashboard')
    },
    [router]
  )

  const logout = useCallback(() => {
    clearTokens()
    globalUser = null
    setUser(null)
    router.push('/login')
  }, [router])

  const isRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!user) return false
      if (Array.isArray(role)) return role.includes(user.role)
      return user.role === role
    },
    [user]
  )

  const hasAccess = useCallback(
    (roles: UserRole[]) => {
      if (!user) return false
      return roles.includes(user.role)
    },
    [user]
  )

  return { user, loading, login, logout, isRole, hasAccess, refreshUser }
}

export const useAuthStore = useAuth
