import { SignIn, SignUp } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

type Props = { mode: 'sign-in' | 'sign-up' }

export function ClerkAuthPage({ mode }: Props) {
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) return <Navigate replace to="/sign-in" />
  return (
    <div className="clerk-auth-shell">
      {mode === 'sign-in'
        ? <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/app" />
        : <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/app" />}
    </div>
  )
}
