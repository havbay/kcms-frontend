import { useCallback, useEffect, useState } from 'react'

import {
  ApiError,
  connectFacebookPageManually,
  disconnectFacebookPage,
  listFacebookConnections,
  listFacebookPageChoices,
  type PageChoice,
  type PageConnection,
  type PageConnections,
  selectFacebookPage,
  startFacebookAuthorization,
} from '../api/client'
import { copy, type Locale } from './copy'

type ConnectPageProps = { locale: Locale }
type LoadState = 'loading' | 'ready' | 'error'

const text = {
  en: {
    title: 'Connect your Facebook Pages', lead: 'Authorize a Page so KCMS can receive comments and carry out the actions you approve.',
    connectedPagesTitle: 'Connected Pages',
    pagesUsage: (used: number, limit: number) => `${used} of ${limit} Pages connected`,
    atCapTitle: 'You have reached your plan’s Page limit.',
    atCapBody: 'Disconnect a Page below, or upgrade your plan to connect more.',
    upgradeCta: 'View plans',
    recommended: 'Recommended', facebook: 'Continue with Facebook', facebookHelp: 'Sign in to Meta, choose an authorized Page, then confirm the connection.',
    advanced: 'Connect with Page token', advancedHelp: 'Advanced setup for testing or assisted connection.', token: 'Page access token',
    tokenHint: 'Sent securely to KCMS for validation. The full token is never shown again.', validate: 'Validate and connect', connecting: 'Connecting…',
    choose: 'Choose the Facebook Page to connect', chooseHelp: 'Only Pages returned by your Meta authorization are available.', confirm: 'Connect selected Page',
    connected: 'Page connected', facebookMethod: 'Connected with Facebook', tokenMethod: 'Connected with Page token', ready: 'Ready to moderate',
    permissionWarning: 'Connected, but the token does not include a moderation task.', syncWaiting: 'Waiting for first synchronization', lastSync: 'Last synchronized',
    connectedAt: 'Connected', method: 'Connection method', capability: 'Moderation access', disconnect: 'Disconnect Page', disconnecting: 'Disconnecting…',
    tokenTitle: 'Connect with a Page access token',
    tokenLead: 'Paste a Page access token for the Page you want KCMS to moderate. KCMS confirms it with Meta, stores it encrypted, and never shows it again.',
    planCapacityTitle: 'Workspace Capacity & Plan',
    planSubtitle: (plan: string, used: number, limit: number) => `${plan} tier · ${used} of ${limit} slots in use`,
    starterBadge: 'Starter Plan · 3 Pages',
    growthBadge: 'Growth Plan · 10 Pages',
    starterSubtitle: 'Up to 3 Facebook Page connections included in your workspace.',
    growthSubtitle: 'Up to 10 Facebook Page connections with priority moderation.',
    upgradeToGrowthCta: 'Upgrade to Growth (10 Pages)',
    addConnectionTitle: 'Connect a Facebook Page',
    slotsLeft: (count: number) => `${count} page slot${count === 1 ? '' : 's'} remaining on your plan`,
    availableSlot: 'Available Page Slot',
    availableSlotDesc: 'Ready to connect another Facebook Page to your workspace moderation pool.',
    directOAuth: 'Direct Meta Login',
    oauthFeature1: 'Direct authentication through Meta',
    oauthFeature2: 'Automatic Page discovery and permissions',
    oauthFeature3: 'Seamless one-click connection without copying keys',
    oauthErrors: {
      denied: 'The Facebook authorization was cancelled, so no Page was connected.',
      incomplete: 'Facebook did not complete the authorization. Please try again.',
      state_invalid: 'That authorization did not match this session. Start again from this page.',
      state_expired: 'The authorization took too long and expired. Please try again.',
      exchange_failed: 'Facebook rejected the authorization. Check that this account has a role on the KCMS app, then try again.',
      no_pages: 'That Facebook account does not administer any Page. Sign in with an account that manages the Page you want KCMS to moderate.',
    },
    sessionExpired: 'That Facebook authorization has expired or was already used. Start again with Continue with Facebook.',
    retry: 'Try again', error: 'KCMS could not complete the connection. Check the authorization and try again.', facebookUnavailable: 'Facebook connection is not configured yet. Contact KCMS support.', noPages: 'Meta did not return an authorized Page for this account.',
  },
  km: {
    title: 'ភ្ជាប់ Facebook Page របស់អ្នក', lead: 'អនុញ្ញាត Page មួយ ដើម្បីឱ្យ KCMS ទទួលមតិយោបល់ និងអនុវត្តសកម្មភាពដែលអ្នកយល់ព្រម។',
    connectedPagesTitle: 'ទំព័រដែលបានភ្ជាប់',
    pagesUsage: (used: number, limit: number) => `${used} នៃ ${limit} ទំព័របានភ្ជាប់`,
    atCapTitle: 'អ្នកបានឈានដល់កម្រិតកំណត់ទំព័រនៃគម្រោងរបស់អ្នក។',
    atCapBody: 'សូមផ្ដាច់ Page មួយខាងក្រោម ឬដំឡើងគម្រោងរបស់អ្នកដើម្បីភ្ជាប់ច្រើនទៀត។',
    upgradeCta: 'មើលគម្រោង',
    recommended: 'បានណែនាំ', facebook: 'បន្តជាមួយ Facebook', facebookHelp: 'ចូល Meta ជ្រើស Page ដែលមានសិទ្ធិ រួចបញ្ជាក់ការភ្ជាប់។',
    advanced: 'ភ្ជាប់ដោយ Page token', advancedHelp: 'ការកំណត់កម្រិតខ្ពស់ សម្រាប់សាកល្បង ឬជំនួយពី KCMS។', token: 'Page access token',
    tokenHint: 'ផ្ញើដោយសុវត្ថិភាពទៅ KCMS ដើម្បីផ្ទៀងផ្ទាត់។ Token ពេញមិនត្រូវបង្ហាញម្តងទៀតទេ។', validate: 'ផ្ទៀងផ្ទាត់ និងភ្ជាប់', connecting: 'កំពុងភ្ជាប់…',
    choose: 'ជ្រើស Facebook Page ដើម្បីភ្ជាប់', chooseHelp: 'មានតែ Page ដែល Meta អនុញ្ញាតឱ្យអ្នកប៉ុណ្ណោះ។', confirm: 'ភ្ជាប់ Page ដែលបានជ្រើស',
    connected: 'បានភ្ជាប់ Page', facebookMethod: 'បានភ្ជាប់ជាមួយ Facebook', tokenMethod: 'បានភ្ជាប់ដោយ Page token', ready: 'អាចគ្រប់គ្រងមតិយោបល់បាន',
    permissionWarning: 'បានភ្ជាប់ ប៉ុន្តែ token មិនមានសិទ្ធិគ្រប់គ្រងមតិយោបល់ទេ។', syncWaiting: 'កំពុងរង់ចាំសមកាលកម្មដំបូង', lastSync: 'សមកាលកម្មចុងក្រោយ',
    connectedAt: 'បានភ្ជាប់', method: 'វិធីភ្ជាប់', capability: 'សិទ្ធិគ្រប់គ្រង', disconnect: 'ផ្ដាច់ Page', disconnecting: 'កំពុងផ្ដាច់…',
    tokenTitle: 'ភ្ជាប់ដោយ Page access token',
    tokenLead: 'បញ្ចូល Page access token សម្រាប់ Page ដែលអ្នកចង់ឱ្យ KCMS គ្រប់គ្រង។ KCMS ផ្ទៀងផ្ទាត់ជាមួយ Meta រក្សាទុកជាកូដសម្ងាត់ ហើយមិនបង្ហាញវាម្ដងទៀតទេ។',
    planCapacityTitle: 'សមត្ថភាពកន្លែងធ្វើការ & គម្រោង',
    planSubtitle: (plan: string, used: number, limit: number) => `គម្រោង ${plan} · ប្រើប្រាស់ ${used} នៃ ${limit} ចំនួនទំព័រ`,
    starterBadge: 'គម្រោង Starter · ៣ ទំព័រ',
    growthBadge: 'គម្រោង Growth · ១០ ទំព័រ',
    starterSubtitle: 'រួមបញ្ចូលការភ្ជាប់រហូតដល់ ៣ Facebook Pages សម្រាប់គ្រប់គ្រងមតិយោបល់។',
    growthSubtitle: 'ភ្ជាប់រហូតដល់ ១០ Facebook Pages ជាមួយអាទិភាពខ្ពស់។',
    upgradeToGrowthCta: 'ដំឡើងទៅ Growth ដើម្បីភ្ជាប់ ១០ ទំព័រ',
    addConnectionTitle: 'ភ្ជាប់ Facebook Page បន្ថែម',
    slotsLeft: (count: number) => `នៅសល់ ${count} ចំនួនទំព័រដែលអាចភ្ជាប់បាន`,
    availableSlot: 'កន្លែងទំនេរសម្រាប់ភ្ជាប់',
    availableSlotDesc: 'រួចរាល់ដើម្បីភ្ជាប់ Facebook Page មួយទៀតទៅក្នុងប្រព័ន្ធគ្រប់គ្រងមតិយោបល់។',
    directOAuth: 'ចូល Meta ផ្ទាល់',
    oauthFeature1: 'ការផ្ទៀងផ្ទាត់ដោយផ្ទាល់តាមរយៈ Meta',
    oauthFeature2: 'ស្វែងរក Page និងសិទ្ធិស្វ័យប្រវត្តិ',
    oauthFeature3: 'ភ្ជាប់ភ្លាមៗដោយមិនបាច់ចម្លងលេខកូដ Token',
    oauthErrors: {
      denied: 'ការអនុញ្ញាត Facebook ត្រូវបានបោះបង់ ដូច្នេះមិនមាន Page ត្រូវបានភ្ជាប់ទេ។',
      incomplete: 'Facebook មិនបានបញ្ចប់ការអនុញ្ញាតទេ។ សូមព្យាយាមម្ដងទៀត។',
      state_invalid: 'ការអនុញ្ញាតនេះមិនត្រូវនឹងវេនប្រើប្រាស់នេះទេ។ សូមចាប់ផ្ដើមពីទំព័រនេះម្ដងទៀត។',
      state_expired: 'ការអនុញ្ញាតយូរពេក ហើយផុតកំណត់។ សូមព្យាយាមម្ដងទៀត។',
      exchange_failed: 'Facebook បានបដិសេធការអនុញ្ញាត។ សូមពិនិត្យថាគណនីនេះមានតួនាទីលើកម្មវិធី KCMS ហើយព្យាយាមម្ដងទៀត។',
      no_pages: 'គណនី Facebook នេះមិនគ្រប់គ្រង Page ណាមួយទេ។ សូមចូលដោយគណនីដែលគ្រប់គ្រង Page ដែលអ្នកចង់ឱ្យ KCMS គ្រប់គ្រង។',
    },
    sessionExpired: 'ការអនុញ្ញាត Facebook នេះផុតកំណត់ ឬបានប្រើរួចហើយ។ សូមចាប់ផ្ដើមម្ដងទៀតដោយចុច Continue with Facebook។',
    retry: 'ព្យាយាមម្តងទៀត', error: 'KCMS មិនអាចបញ្ចប់ការភ្ជាប់បានទេ។ សូមពិនិត្យសិទ្ធិ ហើយព្យាយាមម្ដងទៀត។', facebookUnavailable: 'ការភ្ជាប់ Facebook មិនទាន់បានកំណត់ទេ។ សូមទាក់ទងជំនួយ KCMS។', noPages: 'Meta មិនបានផ្ដល់ Page ដែលមានសិទ្ធិសម្រាប់គណនីនេះទេ។',
  },
} as const

/** Facebook's own mark, inlined as SVG. A styled letter "f" only resembled it
 *  at a glance and rendered differently on machines lacking the font. */
function FacebookMark() {
  return (
    <svg aria-hidden="true" className="provider-mark" focusable="false" viewBox="0 0 24 24">
      <path
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 3.925 23.094 9.101 24v-8.437H6.627v-2.49h2.474V9.9c0-2.457 1.457-3.813 3.678-3.813 1.066 0 2.18.19 2.18.19v2.4h-1.229c-1.21 0-1.587.755-1.587 1.53v1.837h2.7l-.431 2.49h-2.269V24C20.075 23.094 24 18.1 24 12.073z"
        fill="#1877F2"
      />
      <path
        d="M16.671 15.543 17.102 13.053h-2.7v-1.837c0-.775.377-1.53 1.587-1.53h1.229v-2.4s-1.114-.19-2.18-.19c-2.221 0-3.678 1.356-3.678 3.813v2.144H8.886v2.49h2.474V24a9.71 9.71 0 0 0 3.042 0v-8.457h2.269z"
        fill="#fff"
      />
    </svg>
  )
}

/** The same mark in a single colour, for use on Facebook's blue button where
 *  the two-tone version would put white on white. */
function FacebookGlyph() {
  return (
    <svg aria-hidden="true" className="provider-glyph" focusable="false" viewBox="0 0 24 24">
      <path
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 3.925 23.094 9.101 24v-8.437H6.627v-2.49h2.474V9.9c0-2.457 1.457-3.813 3.678-3.813 1.066 0 2.18.19 2.18.19v2.4h-1.229c-1.21 0-1.587.755-1.587 1.53v1.837h2.7l-.431 2.49h-2.269V24C20.075 23.094 24 18.1 24 12.073z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Connecting a Page always upserts on the backend — reconnecting an
 *  already-held Page never counts against the plan limit — so the local list
 *  mirrors that: replace the matching row, or append when it is new. */
function upsertConnection(data: PageConnections, connection: PageConnection): PageConnections {
  const current = Array.isArray(data?.connections) ? data.connections : []
  const exists = current.some((row) => row.page_id === connection.page_id)
  return {
    ...data,
    connections: exists
      ? current.map((row) => (row.page_id === connection.page_id ? connection : row))
      : [...current, connection],
  }
}

function normalizePageConnections(res: unknown): PageConnections {
  if (!res || typeof res !== 'object') {
    return { connections: [], page_limit: 3, plan: 'STARTER' }
  }
  const raw = res as Record<string, unknown>
  if (Array.isArray(raw.connections)) {
    return {
      connections: raw.connections as PageConnection[],
      page_limit: typeof raw.page_limit === 'number' ? raw.page_limit : 3,
      plan: (raw.plan as PageConnections['plan']) || 'STARTER',
    }
  }
  if (raw.state === 'CONNECTED' && raw.page_id) {
    return {
      connections: [
        {
          state: 'CONNECTED',
          page_id: String(raw.page_id),
          page_name: String(raw.page_name || 'Facebook Page'),
          method: (raw.method as 'FACEBOOK_LOGIN' | 'MANUAL_TOKEN') || 'FACEBOOK_LOGIN',
          tasks: Array.isArray(raw.tasks) ? (raw.tasks as string[]) : [],
          can_moderate: Boolean(raw.can_moderate),
          connected_at: String(raw.connected_at || ''),
          last_synced_at: raw.last_synced_at ? String(raw.last_synced_at) : null,
        },
      ],
      page_limit: 3,
      plan: 'STARTER',
    }
  }
  return { connections: [], page_limit: 3, plan: 'STARTER' }
}

export function ConnectPage({ locale }: ConnectPageProps) {
  const t = text[locale]
  const planName = (plan?: string) =>
    copy[locale].pricingPlans.find((candidate) => candidate.id === plan?.toLowerCase())?.name ?? (plan || 'Prototype')
  const [data, setData] = useState<PageConnections | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [choices, setChoices] = useState<PageChoice[]>([])
  const [oauthState, setOauthState] = useState<string | null>(null)
  const [facebookError, setFacebookError] = useState<string | null>(null)
  const [selectedPage, setSelectedPage] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await listFacebookConnections()
      setData(normalizePageConnections(res))
      setState('ready')
    } catch {
      setState('error')
      return
    }

    const params = new URLSearchParams(window.location.search)

    // Meta's own refusals arrive as a code from the callback rather than as a
    // failed request, so they are read here before anything else.
    const failed = params.get('facebook_error')
    if (failed) {
      setFacebookError(t.oauthErrors[failed as keyof typeof t.oauthErrors] ?? t.error)
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    const callbackState = params.get('facebook_session')
    if (!callbackState) return

    // Returning from Meta is the end of the flow. A failure here must explain
    // itself rather than replacing the screen with a bare error, which left no
    // way to see what went wrong or to start again.
    try {
      const available = await listFacebookPageChoices(callbackState)
      setOauthState(callbackState)
      setChoices(available.pages)
      setSelectedPage(available.pages[0]?.page_id ?? '')
    } catch (caught) {
      setFacebookError(
        caught instanceof ApiError && caught.status === 404
          ? t.sessionExpired
          : caught instanceof ApiError && caught.detail
            ? caught.detail
            : t.error,
      )
      // Only a session that cannot be used again is cleared. Clearing it while
      // the Page chooser is still waiting to be confirmed meant one refresh
      // dropped the operator back to "connect" with the authorization lost.
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [t])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function beginFacebook() {
    setBusy(true)
    setFacebookError(null)
    try {
      const result = await startFacebookAuthorization()
      window.location.assign(result.authorization_url)
    } catch (caught) {
      // 503 means the deployment has no app credentials, which is an operator
      // problem, not something the person clicking can fix by retrying.
      setFacebookError(
        caught instanceof ApiError && caught.status === 503
          ? t.facebookUnavailable
          : caught instanceof ApiError && caught.detail
            ? caught.detail
            : t.error,
      )
      setBusy(false)
    }
  }

  async function submitToken(event: React.FormEvent) {
    event.preventDefault()
    if (!token.trim()) return
    setBusy(true)
    setError(false)
    setTokenError(null)
    try {
      const connection = await connectFacebookPageManually(token.trim())
      setData((current) => (current ? upsertConnection(current, connection) : current))
      setToken('')
    } catch (caught) {
      // Meta's refusal usually names the actual mistake — the wrong token
      // kind, an expired token — and a generic message hides it.
      setTokenError(caught instanceof ApiError && caught.detail ? caught.detail : t.error)
    } finally {
      setBusy(false)
    }
  }

  async function confirmPage() {
    if (!oauthState || !selectedPage) return
    setBusy(true)
    setError(false)
    setFacebookError(null)
    try {
      const connection = await selectFacebookPage(oauthState, selectedPage)
      setData((current) => (current ? upsertConnection(current, connection) : current))
      setChoices([])
      setOauthState(null)
      window.history.replaceState({}, '', window.location.pathname)
    } catch (caught) {
      // The last step of the flow. A bare "something went wrong" here left the
      // operator believing the Page was connected when it was not.
      setFacebookError(
        caught instanceof ApiError && caught.detail ? caught.detail : t.error,
      )
    } finally {
      setBusy(false)
    }
  }

  async function disconnect(pageId: string) {
    setBusy(true)
    setError(false)
    try {
      await disconnectFacebookPage(pageId)
      setData((current) =>
        current ? { ...current, connections: (current.connections || []).filter((row) => row.page_id !== pageId) } : current,
      )
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading') return <main className="dash-body"><p className="work-status" role="status">Loading…</p></main>

  if (state === 'error' || !data) {
    return <main className="dash-body"><div className="work-error" role="alert"><p>{t.error}</p><button className="button" onClick={() => { setState('loading'); void load() }} type="button">{t.retry}</button></div></main>
  }

  const connections = Array.isArray(data?.connections) ? data.connections : []
  const pageLimit = data?.page_limit ?? 3
  const atCap = connections.length >= pageLimit

  return (
    <main className="dash-body">
      <header className="dash-head">
        <div className="dash-head-text">
          <h1>{t.title}</h1>
          <p>{t.lead}</p>
        </div>
      </header>

      {/* Plan Capacity & Visual Slots Gauge */}
      <section aria-label={t.planCapacityTitle} className="conn-plan-hero">
        <div className="conn-plan-hero-left">
          <div className="conn-plan-title-block">
            <div className="conn-plan-tier-wrap">
              <span className={`conn-plan-tier-badge is-${(data.plan || 'STARTER').toLowerCase()}`}>
                <svg className="conn-tier-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>{data.plan === 'GROWTH' ? t.growthBadge : t.starterBadge}</span>
              </span>
              <span className="conn-plan-slots-count">
                {t.slotsLeft(Math.max(0, pageLimit - connections.length))}
              </span>
            </div>
            <p className="conn-plan-lead-desc">
              {data.plan === 'GROWTH' ? t.growthSubtitle : t.starterSubtitle}
            </p>
          </div>
          <div className="conn-slots-visual-bar">
            {Array.from({ length: pageLimit }).map((_, i) => {
              const isFilled = i < connections.length
              const page = isFilled ? connections[i] : null
              return (
                <div
                  className={`conn-slot-pill ${isFilled ? 'is-filled' : 'is-empty'}`}
                  key={i}
                  title={isFilled ? `Slot ${i + 1}: ${page?.page_name}` : `Slot ${i + 1}: Available`}
                >
                  <span className="conn-slot-dot" />
                  <span className="conn-slot-label">
                    {isFilled ? `Slot ${i + 1}: ${page?.can_moderate ? t.ready : t.connected}` : `${t.availableSlot} ${i + 1}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        {data.plan !== 'GROWTH' && (
          <div className="conn-plan-hero-right">
            <a className="button button-upgrade" href="/#early-access">
              <span>{t.upgradeToGrowthCta}</span>
              <svg className="conn-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        )}
      </section>

      {connections.length > 0 && (
        <section aria-label={t.connectedPagesTitle} className="conn-connected-section">
          <div className="conn-section-header">
            <div className="conn-section-title-wrap">
              <h2>{t.connectedPagesTitle}</h2>
              <span className="conn-quota-pill">
                {t.pagesUsage(connections.length, pageLimit)} · {planName(data.plan)}
              </span>
            </div>
          </div>
          <ul className="connected-pages-list">
            {connections.map((page) => {
              const method = page.method === 'FACEBOOK_LOGIN' ? t.facebookMethod : t.tokenMethod
              return (
                <li className="connected-page-card" key={page.page_id}>
                  <div className="conn-card-top">
                    <div className="conn-card-identity">
                      <div className="conn-page-avatar">
                        <FacebookMark />
                      </div>
                      <div className="conn-page-titles">
                        <span className="connection-kicker">{method}</span>
                        <h3>{page.page_name}</h3>
                        <span className="conn-page-id-badge">ID: {page.page_id}</span>
                      </div>
                    </div>
                    <div className={`conn-status-badge ${page.can_moderate ? 'is-ready' : 'is-warning'}`}>
                      <span className="conn-status-dot" />
                      <span className="connection-capability">{page.can_moderate ? t.ready : t.permissionWarning}</span>
                    </div>
                  </div>
                  <dl className="connection-facts conn-facts-grid">
                    <div className="conn-fact-tile">
                      <dt>{t.method}</dt>
                      <dd>{method}</dd>
                    </div>
                    <div className="conn-fact-tile">
                      <dt>{t.capability}</dt>
                      <dd>{page.tasks?.join(', ') || '—'}</dd>
                    </div>
                    <div className="conn-fact-tile">
                      <dt>{t.lastSync}</dt>
                      <dd>{page.last_synced_at ? new Date(page.last_synced_at).toLocaleString() : t.syncWaiting}</dd>
                    </div>
                    <div className="conn-fact-tile">
                      <dt>{t.connectedAt}</dt>
                      <dd>{page.connected_at ? new Date(page.connected_at).toLocaleString() : '—'}</dd>
                    </div>
                  </dl>
                  <div className="conn-card-footer">
                    <button className="button button-danger button-small" disabled={busy} onClick={() => void disconnect(page.page_id)} type="button">{busy ? t.disconnecting : t.disconnect}</button>
                  </div>
                </li>
              )
            })}
          </ul>
          {error && <p className="auth-error" role="alert">{t.error}</p>}
        </section>
      )}

      {atCap ? (
        <section className="connection-option conn-cap-card">
          <div className="conn-cap-content">
            <h2>{t.atCapTitle}</h2>
            <p>{t.atCapBody}</p>
            <a className="button button-small" href="/#early-access">{t.upgradeCta}</a>
          </div>
        </section>
      ) : choices.length > 0 ? (
        <section className="connection-chooser conn-chooser-card">
          <div className="conn-chooser-head">
            <h2>{t.choose}</h2>
            <p>{t.chooseHelp}</p>
          </div>
          <div className="page-choice-list">
            {choices.map((page) => (
              <label className={`page-choice ${selectedPage === page.page_id ? 'is-selected' : ''}`} key={page.page_id}>
                <input checked={selectedPage === page.page_id} name="facebook-page" onChange={() => setSelectedPage(page.page_id)} type="radio" />
                <div className="page-choice-content">
                  <strong>{page.page_name}</strong>
                  <small className={page.can_moderate ? 'is-ready' : 'is-warning'}>{page.can_moderate ? t.ready : t.permissionWarning}</small>
                </div>
              </label>
            ))}
          </div>
          {(facebookError || error) && <p className="auth-error" role="alert">{facebookError ?? t.error}</p>}
          <button className="button" disabled={busy || !selectedPage} onClick={() => void confirmPage()} type="button">{busy ? t.connecting : t.confirm}</button>
        </section>
      ) : oauthState ? <p className="work-status">{t.noPages}</p> : (
        <div className="connection-options conn-grid">
          {/* Supported Token Method */}
          <section className="connection-option is-recommended conn-method-card is-token-card">
            <div className="connection-option-head">
              <div className="conn-method-icon-wrap">
                <FacebookMark />
              </div>
              <span className="work-chip connection-recommended">{t.recommended}</span>
            </div>
            <h2>{t.tokenTitle}</h2>
            <p>{t.tokenLead}</p>
            <form className="advanced-token-form conn-token-form" onSubmit={submitToken}>
              <div className="conn-field-wrap">
                <div className="conn-label-row">
                  <label htmlFor="page-access-token">{t.token}</label>
                  <span className="conn-secure-tag">🔒 {locale === 'km' ? 'បានអ៊ិនគ្រីប' : 'Encrypted'}</span>
                </div>
                <input autoComplete="off" className="conn-token-input" id="page-access-token" onChange={(event) => setToken(event.target.value)} placeholder="EAA..." type="password" value={token} />
                <p className="conn-field-hint">{t.tokenHint}</p>
              </div>
              {tokenError && <p className="auth-error" role="alert">{tokenError}</p>}
              <button className="button button-token-submit" disabled={busy || !token.trim()} type="submit">
                {busy ? t.connecting : t.validate}
              </button>
            </form>
          </section>

          {/* Facebook Direct OAuth */}
          <section className="connection-option is-advanced conn-method-card is-oauth-card">
            <div className="connection-option-head">
              <div className="conn-method-icon-wrap">
                <FacebookMark />
              </div>
              <span className="conn-oauth-badge">{t.directOAuth}</span>
            </div>
            <h2>{t.facebook}</h2>
            <p>{t.facebookHelp}</p>
            <ul className="conn-feature-bullets">
              <li>
                <svg className="conn-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{t.oauthFeature1}</span>
              </li>
              <li>
                <svg className="conn-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{t.oauthFeature2}</span>
              </li>
              <li>
                <svg className="conn-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{t.oauthFeature3}</span>
              </li>
            </ul>
            {facebookError && <p className="auth-error" role="alert">{facebookError}</p>}
            <button className="button button-facebook" disabled={busy} onClick={() => void beginFacebook()} type="button">
              <FacebookGlyph />
              <span>{busy ? t.connecting : t.facebook}</span>
            </button>
          </section>
        </div>
      )}

      {/* Security & Assurance Badge Row */}
      <div className="conn-trust-strip">
        <div className="conn-trust-item">
          <svg className="conn-trust-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div>
            <strong>{locale === 'km' ? 'បានអ៊ិនគ្រីបពេលរក្សាទុក' : 'Encrypted at rest'}</strong>
            <small>{locale === 'km' ? 'Token ត្រូវបានរក្សាទុកដោយសុវត្ថិភាព' : 'Tokens encrypted at rest, never shown in plain text'}</small>
          </div>
        </div>
        <div className="conn-trust-item">
          <svg className="conn-trust-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            <strong>{locale === 'km' ? 'ការភ្ជាប់ Meta Graph API' : 'Meta Graph API integration'}</strong>
            <small>{locale === 'km' ? 'ប្រើតែសិទ្ធិដែលបានផ្ដល់តាម Meta' : 'Uses only the Page permissions granted through Meta'}</small>
          </div>
        </div>
        <div className="conn-trust-item">
          <svg className="conn-trust-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 14 14" />
          </svg>
          <div>
            <strong>{locale === 'km' ? 'ធ្វើសមកាលកម្មជាប្រចាំ' : 'Periodic synchronization'}</strong>
            <small>{locale === 'km' ? 'ពិនិត្យមតិយោបល់ថ្មី ពេលផ្ទាំងគ្រប់គ្រងបើក' : 'Checks for new comments while the moderation screen is open'}</small>
          </div>
        </div>
      </div>
    </main>
  )
}
