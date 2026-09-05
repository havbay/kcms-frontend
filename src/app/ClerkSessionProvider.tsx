import { useAuth, useUser } from '@clerk/clerk-react'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { exchangeClerkSession, setSessionToken, type AuthUser } from '../api/client'
import { SessionContext } from './session'

export function ClerkSessionProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const [kcmsUser, setKcmsUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<'checking' | 'signed-in' | 'signed-out'>('checking')

  useEffect(() => {
    let cancelled = false
    if (!isLoaded) return
    if (!isSignedIn) {
      queueMicrotask(() => {
        if (cancelled) return
        setSessionToken(null)
        setKcmsUser(null)
        setStatus('signed-out')
      })
      return
    }
    void getToken().then((token) => {
      if (!token) throw new Error('Clerk did not provide a session token')
      return exchangeClerkSession(token)
    }).then((session) => {
      if (cancelled) return
      setSessionToken(session.token)
      setKcmsUser(session.user)
      setStatus('signed-in')
    }).catch(() => {
      if (!cancelled) setStatus('signed-out')
    })
    return () => { cancelled = true }
  }, [getToken, isLoaded, isSignedIn, user?.id])

  const value = useMemo(() => ({
    user: kcmsUser,
    status,
    signIn: () => {},
    signOut: async () => { setSessionToken(null); setKcmsUser(null); setStatus('signed-out') },
    refresh: async () => {},
  }), [kcmsUser, status])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
