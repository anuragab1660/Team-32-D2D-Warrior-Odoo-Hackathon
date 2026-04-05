import type { LoginResponse, User, UserRole } from '@/types'
import { setAccessToken, setRefreshToken } from '@/lib/auth'

const POST_LOGIN_ROUTE_BY_ROLE: Record<UserRole, string> = {
  portal: '/home',
  internal: '/internal/dashboard',
  admin: '/dashboard',
}

export function getPostLoginRoute(role: UserRole): string {
  return POST_LOGIN_ROUTE_BY_ROLE[role]
}

export function applyLoginSession(data: LoginResponse) {
  setAccessToken(data.accessToken)
  setRefreshToken(data.refreshToken)
  return data.user
}

export function normalizeUserPayload(payload: unknown): User {
  return payload as User
}
