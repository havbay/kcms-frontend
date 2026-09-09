import { useAuth, useClerk, useUser } from '@clerk/clerk-react'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { ApiError, exchangeAdminClerkSession, exchangeClerkSession, setSessionToken, signOut as apiSignOut, type AuthUser } from '../api/client'
import { SessionContext } from './session'

export function ClerkSessionProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { signOut: clerkSignOut } = useClerk()
  const { user } = useUser()
  const location = useLocation()
  const navigate = useNavigate()
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
    const isAdminRoute = location.pathname.startsWith('/admin')
    // A customer session may still be in memory while the URL changes to the
    // admin area. Hold the admin guard in a checking state until the dedicated
    // exchange decides which kind of session this Clerk identity may have.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('checking')
    void getToken().then((token) => {
      if (!token) throw new Error('Clerk did not provide a session token')
      return isAdminRoute ? exchangeAdminClerkSession(token) : exchangeClerkSession(token)
    }).then((session) => {
      if (cancelled) return
      setSessionToken(session.token)
      setKcmsUser(session.user)
      setStatus('signed-in')
    }).catch(async (error) => {
      // A valid customer Clerk identity is not an admin identity. End the
      // Clerk session after that explicit refusal so the admin sign-in page
      // does not repeatedly retry the rejected account.
      if (isAdminRoute && error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await clerkSignOut()
      }
      if (!cancelled) {
        setSessionToken(null)
        setKcmsUser(null)
        setStatus('signed-out')
      }
    })
    return () => { cancelled = true }
  }, [clerkSignOut, getToken, isLoaded, isSignedIn, location.pathname, user?.id])

  const value = useMemo(() => ({
    user: kcmsUser,
    status,
    signIn: () => {},
    signOut: async () => {
      try {
        await apiSignOut()
      } catch {
        // A missing/expired KCMS session must not keep the Clerk identity alive.
      }
      await clerkSignOut()
      setSessionToken(null)
      setKcmsUser(null)
      setStatus('signed-out')
      navigate('/', { replace: true })
    },
    refresh: async () => {},
  }), [clerkSignOut, kcmsUser, navigate, status])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
