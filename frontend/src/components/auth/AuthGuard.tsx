'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/hooks/useAuth'
import type { UserRole } from '@/types'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

const Spinner = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
  </div>
)

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
      router.replace(user.role === 'portal' ? '/home' : '/dashboard')
    }
  }, [mounted, user, loading, allowedRoles, router])

  if (!mounted || loading) return <Spinner />

  if (!user) return <Spinner />

  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) return <Spinner />

  return <>{children}</>
}
