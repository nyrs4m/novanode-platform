const SESSION_KEY = 'nn_session_token'

type SessionScope = {
  restaurantSlug: string
  tableNumber: string
}

function getSessionKey(scope?: SessionScope): string {
  if (!scope) return SESSION_KEY
  return `${SESSION_KEY}_${scope.restaurantSlug}_table_${scope.tableNumber}`
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    localStorage.setItem('__test__', '1')
    localStorage.removeItem('__test__')
    return localStorage
  } catch {
    return null
  }
}

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    sessionStorage.setItem('__test__', '1')
    sessionStorage.removeItem('__test__')
    return sessionStorage
  } catch {
    return null
  }
}

export function getStoredToken(scope?: SessionScope): string | null {
  const key = getSessionKey(scope)
  try {
    const token = getLocalStorage()?.getItem(key)
    if (token) return token
  } catch {}
  try {
    return getSessionStorage()?.getItem(key) ?? null
  } catch {}
  return null
}

export function storeToken(token: string, scope?: SessionScope): void {
  const key = getSessionKey(scope)
  try {
    const storage = getLocalStorage()
    if (storage) {
      storage.setItem(key, token)
      return
    }
  } catch {}
  try {
    getSessionStorage()?.setItem(key, token)
  } catch {}
}

export function clearToken(scope?: SessionScope): void {
  const key = getSessionKey(scope)
  try {
    localStorage.removeItem(key)
    if (!scope) {
      Object.keys(localStorage)
        .filter((storageKey) => storageKey.startsWith(`${SESSION_KEY}_`))
        .forEach((storageKey) => localStorage.removeItem(storageKey))
    }
  } catch {}
  try {
    sessionStorage.removeItem(key)
    if (!scope) {
      Object.keys(sessionStorage)
        .filter((storageKey) => storageKey.startsWith(`${SESSION_KEY}_`))
        .forEach((storageKey) => sessionStorage.removeItem(storageKey))
    }
  } catch {}
}

export function generateToken(): string {
  return crypto.randomUUID()
}
