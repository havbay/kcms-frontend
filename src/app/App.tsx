import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import type { Locale } from './copy'
import { AdminRequestsPage } from './AdminRequestsPage'
import { ConnectPage } from './ConnectPage'
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

export function App() {
  const [locale, setLocale] = useState<Locale>('en')
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
      <Route path="/app/settings" element={dashboard(<SettingsPage locale={locale} />)} />
      <Route path="/app/profile" element={dashboard(<ProfilePage {...shared} />)} />
      <Route path="/join/:token" element={<JoinPage {...shared} />} />
      <Route path="/setup/:token" element={<SetupPage {...shared} />} />
      <Route path="/admin/requests" element={<AdminRequestsPage {...shared} />} />

      {/* Older shared links kept working. */}
      <Route path="/moderate" element={<Navigate replace to="/app/moderate" />} />

      <Route path="/request-access" element={<RequestAccessPage {...shared} />} />
      <Route path="/sign-in" element={<SignInPage {...shared} />} />
      {/* Never leave a route blank: the SPA rewrite makes every path return 200. */}
      <Route path="*" element={<NoticePage kind="not-found" {...shared} />} />
    </Routes>
  )
}
