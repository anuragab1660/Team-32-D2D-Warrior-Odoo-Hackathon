'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { setAccessToken, clearTokens, getRefreshToken } from '@/lib/auth'
import type { User, UserRole } from '@/types'
import { applyLoginSession, getPostLoginRoute, normalizeUserPayload } from './authUtils'
import { authService } from '@/services'

let globalUser: User | null = null

export function useAuth() {
  const [user, setUser] = useState<User | null>(globalUser)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authService.getCurrentUser()
      const nextUser = normalizeUserPayload(data.data)
      globalUser = nextUser
      setUser(nextUser)
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
        const { data } = await authService.refreshToken(token)
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
      const { data } = await authService.login(email, password)
      const userData = applyLoginSession(data.data)
      globalUser = userData
      setUser(userData)
      router.push(getPostLoginRoute(userData.role))
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
