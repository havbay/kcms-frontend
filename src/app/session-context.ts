import type { AuthUser } from '../api/client'

export type SessionState = {
  user: AuthUser | null
  status: 'checking' | 'signed-in' | 'signed-out'
  signIn: (token: string, user: AuthUser) => void
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}
