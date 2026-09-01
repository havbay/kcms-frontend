import { useCallback, useEffect, useState } from 'react'

import {
  ApiError,
  connectFacebookPageManually,
  disconnectFacebookPage,
  getFacebookConnection,
  listFacebookPageChoices,
  type PageChoice,
  type PageConnectionState,
  selectFacebookPage,
  startFacebookAuthorization,
} from '../api/client'
import type { Locale } from './copy'

type ConnectPageProps = { locale: Locale }
type LoadState = 'loading' | 'ready' | 'error'

const text = {
  en: {
    title: 'Connect your Facebook Page', lead: 'Authorize one Page so KCMS can receive comments and carry out the actions you approve.',
    recommended: 'Recommended', facebook: 'Continue with Facebook', facebookHelp: 'Sign in to Meta, choose an authorized Page, then confirm the connection.',
    advanced: 'Connect with Page token', advancedHelp: 'Advanced setup for testing or assisted connection.', token: 'Page access token',
    tokenHint: 'Sent securely to KCMS for validation. The full token is never shown again.', validate: 'Validate and connect', connecting: 'Connecting…',
    choose: 'Choose the Facebook Page to connect', chooseHelp: 'Only Pages returned by your Meta authorization are available.', confirm: 'Connect selected Page',
    connected: 'Page connected', facebookMethod: 'Connected with Facebook', tokenMethod: 'Connected with Page token', ready: 'Ready to moderate',
    permissionWarning: 'Connected, but the token does not include a moderation task.', syncWaiting: 'Waiting for first synchronization', lastSync: 'Last synchronized',
    connectedAt: 'Connected', method: 'Connection method', capability: 'Moderation access', disconnect: 'Disconnect Page', disconnecting: 'Disconnecting…',
    retry: 'Try again', error: 'KCMS could not complete the connection. Check the authorization and try again.', facebookUnavailable: 'Facebook connection is not configured yet. Contact KCMS support.', approvalRequired: 'This workspace must be approved before it can connect a real Page.', noPages: 'Meta did not return an authorized Page for this account.',
  },
  km: {
    title: 'ភ្ជាប់ Facebook Page របស់អ្នក', lead: 'អនុញ្ញាត Page មួយ ដើម្បីឱ្យ KCMS ទទួលមតិយោបល់ និងអនុវត្តសកម្មភាពដែលអ្នកយល់ព្រម។',
    recommended: 'បានណែនាំ', facebook: 'បន្តជាមួយ Facebook', facebookHelp: 'ចូល Meta ជ្រើស Page ដែលមានសិទ្ធិ រួចបញ្ជាក់ការភ្ជាប់។',
    advanced: 'ភ្ជាប់ដោយ Page token', advancedHelp: 'ការកំណត់កម្រិតខ្ពស់ សម្រាប់សាកល្បង ឬជំនួយពី KCMS។', token: 'Page access token',
    tokenHint: 'ផ្ញើដោយសុវត្ថិភាពទៅ KCMS ដើម្បីផ្ទៀងផ្ទាត់។ Token ពេញមិនត្រូវបង្ហាញម្តងទៀតទេ។', validate: 'ផ្ទៀងផ្ទាត់ និងភ្ជាប់', connecting: 'កំពុងភ្ជាប់…',
    choose: 'ជ្រើស Facebook Page ដើម្បីភ្ជាប់', chooseHelp: 'មានតែ Page ដែល Meta អនុញ្ញាតឱ្យអ្នកប៉ុណ្ណោះ។', confirm: 'ភ្ជាប់ Page ដែលបានជ្រើស',
    connected: 'បានភ្ជាប់ Page', facebookMethod: 'បានភ្ជាប់ជាមួយ Facebook', tokenMethod: 'បានភ្ជាប់ដោយ Page token', ready: 'អាចគ្រប់គ្រងមតិយោបល់បាន',
    permissionWarning: 'បានភ្ជាប់ ប៉ុន្តែ token មិនមានសិទ្ធិគ្រប់គ្រងមតិយោបល់ទេ។', syncWaiting: 'កំពុងរង់ចាំសមកាលកម្មដំបូង', lastSync: 'សមកាលកម្មចុងក្រោយ',
    connectedAt: 'បានភ្ជាប់', method: 'វិធីភ្ជាប់', capability: 'សិទ្ធិគ្រប់គ្រង', disconnect: 'ផ្ដាច់ Page', disconnecting: 'កំពុងផ្ដាច់…',
    retry: 'ព្យាយាមម្តងទៀត', error: 'KCMS មិនអាចបញ្ចប់ការភ្ជាប់បានទេ។ សូមពិនិត្យសិទ្ធិ ហើយព្យាយាមម្ដងទៀត។', facebookUnavailable: 'ការភ្ជាប់ Facebook មិនទាន់បានកំណត់ទេ។ សូមទាក់ទងជំនួយ KCMS។', approvalRequired: 'Workspace នេះត្រូវតែទទួលបានការអនុម័ត មុននឹងអាចភ្ជាប់ Page ពិតបាន។', noPages: 'Meta មិនបានផ្ដល់ Page ដែលមានសិទ្ធិសម្រាប់គណនីនេះទេ។',
  },
} as const

export function ConnectPage({ locale }: ConnectPageProps) {
  const t = text[locale]
  const [connection, setConnection] = useState<PageConnectionState | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [advanced, setAdvanced] = useState(false)
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [facebookError, setFacebookError] = useState<string | null>(null)
  const [choices, setChoices] = useState<PageChoice[]>([])
  const [oauthState, setOauthState] = useState<string | null>(null)
  const [selectedPage, setSelectedPage] = useState('')

  const load = useCallback(async () => {
    try {
      const current = await getFacebookConnection()
      setConnection(current)
      setState('ready')
      const callbackState = new URLSearchParams(window.location.search).get('facebook_session')
      if (current.state === 'NOT_CONNECTED' && callbackState) {
        const available = await listFacebookPageChoices(callbackState)
        setOauthState(callbackState)
        setChoices(available.pages)
        setSelectedPage(available.pages[0]?.page_id ?? '')
      }
    } catch {
      setState('error')
    }
  }, [])

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
      setFacebookError(
        caught instanceof ApiError && caught.status === 503
          ? t.facebookUnavailable
          : caught instanceof ApiError && caught.status === 403
            ? t.approvalRequired
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
    try {
      setConnection(await connectFacebookPageManually(token.trim()))
      setToken('')
      setAdvanced(false)
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  async function confirmPage() {
    if (!oauthState || !selectedPage) return
    setBusy(true)
    setError(false)
    try {
      setConnection(await selectFacebookPage(oauthState, selectedPage))
      setChoices([])
      setOauthState(null)
      window.history.replaceState({}, '', window.location.pathname)
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    setBusy(true)
    setError(false)
    try {
      await disconnectFacebookPage()
      setConnection({ state: 'NOT_CONNECTED', can_moderate: false })
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading') return <main className="dash-body"><p className="work-status" role="status">Loading…</p></main>

  if (state === 'error') {
    return <main className="dash-body"><div className="work-error" role="alert"><p>{t.error}</p><button className="button" onClick={() => { setState('loading'); void load() }} type="button">{t.retry}</button></div></main>
  }

  if (connection?.state === 'CONNECTED') {
    const method = connection.method === 'FACEBOOK_LOGIN' ? t.facebookMethod : t.tokenMethod
    return (
      <main className="dash-body">
        <header className="dash-head"><h1>{t.connected}</h1><p>{method}</p></header>
        <section className="connection-status" aria-label={t.connected}>
          <div className="connection-status-head">
            <div><span className="connection-kicker">Facebook Page</span><h2>{connection.page_name}</h2><p>ID {connection.page_id}</p></div>
            <span className={`connection-capability ${connection.can_moderate ? 'is-ready' : 'is-warning'}`}>{connection.can_moderate ? t.ready : t.permissionWarning}</span>
          </div>
          <dl className="connection-facts">
            <div><dt>{t.method}</dt><dd>{method}</dd></div>
            <div><dt>{t.capability}</dt><dd>{connection.tasks?.join(', ') || '—'}</dd></div>
            <div><dt>{t.lastSync}</dt><dd>{connection.last_synced_at ? new Date(connection.last_synced_at).toLocaleString() : t.syncWaiting}</dd></div>
            <div><dt>{t.connectedAt}</dt><dd>{connection.connected_at ? new Date(connection.connected_at).toLocaleString() : '—'}</dd></div>
          </dl>
          {error && <p className="auth-error" role="alert">{t.error}</p>}
          <button className="button button-danger button-small" disabled={busy} onClick={() => void disconnect()} type="button">{busy ? t.disconnecting : t.disconnect}</button>
        </section>
      </main>
    )
  }

  return (
    <main className="dash-body">
      <header className="dash-head"><h1>{t.title}</h1><p>{t.lead}</p></header>
      {choices.length > 0 ? (
        <section className="connection-chooser">
          <h2>{t.choose}</h2><p>{t.chooseHelp}</p>
          <div className="page-choice-list">{choices.map((page) => (
            <label className="page-choice" key={page.page_id}>
              <input checked={selectedPage === page.page_id} name="facebook-page" onChange={() => setSelectedPage(page.page_id)} type="radio" />
              <span><strong>{page.page_name}</strong><small>{page.can_moderate ? t.ready : t.permissionWarning}</small></span>
            </label>
          ))}</div>
          {error && <p className="auth-error" role="alert">{t.error}</p>}
          <button className="button" disabled={busy || !selectedPage} onClick={() => void confirmPage()} type="button">{busy ? t.connecting : t.confirm}</button>
        </section>
      ) : oauthState ? <p className="work-status">{t.noPages}</p> : (
        <div className="connection-options">
          <section className="connection-option is-recommended">
            <div className="connection-option-head"><span aria-hidden="true" className="connection-provider">f</span><span className="work-chip connection-recommended">{t.recommended}</span></div>
            <h2>{t.facebook}</h2><p>{t.facebookHelp}</p>
            {facebookError && <p className="auth-error" role="alert">{facebookError}</p>}
            <button className="button" disabled={busy} onClick={() => void beginFacebook()} type="button">{busy ? t.connecting : t.facebook}</button>
          </section>
          <section className="connection-option is-advanced">
            <button aria-expanded={advanced} className="advanced-toggle" onClick={() => setAdvanced((value) => !value)} type="button"><span>{t.advanced}</span><small>{t.advancedHelp}</small></button>
            {advanced && (
              <form className="advanced-token-form" onSubmit={submitToken}>
                <label htmlFor="page-access-token">{t.token}</label>
                <input autoComplete="off" id="page-access-token" onChange={(event) => setToken(event.target.value)} type="password" value={token} />
                <p>{t.tokenHint}</p>
                {error && <p className="auth-error" role="alert">{t.error}</p>}
                <button className="button button-small" disabled={busy || !token.trim()} type="submit">{busy ? t.connecting : t.validate}</button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
