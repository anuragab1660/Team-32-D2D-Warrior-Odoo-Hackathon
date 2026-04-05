import { useState, useCallback } from 'react'
import type { User } from '@/types'
import { usersService } from '@/services'
import { requestData, withLoading } from './utils'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    await withLoading(setLoading, async () => {
      const data = await requestData(() => usersService.getUsers(), { fallback: [] })
      if (!data) return
      setUsers(data)
    })
  }, [])

  const fetchInternalUsers = useCallback(async () => {
    await withLoading(setLoading, async () => {
      const data = await requestData(() => usersService.getInternalUsers(), { fallback: [] })
      if (!data) return
      setUsers(data)
    })
  }, [])

  const inviteUser = useCallback(async (payload: { name?: string; email: string; role: 'admin' | 'internal' }) => {
    return requestData(() => usersService.inviteUser(payload), { successMessage: 'Invitation sent!' })
  }, [])

  const toggleUser = useCallback(async (id: string) => {
    return requestData(() => usersService.toggleUser(id), { successMessage: 'User status updated' })
  }, [])

  const resendInvite = useCallback(async (id: string) => {
    return requestData(() => usersService.resendInvite(id), { successMessage: 'Invitation resent' })
  }, [])

  return {
    users,
    loading,
    fetchUsers,
    fetchInternalUsers,
    inviteUser,
    toggleUser,
    resendInvite,
  }
}
