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
  ]
  const pending = [content.dashNavPage, content.dashNavTeam, content.dashNavSettings]

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
        <div className="dash-pagebar">
          <span aria-hidden="true" className="dash-dot" />
          <strong>{content.dashPageStatus}</strong>
          <span>{content.dashPageConnected}</span>
        </div>
        {children}
      </div>
    </div>
  )
}
