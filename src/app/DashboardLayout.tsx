import type { ReactNode } from 'react'
import { NavLink, Link } from 'react-router-dom'

import { copy, type Locale } from './copy'
import { useSession } from './session'

type DashboardLayoutProps = {
  locale: Locale
  setLocale: (locale: Locale) => void
  children: ReactNode
}

export function DashboardLayout({ locale, setLocale, children }: DashboardLayoutProps) {
  const content = copy[locale]
  const session = useSession()

  // Only Overview and Moderate are built. The rest are shown so the shape of
  // the product is legible, and marked so nobody mistakes them for working.
  const built = [
    { to: '/app', label: content.dashNavOverview, end: true },
    { to: '/app/moderate', label: content.dashNavModerate, end: false },
    { to: '/app/connect', label: content.dashNavPage, end: false },
    { to: '/app/team', label: content.dashNavTeam, end: false },
  ]
  const pending = [content.dashNavSettings]

  return (
    <div className="site dashboard" lang={locale === 'km' ? 'km' : 'en'}>
      <aside className="dash-sidebar">
        <Link aria-label="KCMS home" className="brand" to="/">
          <span aria-hidden="true" className="brand-mark"><span /><span /></span>
          <span>KCMS</span>
        </Link>
        <p className="dash-workspace">{content.dashWorkspace}</p>

        <nav aria-label={content.dashWorkspace} className="dash-nav">
          {built.map((item) => (
            <NavLink
              className={({ isActive }) => `dash-nav-link${isActive ? ' is-active' : ''}`}
              end={item.end}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
          {session.user?.is_platform_admin && (
            <NavLink
              className={({ isActive }) => `dash-nav-link is-admin${isActive ? ' is-active' : ''}`}
              to="/admin/requests"
            >
              {content.navAdmin}
            </NavLink>
          )}
          {pending.map((label) => (
            <span aria-disabled="true" className="dash-nav-link is-pending" key={label}>
              {label}
              <small>{content.dashNotBuilt}</small>
            </span>
          ))}
        </nav>

        <div className="dash-account">
          {session.user && (
            <p className="dash-user">
              <span>{content.authSignedInAs}</span>
              <strong>{session.user.display_name}</strong>
            </p>
          )}
          <button className="text-link dash-signout" onClick={() => void session.signOut()} type="button">
            {content.authSignOut}
          </button>
        </div>

        <button
          aria-pressed={locale === 'km'}
          className="language-toggle dash-language"
          onClick={() => setLocale(locale === 'en' ? 'km' : 'en')}
          type="button"
        >
          <img alt="" aria-hidden="true" className="language-flag"
               src={locale === 'en' ? '/flags/kh.svg' : '/flags/gb.svg'} />
          {content.language}
        </button>
      </aside>

      <div className="dash-main">
        {/* Option C: signing up is open, connecting a real Page is gated. The
            product has to say so, or "your workspace" is a claim it cannot keep. */}
        <div className="dash-sandbox">
          <span aria-hidden="true" className="dash-dot" />
          <p>
            <strong>{content.sandboxTitle}</strong> {content.sandboxBody}
          </p>
          <Link className="button button-small" to="/app/connect">{content.sandboxCta}</Link>
        </div>
        {children}
      </div>
    </div>
  )
}
