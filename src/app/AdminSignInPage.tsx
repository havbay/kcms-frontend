import { ClerkAuthPage } from './ClerkAuthPage'
import type { Locale } from './copy'
import { SignInPage } from './SignInPage'

type Props = { locale: Locale; setLocale: (locale: Locale) => void }

export function AdminSignInPage({ locale, setLocale }: Props) {
  if (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return <ClerkAuthPage admin locale={locale} mode="sign-in" />
  }
  // Local development keeps the same email test seam, but still lands in the
  // admin console after a successful admin-allowlisted sign-in.
  return <SignInPage locale={locale} redirectTo="/admin/overview" setLocale={setLocale} />
}
