import { SignIn, SignUp } from '@clerk/clerk-react'
import { Link, Navigate } from 'react-router-dom'

import { copy, type Locale } from './copy'

type Props = { mode: 'sign-in' | 'sign-up'; admin?: boolean; locale?: Locale }

export function ClerkAuthPage({ mode, admin = false, locale = 'en' }: Props) {
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) return <Navigate replace to="/sign-in" />
  const content = copy[locale]
  if (admin) {
    return (
      <div className="clerk-auth-shell admin-clerk-auth-shell" lang={locale === 'km' ? 'km' : 'en'}>
        <div className="admin-auth-card">
          <Link aria-label="KCMS home" className="brand admin-auth-brand" to="/">
            <span aria-hidden="true" className="brand-mark"><span /><span /></span>
            <span>KCMS</span>
          </Link>
          <div className="admin-auth-heading">
            <span className="admin-console-label"><span className="admin-console-dot" />{content.adminConsole}</span>
            <h1>{content.adminSignInTitle}</h1>
            <p>{content.adminSignInLead}</p>
          </div>
          <SignIn routing="path" path="/admin/sign-in" fallbackRedirectUrl="/admin/overview" />
          <Link className="admin-auth-back" to="/sign-in">{content.adminBackToClient}</Link>
        </div>
      </div>
    )
  }
  return (
    <div className="clerk-auth-shell">
      {mode === 'sign-in'
        ? <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/app" />
        : <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/app" />}
    </div>
  )
}
