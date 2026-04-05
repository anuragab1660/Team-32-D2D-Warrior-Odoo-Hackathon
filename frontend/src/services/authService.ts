import api from '@/lib/api'
import type { LoginResponse, User } from '@/types'

export const authService = {
  getCurrentUser() {
    return api.get<{ success: boolean; data: User }>('/api/auth/me')
  },

  refreshToken(refreshToken: string) {
    return api.post<{ success: boolean; data: { accessToken: string } }>('/api/auth/refresh-token', {
      refreshToken,
    })
  },

  login(email: string, password: string) {
    return api.post<{ success: boolean; data: LoginResponse }>('/api/auth/login', {
      email,
      password,
    })
  },
}
