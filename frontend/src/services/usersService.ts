import api from '@/lib/api'
import type { ApiResponse, User } from '@/types'

export const usersService = {
  getUsers() {
    return api.get<ApiResponse<User[]>>('/api/users')
  },

  getInternalUsers() {
    return api.get<ApiResponse<User[]>>('/api/users/internal')
  },

  inviteUser(payload: { name?: string; email: string; role: 'admin' | 'internal' }) {
    return api.post<ApiResponse<User>>('/api/users/invite', payload)
  },

  toggleUser(id: string) {
    return api.patch<ApiResponse<User>>(`/api/users/${id}/toggle`)
  },

  resendInvite(id: string) {
    return api.post<ApiResponse<unknown>>(`/api/users/${id}/resend-invite`)
  },
}
