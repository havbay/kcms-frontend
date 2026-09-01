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
  const exists = data.connections.some((row) => row.page_id === connection.page_id)
  return {
    ...data,
    connections: exists
      ? data.connections.map((row) => (row.page_id === connection.page_id ? connection : row))
      : [...data.connections, connection],
  }
}

export function ConnectPage({ locale }: ConnectPageProps) {
  const t = text[locale]
  const planName = (plan: string) =>
    copy[locale].pricingPlans.find((candidate) => candidate.id === plan.toLowerCase())?.name ?? plan
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
      setData(await listFacebookConnections())
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
        current ? { ...current, connections: current.connections.filter((row) => row.page_id !== pageId) } : current,
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

  const atCap = data.connections.length >= data.page_limit

  return (
    <main className="dash-body">
      <header className="dash-head"><h1>{t.title}</h1><p>{t.lead}</p></header>

      {data.connections.length > 0 && (
        <section aria-label={t.connectedPagesTitle} className="connection-status">
          <div className="connection-status-head">
            <h2>{t.connectedPagesTitle}</h2>
            <span className="connection-capability">
              {t.pagesUsage(data.connections.length, data.page_limit)} · {planName(data.plan)}
            </span>
          </div>
          <ul className="connected-pages-list">
            {data.connections.map((page) => {
              const method = page.method === 'FACEBOOK_LOGIN' ? t.facebookMethod : t.tokenMethod
              return (
                <li className="connected-page-card" key={page.page_id}>
                  <div className="connection-status-head">
                    <div><span className="connection-kicker">Facebook Page</span><h3>{page.page_name}</h3><p>ID {page.page_id}</p></div>
                    <span className={`connection-capability ${page.can_moderate ? 'is-ready' : 'is-warning'}`}>{page.can_moderate ? t.ready : t.permissionWarning}</span>
                  </div>
                  <dl className="connection-facts">
                    <div><dt>{t.method}</dt><dd>{method}</dd></div>
                    <div><dt>{t.capability}</dt><dd>{page.tasks?.join(', ') || '—'}</dd></div>
                    <div><dt>{t.lastSync}</dt><dd>{page.last_synced_at ? new Date(page.last_synced_at).toLocaleString() : t.syncWaiting}</dd></div>
                    <div><dt>{t.connectedAt}</dt><dd>{page.connected_at ? new Date(page.connected_at).toLocaleString() : '—'}</dd></div>
                  </dl>
                  <button className="button button-danger button-small" disabled={busy} onClick={() => void disconnect(page.page_id)} type="button">{busy ? t.disconnecting : t.disconnect}</button>
                </li>
              )
            })}
          </ul>
          {error && <p className="auth-error" role="alert">{t.error}</p>}
        </section>
      )}

      {atCap ? (
        <section className="connection-option">
          <h2>{t.atCapTitle}</h2>
          <p>{t.atCapBody}</p>
          <a className="button button-small" href="/#early-access">{t.upgradeCta}</a>
        </section>
      ) : choices.length > 0 ? (
        <section className="connection-chooser">
          <h2>{t.choose}</h2><p>{t.chooseHelp}</p>
          <div className="page-choice-list">{choices.map((page) => (
            <label className="page-choice" key={page.page_id}>
              <input checked={selectedPage === page.page_id} name="facebook-page" onChange={() => setSelectedPage(page.page_id)} type="radio" />
              <span><strong>{page.page_name}</strong><small>{page.can_moderate ? t.ready : t.permissionWarning}</small></span>
            </label>
          ))}</div>
          {(facebookError || error) && <p className="auth-error" role="alert">{facebookError ?? t.error}</p>}
          <button className="button" disabled={busy || !selectedPage} onClick={() => void confirmPage()} type="button">{busy ? t.connecting : t.confirm}</button>
        </section>
      ) : oauthState ? <p className="work-status">{t.noPages}</p> : (
        <div className="connection-options">
          {/* Facebook Login is not finished. Leaving it enabled and recommended
              sends people down a path that fails, so it is disabled and named
              as unfinished, and the Page token becomes the supported route. */}
          <section className="connection-option is-recommended">
            <div className="connection-option-head"><FacebookMark /><span className="work-chip connection-recommended">{t.recommended}</span></div>
            <h2>{t.tokenTitle}</h2><p>{t.tokenLead}</p>
            <form className="advanced-token-form" onSubmit={submitToken}>
                <label htmlFor="page-access-token">{t.token}</label>
                <input autoComplete="off" id="page-access-token" onChange={(event) => setToken(event.target.value)} type="password" value={token} />
                <p>{t.tokenHint}</p>
                {tokenError && <p className="auth-error" role="alert">{tokenError}</p>}
              <button className="button" disabled={busy || !token.trim()} type="submit">{busy ? t.connecting : t.validate}</button>
            </form>
          </section>
          <section className="connection-option is-advanced">
            <div className="connection-option-head"><FacebookMark /></div>
            <h2>{t.facebook}</h2><p>{t.facebookHelp}</p>
            {facebookError && <p className="auth-error" role="alert">{facebookError}</p>}
            <button className="button button-facebook" disabled={busy} onClick={() => void beginFacebook()} type="button"><FacebookGlyph />{busy ? t.connecting : t.facebook}</button>
          </section>
        </div>
      )}
    </main>
  )
}
