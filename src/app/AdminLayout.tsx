import { useState } from 'react'
import { Link, NavLink, Outlet, Navigate } from 'react-router-dom'

import { Icon, initialsOf } from './ui'
import { copy, type Locale } from './copy'
import { useSession } from './session'

type Props = { locale: Locale; setLocale: (locale: Locale) => void }

const navigation = [
  { to: '/admin/overview', label: 'adminOverview', icon: 'building' as const, end: true },
  { to: '/admin/workspaces', label: 'adminWorkspaces', icon: 'users' as const, end: false },
  { to: '/admin/integrations', label: 'adminIntegrations', icon: 'link' as const, end: false },
  { to: '/admin/plans', label: 'adminPlans', icon: 'star' as const, end: false },
  { to: '/admin/audit-log', label: 'adminAudit', icon: 'clock' as const, end: false },
  { to: '/admin/access', label: 'adminAccess', icon: 'key' as const, end: false },
]

export function AdminLayout({ locale, setLocale }: Props) {
  const content = copy[locale]
  const session = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (session.status === 'checking') return <p className="work-status" role="status">{content.modLoading}</p>
  if (session.status === 'signed-out') return <Navigate replace to="/sign-in" />
  if (!session.user?.is_platform_admin) return <Navigate replace to="/app" />

  return (
    <div className={`site admin-v2${mobileOpen ? ' is-nav-open' : ''}`} lang={locale === 'km' ? 'km' : 'en'}>
      <header className="admin-mobile-header">
        <button
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? content.adminCloseMenu : content.adminOpenMenu}
          className="admin-menu-toggle"
          onClick={() => setMobileOpen((open) => !open)}
          type="button"
        >
          <span /><span /><span />
        </button>
        <Link aria-label="KCMS home" className="brand" to="/admin/overview">
          <span aria-hidden="true" className="brand-mark"><span /><span /></span>
          <span>KCMS</span>
        </Link>
        <button
          aria-label={content.language}
          aria-pressed={locale === 'km'}
          className="language-toggle"
          onClick={() => setLocale(locale === 'en' ? 'km' : 'en')}
          type="button"
        >
          <img alt="" aria-hidden="true" className="language-flag" src={locale === 'en' ? '/flags/kh.svg' : '/flags/gb.svg'} />
        </button>
      </header>

      {mobileOpen && <div aria-hidden="true" className="admin-backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Link aria-label="KCMS home" className="brand" to="/admin/overview">
            <span aria-hidden="true" className="brand-mark"><span /><span /></span>
            <span>KCMS</span>
          </Link>
          <div className="admin-console-label">
            <span className="admin-console-dot" />
            <span>{content.adminConsole}</span>
          </div>
        </div>

        <nav aria-label={content.adminNavigation} className="admin-navigation">
          <p className="admin-nav-kicker">{content.adminNavigation}</p>
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}
              end={item.end}
              key={item.to}
              onClick={() => setMobileOpen(false)}
              to={item.to}
            >
              <Icon className="admin-nav-icon" name={item.icon} />
              <span>{content[item.label as keyof typeof content] as string}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link className="admin-client-link" onClick={() => setMobileOpen(false)} to="/app">
            <Icon className="admin-nav-icon" name="arrowRight" />
            <span>{content.adminClientWorkspace}</span>
          </Link>
          <div className="admin-user-card">
            <span className="ws-avatar" aria-hidden="true">{initialsOf(session.user.display_name)}</span>
            <span className="admin-user-copy">
              <strong>{session.user.display_name}</strong>
              <small>{content.adminRole}</small>
            </span>
          </div>
          <div className="admin-sidebar-actions">
            <button
              aria-pressed={locale === 'km'}
              className="language-toggle"
              onClick={() => setLocale(locale === 'en' ? 'km' : 'en')}
              type="button"
            >
              <img alt="" aria-hidden="true" className="language-flag" src={locale === 'en' ? '/flags/kh.svg' : '/flags/gb.svg'} />
              <span>{content.language}</span>
            </button>
            <button className="text-link" onClick={() => void session.signOut()} type="button">{content.authSignOut}</button>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <span className="admin-topbar-overline">{content.adminConsole}</span>
            <span className="admin-topbar-separator">/</span>
            <span>{content.adminOperations}</span>
          </div>
          <span className="admin-secure-pill"><Icon name="shield" />{content.adminSecure}</span>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
