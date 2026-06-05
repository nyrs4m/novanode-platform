const SESSION_KEY = 'nn_session_token'

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    localStorage.setItem('__test__', '1')
    localStorage.removeItem('__test__')
    return localStorage
  } catch {
    try {
      return sessionStorage
    } catch {
      return null
    }
  }
}

export function getStoredToken(): string | null {
  try {
    const storage = getStorage()
    if (!storage) return null
    return storage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function storeToken(token: string): void {
  try {
    const storage = getStorage()
    if (!storage) return
    storage.setItem(SESSION_KEY, token)
  } catch {
    // Silent fail — session will be re-established from DB
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {}
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {}
}

export function generateToken(): string {
  return crypto.randomUUID()
}