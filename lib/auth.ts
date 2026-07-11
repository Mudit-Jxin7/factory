export type UserRole = 'admin' | 'worker'

export const AUTH_CREDENTIALS: Record<UserRole, { username: string; password: string }> = {
  admin: {
    username: process.env.NEXT_PUBLIC_LOGIN_USERNAME || 'admin',
    password: process.env.NEXT_PUBLIC_LOGIN_PASSWORD || 'admin123',
  },
  worker: {
    username: process.env.NEXT_PUBLIC_WORKER_USERNAME || 'staff1',
    password: process.env.NEXT_PUBLIC_WORKER_PASSWORD || 'welcome000',
  },
}

export function authenticate(username: string, password: string, role: UserRole): boolean {
  const creds = AUTH_CREDENTIALS[role]
  return username === creds.username && password === creds.password
}

export function setAuthSession(role: UserRole) {
  localStorage.setItem('isAuthenticated', 'true')
  localStorage.setItem('userRole', role)
}

export function clearAuthSession() {
  localStorage.removeItem('isAuthenticated')
  localStorage.removeItem('userRole')
}

export function getUserRole(): UserRole | null {
  if (typeof window === 'undefined') return null
  const role = localStorage.getItem('userRole')
  return role === 'admin' || role === 'worker' ? role : null
}

export const WORKER_ALLOWED_PREFIXES = ['/worker']

export function isWorkerAllowedPath(pathname: string): boolean {
  return WORKER_ALLOWED_PREFIXES.some(prefix => pathname.startsWith(prefix))
}
