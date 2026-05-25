const SESSION_KEY = 'nn_session_token'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SESSION_KEY)
}

export function storeToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, token)
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}

export function generateToken(): string {
  return crypto.randomUUID()
}