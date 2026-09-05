import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Link } from 'react-router-dom'

import { getSettings, listFacebookConnections, type PageConnections } from '../api/client'
import { copy, type Locale } from './copy'
import { useSession } from './session'

type DashboardLayoutProps = {
  locale: Locale
  setLocale: (locale: Locale) => void
  children: ReactNode
}

function NavIcon({ type }: { type: 'overview' | 'moderate' | 'connect' | 'rules' | 'team' | 'settings' | 'admin' | 'chevron' }) {
  if (type === 'chevron') {
    return (
      <svg aria-hidden="true" className="dash-nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6" />
      </svg>
    )
  }
  if (type === 'overview') {
    return (
      <svg aria-hidden="true" className="dash-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    )
  }
  if (type === 'moderate') {
    return (
      <svg aria-hidden="true" className="dash-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    )
  }
  if (type === 'connect') {
    return (
      <svg aria-hidden="true" className="dash-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    )
  }
  if (type === 'rules') {
    return (
      <svg aria-hidden="true" className="dash-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m4.9 4.9 14.2 14.2" />
      </svg>
    )
  }
  if (type === 'team') {
    return (
      <svg aria-hidden="true" className="dash-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }
  if (type === 'settings') {
    return (
      <svg aria-hidden="true" className="dash-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  return (
    <svg aria-hidden="true" className="dash-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  )
}

function getInitials(name?: string): string {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function DashboardLayout({ locale, setLocale, children }: DashboardLayoutProps) {
  const content = copy[locale]
  const session = useSession()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [workspaceName, setWorkspaceName] = useState<string>('')
  // The plan belongs to the workspace, not the screen, so the account card
  // carries it everywhere. It is left out entirely rather than guessed at when
  // it cannot be read.
  const [plan, setPlan] = useState<PageConnections['plan'] | null>(null)
  const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null)
  const [trialExpired, setTrialExpired] = useState(false)

  useEffect(() => {
    let mounted = true
    getSettings().then((settings) => {
      if (!mounted) return
      setWorkspaceName(settings.workspace_name)
      const expiresAt = settings.plan === 'TRIAL' ? settings.trial_expires_at : null
      setTrialExpiresAt(expiresAt)
      setTrialExpired(Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now()))
    }).catch(() => {
      // ignore
    })
    return () => {
      mounted = false
    }
  }, [session.user])

  useEffect(() => {
    let mounted = true
    listFacebookConnections().then((found) => {
      if (mounted) setPlan(found.plan ?? null)
    }).catch(() => {
      if (mounted) setPlan(null)
    })
    return () => {
      mounted = false
    }
  }, [session.user])

  const built = [
    { to: '/app', label: content.dashNavOverview, icon: 'overview' as const, end: true },
    { to: '/app/moderate', label: content.dashNavModerate, icon: 'moderate' as const, end: false },
    { to: '/app/connect', label: content.dashNavPage, icon: 'connect' as const, end: false },
    { to: '/app/rules', label: content.dashNavRules, icon: 'rules' as const, end: false },
    { to: '/app/settings', label: content.dashNavSettings, icon: 'settings' as const, end: false },
  ]
  const pending: string[] = []

  return (
    <div className={`site dashboard ${mobileNavOpen ? 'is-nav-open' : ''}`} lang={locale === 'km' ? 'km' : 'en'}>
      {/* Mobile Header Bar */}
      <div className="dash-mobile-header">
        <button
          aria-expanded={mobileNavOpen}
          aria-label="Toggle navigation menu"
          className="dash-mobile-toggle"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          type="button"
        >
          <span className="mobile-toggle-bar" />
          <span className="mobile-toggle-bar" />
          <span className="mobile-toggle-bar" />
        </button>
        <Link aria-label="KCMS home" className="brand" to="/app">
          <span aria-hidden="true" className="brand-mark"><span /><span /></span>
          <span>KCMS</span>
        </Link>
        <button
          aria-pressed={locale === 'km'}
          className="language-toggle dash-language-compact"
          onClick={() => setLocale(locale === 'en' ? 'km' : 'en')}
          type="button"
        >
          <img alt="" aria-hidden="true" className="language-flag"
               src={locale === 'en' ? '/flags/kh.svg' : '/flags/gb.svg'} />
        </button>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileNavOpen && (
        <div
          aria-hidden="true"
          className="dash-mobile-backdrop"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside className={`dash-sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="dash-sidebar-header">
          <Link aria-label="KCMS home" className="brand" to="/">
            <span aria-hidden="true" className="brand-mark"><span /><span /></span>
            <span>KCMS</span>
          </Link>
          <div className="dash-workspace-badge">
            <span className="dash-workspace-dot" />
            <span className="dash-workspace-title">{workspaceName || content.dashWorkspace}</span>
          </div>
        </div>

        <nav aria-label={content.dashWorkspace} className="dash-nav">
          {built.map((item) => (
            <NavLink
              className={({ isActive }) => `dash-nav-link${isActive ? ' is-active' : ''}`}
              end={item.end}
              key={item.to}
              onClick={() => setMobileNavOpen(false)}
              to={item.to}
            >
              <NavIcon type={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          {session.user?.is_platform_admin && (
            <NavLink
              className={({ isActive }) => `dash-nav-link is-admin${isActive ? ' is-active' : ''}`}
              onClick={() => setMobileNavOpen(false)}
              to="/admin/requests"
            >
              <NavIcon type="admin" />
              <span>{content.navAdmin}</span>
            </NavLink>
          )}
          {pending.map((label) => (
            <span aria-disabled="true" className="dash-nav-link is-pending" key={label}>
              <span>{label}</span>
              <small>{content.dashNotBuilt}</small>
            </span>
          ))}
        </nav>

        <div className="dash-account-card">
          {session.user && (
            <NavLink
              className={({ isActive }) => `dash-user-profile${isActive ? ' is-active' : ''}`}
              onClick={() => setMobileNavOpen(false)}
              title={content.dashNavProfile}
              to="/app/profile"
            >
              <div className="dash-user-avatar">
                {getInitials(session.user.display_name)}
              </div>
              <div className="dash-user-meta">
                <strong className="dash-user-name" title={session.user.display_name}>
                  {session.user.display_name}
                </strong>
                <span className="dash-user-tags">
                  <span className="dash-user-role">
                    {session.user.is_platform_admin ? 'Admin' : 'Owner'}
                  </span>
                  {plan && (
                    <span className="dash-user-plan" data-plan={plan} title={content.proPlan}>
                      {plan === 'GROWTH' ? content.proPlanGrowth : content.proPlanStarter}
                    </span>
                  )}
                </span>
              </div>
              <NavIcon type="chevron" />
            </NavLink>
          )}

          <div className="dash-account-actions">
            <button
              aria-pressed={locale === 'km'}
              className="language-toggle dash-language"
              onClick={() => setLocale(locale === 'en' ? 'km' : 'en')}
              type="button"
            >
              <img alt="" aria-hidden="true" className="language-flag"
                   src={locale === 'en' ? '/flags/kh.svg' : '/flags/gb.svg'} />
              <span>{content.language}</span>
            </button>
            <button className="text-link dash-signout" onClick={() => void session.signOut()} type="button">
              {content.authSignOut}
            </button>
          </div>
        </div>
      </aside>

      <div className="dash-main">
        {trialExpiresAt && (
          <div className={`trial-banner${trialExpired ? ' is-expired' : ''}`} role="status">
            {trialExpired
              ? content.trialExpired
              : `${content.trialActive} · ${new Date(trialExpiresAt).toLocaleDateString()}`}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
