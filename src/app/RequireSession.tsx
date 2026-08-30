import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { copy, type Locale } from './copy'
import { useSession } from './session'

/** Guards the dashboard. Renders nothing decisive while the stored token is
 *  still being checked, so a signed-in visitor is never bounced to sign-in on
 *  a refresh. */
export function RequireSession({ children, locale }: { children: ReactNode; locale: Locale }) {
  const session = useSession()
  if (session.status === 'checking') {
    return <p className="work-status" role="status">{copy[locale].modLoading}</p>
  }
  if (session.status === 'signed-out') return <Navigate replace to="/sign-in" />
  return <>{children}</>
}
