let _accessToken: string | null = null

export function getAccessToken(): string | null {
  return _accessToken
}

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('prosubx_refresh_token')
}

export function setRefreshToken(token: string | null): void {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('prosubx_refresh_token', token)
    } else {
      localStorage.removeItem('prosubx_refresh_token')
    }
  }
}

export function clearTokens(): void {
  _accessToken = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('prosubx_refresh_token')
  }
}
