import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import {
  type AuthUser,
  getCurrentUser,
  getSessionToken,
  setSessionToken,
  signOut as apiSignOut,
} from '../api/client'

type SessionState = {
  user: AuthUser | null
  status: 'checking' | 'signed-in' | 'signed-out'
  signIn: (token: string, user: AuthUser) => void
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<SessionState['status']>('checking')

  const restore = useCallback(async () => {
    if (!getSessionToken()) {
      setStatus('signed-out')
      return
    }
    try {
      setUser(await getCurrentUser())
      setStatus('signed-in')
    } catch {
      // Expired or revoked: drop the stale token rather than retrying forever.
      setSessionToken(null)
      setStatus('signed-out')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void restore()
  }, [restore])

  const value = useMemo<SessionState>(
    () => ({
      user,
      status,
      signIn: (token, nextUser) => {
        setSessionToken(token)
        setUser(nextUser)
        setStatus('signed-in')
      },
      signOut: async () => {
        await apiSignOut()
        setUser(null)
        setStatus('signed-out')
      },
    }),
    [user, status],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionState {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used inside SessionProvider')
  return context
}
