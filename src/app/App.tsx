import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import type { Locale } from './copy'
import { AdminLayout } from './AdminLayout'
import { AdminSignInPage } from './AdminSignInPage'
import { AdminAccessPage } from './AdminAccessPage'
import { AdminAuditPage } from './AdminAuditPage'
import { AdminIntegrationsPage } from './AdminIntegrationsPage'
import { AdminOverviewPage } from './AdminOverviewPage'
import { AdminPlansPage } from './AdminPlansPage'
import { AdminRequestsPage } from './AdminRequestsPage'
import { AdminWorkspacePage } from './AdminWorkspacePage'
import { AdminWorkspacesPage } from './AdminWorkspacesPage'
import { AutomatedRepliesPage } from './AutomatedRepliesPage'
import { ConnectPage } from './ConnectPage'
import { ClerkAuthPage } from './ClerkAuthPage'
import { DashboardLayout } from './DashboardLayout'
import { JoinPage } from './JoinPage'
import { LandingPage } from './LandingPage'
import { ModeratePage } from './ModeratePage'
import { NoticePage } from './NoticePage'
import { ProfilePage } from './ProfilePage'
import { SettingsPage } from './SettingsPage'
import { RequireSession } from './RequireSession'
import { RulesPage } from './RulesPage'
import { SignInPage } from './SignInPage'
import { OverviewPage } from './OverviewPage'
import { RequestAccessPage } from './RequestAccessPage'
import { SetupPage } from './SetupPage'

const LOCALE_KEY = 'kcms.locale'

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY)
    // A visitor who explicitly picked English keeps English. Nobody has
    // said anything yet is the only case that falls back to Khmer.
    return stored === 'en' || stored === 'km' ? stored : 'km'
  } catch {
    return 'km'
  }
}

export function App() {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale)

  function setLocale(next: Locale) {
    setLocaleState(next)
    try {
      localStorage.setItem(LOCALE_KEY, next)
    } catch {
      // Private browsing: the in-memory choice still works for this tab.
    }
  }

  const shared = { locale, setLocale }

  const dashboard = (children: React.ReactNode) => (
    <RequireSession locale={locale}>
      <DashboardLayout {...shared}>{children}</DashboardLayout>
    </RequireSession>
  )

  return (
    <Routes>
      <Route path="/" element={<LandingPage {...shared} />} />

      <Route path="/app" element={dashboard(<OverviewPage locale={locale} />)} />
      <Route path="/app/moderate" element={dashboard(<ModeratePage locale={locale} />)} />
      <Route path="/app/connect" element={dashboard(<ConnectPage locale={locale} />)} />
      {/* Older shared links land on the same merged screen. */}
      <Route path="/app/team" element={<Navigate replace to="/app/connect" />} />
      <Route path="/app/rules" element={dashboard(<RulesPage locale={locale} />)} />
      <Route path="/app/automated-replies" element={dashboard(<AutomatedRepliesPage locale={locale} />)} />
      <Route path="/app/settings" element={dashboard(<SettingsPage locale={locale} />)} />
      <Route path="/app/profile" element={dashboard(<ProfilePage {...shared} />)} />
      <Route path="/join/:token" element={<JoinPage {...shared} />} />
      <Route path="/setup/:token" element={<SetupPage {...shared} />} />
      <Route path="/admin/sign-in/*" element={<AdminSignInPage {...shared} />} />
      <Route path="/admin" element={<AdminLayout {...shared} />}>
        <Route index element={<Navigate replace to="/admin/overview" />} />
        <Route path="overview" element={<AdminOverviewPage locale={locale} />} />
        <Route path="workspaces" element={<AdminWorkspacesPage locale={locale} />} />
        <Route path="workspaces/:workspaceId" element={<AdminWorkspacePage locale={locale} />} />
        <Route path="integrations" element={<AdminIntegrationsPage locale={locale} />} />
        <Route path="plans" element={<AdminPlansPage locale={locale} />} />
        <Route path="audit-log" element={<AdminAuditPage locale={locale} />} />
        <Route path="access" element={<AdminAccessPage locale={locale} />} />
        {/* Kept as a direct link for old operator bookmarks, but removed from
            the navigation because registration is self-serve. */}
        <Route path="requests" element={<AdminRequestsPage {...shared} />} />
      </Route>

      {/* Older shared links kept working. */}
      <Route path="/moderate" element={<Navigate replace to="/app/moderate" />} />

      <Route path="/request-access" element={<RequestAccessPage {...shared} />} />
      {/* Clerk uses nested callback paths during verification and SSO. Keep
          those paths inside the auth surface instead of sending them to the
          generic not-found page. */}
      <Route path="/sign-in/*" element={<SignInPage {...shared} />} />
      <Route path="/sign-up/*" element={<ClerkAuthPage mode="sign-up" />} />
      {/* Never leave a route blank: the SPA rewrite makes every path return 200. */}
      <Route path="*" element={<NoticePage kind="not-found" {...shared} />} />
    </Routes>
  )
}
