import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import {
  type AuthUser,
  getCurrentUser,
  getSessionToken,
  setSessionToken,
  signOut as apiSignOut,
} from '../api/client'

import type { SessionState } from './session-context'

export const SessionContext = createContext<SessionState | null>(null)

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
      refresh: async () => {
        try {
          setUser(await getCurrentUser())
        } catch {
          // A failed refresh must not sign anyone out; the session may be fine.
        }
      },
    }),
    [user, status],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionState {
  const context = useContext(SessionContext)
  if (!context) {
    return {
      user: null,
      status: 'signed-out',
      signIn: () => {},
      signOut: async () => {},
      refresh: async () => {},
    }
  }
  return context
}
