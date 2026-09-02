import { useCallback, useEffect, useState } from 'react'

import {
  ApiError,
  createInvitation,
  disconnectFacebookPage,
  getTeam,
  listFacebookConnections,
  listFacebookPageChoices,
  type PageChoice,
  type PageConnection,
  type PageConnections,
  removeMember,
  revokeInvitation,
  selectFacebookPage,
  startFacebookAuthorization,
  type CreatedInvitation,
  type Team,
} from '../api/client'
import { copy, type Locale } from './copy'
import { useSession } from './session'
import {
  Avatar, Badge, Banner, Card, EmptyState, Icon, Meter, Page, PageHead, PageState,
  SelectField,
} from './ui'

type ConnectPageProps = { locale: Locale }

type LoadState = 'loading' | 'ready' | 'error'

const text = {
  en: {
    title: 'Management',
    lead: 'Connected Facebook Pages, plan capacity, and the people who moderate them.',
    tabPages: 'Facebook Pages',
    tabTeam: 'Team Members',
    connectedPagesTitle: 'Connected Pages',
    connectedPagesLead: 'Every Page below sends its comments into the moderation queue.',
    pagesUsage: (used: number, limit: number) => `${used} of ${limit} Pages connected`,
    atCapTitle: 'You have reached your plan’s Page limit.',
    atCapBody: 'Disconnect a Page below, or upgrade your plan to connect more.',
    upgradeCta: 'View plans',
    recommended: 'Recommended',
    facebook: 'Continue with Facebook',
    facebookHelp: 'Sign in to Meta, choose an authorized Page, then confirm the connection.',
    connecting: 'Opening Facebook…',
    choose: 'Choose the Facebook Page to connect',
    chooseHelp: 'Only Pages returned by your Meta authorization are available.',
    confirm: 'Connect selected Page',
    facebookMethod: 'Connected with Facebook',
    ready: 'Ready to moderate',
    permissionShort: 'Limited access',
    permissionWarning: 'Connected, but the token does not include a moderation task.',
    disconnect: 'Disconnect Page',
    planCapacityTitle: 'Workspace capacity',
    starterBadge: 'Starter · 3 Pages',
    growthBadge: 'Growth · 10 Pages',
    starterSubtitle: 'Up to 3 Facebook Page connections are included in this workspace.',
    growthSubtitle: 'Up to 10 Facebook Page connections, with priority moderation.',
    upgradeToGrowthCta: 'Upgrade to Growth',
    addConnectionTitle: 'Connect a Facebook Page',
    slotsLeft: (count: number) => `${count} slot${count === 1 ? '' : 's'} left`,
    availableSlot: 'Available',
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
    retry: 'Try again',
    error: 'KCMS could not complete the connection. Check the authorization and try again.',
    facebookUnavailable: 'Facebook connection is not configured yet. Contact KCMS support.',
    teamTitle: 'Workspace Team',
    teamLead: 'Members who can review comments and take moderation actions.',
    teamInviteTitle: 'Invite a Team Member',
    teamInviteSubtitle: 'Create a one-time invitation link for a teammate to join this workspace.',
    teamMembersCount: (count: number) => `${count} member${count === 1 ? '' : 's'}`,
    trustLockTitle: 'Encrypted at rest',
    trustLockBody: 'Tokens are encrypted at rest and never shown in plain text.',
    trustScopeTitle: 'Meta Graph API',
    trustScopeBody: 'KCMS uses only the Page permissions granted through Meta.',
    trustSyncTitle: 'Periodic synchronization',
    trustSyncBody: 'New comments are collected while the moderation screen is open.',
    loading: 'Loading…',
  },
  km: {
    title: 'ការគ្រប់គ្រង',
    lead: 'ទំព័រ Facebook ដែលបានភ្ជាប់ សមត្ថភាពគម្រោង និងអ្នកដែលគ្រប់គ្រងពួកវា។',
    tabPages: 'ទំព័រ Facebook',
    tabTeam: 'សមាជិកក្រុម',
    connectedPagesTitle: 'ទំព័រដែលបានភ្ជាប់',
    connectedPagesLead: 'ទំព័រនីមួយៗខាងក្រោមផ្ញើមតិយោបល់ចូលទៅក្នុងជួរត្រួតពិនិត្យ។',
    pagesUsage: (used: number, limit: number) => `${used} នៃ ${limit} ទំព័របានភ្ជាប់`,
    atCapTitle: 'អ្នកបានឈានដល់កម្រិតកំណត់ទំព័រនៃគម្រោងរបស់អ្នក។',
    atCapBody: 'សូមផ្ដាច់ Page មួយខាងក្រោម ឬដំឡើងគម្រោងរបស់អ្នកដើម្បីភ្ជាប់ច្រើនទៀត។',
    upgradeCta: 'មើលគម្រោង',
    recommended: 'បានណែនាំ',
    facebook: 'បន្តជាមួយ Facebook',
    facebookHelp: 'ចូល Meta ជ្រើស Page ដែលមានសិទ្ធិ រួចបញ្ជាក់ការភ្ជាប់។',
    connecting: 'កំពុងបើក Facebook…',
    choose: 'ជ្រើស Facebook Page ដើម្បីភ្ជាប់',
    chooseHelp: 'មានតែ Page ដែល Meta អនុញ្ញាតឱ្យអ្នកប៉ុណ្ណោះ។',
    confirm: 'ភ្ជាប់ Page ដែលបានជ្រើស',
    facebookMethod: 'បានភ្ជាប់ជាមួយ Facebook',
    ready: 'អាចគ្រប់គ្រងមតិយោបល់បាន',
    permissionShort: 'សិទ្ធិមានកម្រិត',
    permissionWarning: 'បានភ្ជាប់ ប៉ុន្តែ token មិនមានសិទ្ធិគ្រប់គ្រងមតិយោបល់ទេ។',
    disconnect: 'ផ្ដាច់ Page',
    planCapacityTitle: 'សមត្ថភាពកន្លែងធ្វើការ',
    starterBadge: 'Starter · ៣ ទំព័រ',
    growthBadge: 'Growth · ១០ ទំព័រ',
    starterSubtitle: 'រួមបញ្ចូលការភ្ជាប់រហូតដល់ ៣ Facebook Pages ក្នុងកន្លែងធ្វើការនេះ។',
    growthSubtitle: 'ភ្ជាប់រហូតដល់ ១០ Facebook Pages ជាមួយអាទិភាពខ្ពស់។',
    upgradeToGrowthCta: 'ដំឡើងទៅ Growth',
    addConnectionTitle: 'ភ្ជាប់ Facebook Page',
    slotsLeft: (count: number) => `នៅសល់ ${count} កន្លែង`,
    availableSlot: 'ទំនេរ',
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
    retry: 'ព្យាយាមម្តងទៀត',
    error: 'KCMS មិនអាចបញ្ចប់ការភ្ជាប់បានទេ។ សូមពិនិត្យសិទ្ធិ ហើយព្យាយាមម្ដងទៀត។',
    facebookUnavailable: 'ការភ្ជាប់ Facebook មិនទាន់បានកំណត់ទេ។ សូមទាក់ទងជំនួយ KCMS។',
    teamTitle: 'ក្រុមការងារកន្លែងធ្វើការ',
    teamLead: 'សមាជិកដែលអាចពិនិត្យមើលមតិយោបល់ និងធ្វើសកម្មភាពគ្រប់គ្រង។',
    teamInviteTitle: 'អញ្ជើញសមាជិកក្រុម',
    teamInviteSubtitle: 'បង្កើតតំណអញ្ជើញតែម្តងសម្រាប់សហការីដើម្បីចូលរួមកន្លែងធ្វើការនេះ។',
    teamMembersCount: (count: number) => `${count} នាក់`,
    trustLockTitle: 'អ៊ិនគ្រីបពេលរក្សាទុក',
    trustLockBody: 'Token ត្រូវបានអ៊ិនគ្រីប ហើយមិនបង្ហាញជាអក្សរធម្មតាឡើយ។',
    trustScopeTitle: 'Meta Graph API',
    trustScopeBody: 'KCMS ប្រើតែសិទ្ធិលើ Page ដែល Meta បានផ្ដល់ប៉ុណ្ណោះ។',
    trustSyncTitle: 'សមកាលកម្មតាមកាលកំណត់',
    trustSyncBody: 'មតិយោបល់ថ្មីត្រូវបានប្រមូល ខណៈអេក្រង់ត្រួតពិនិត្យបើក។',
    loading: 'កំពុងផ្ទុក…',
  },
} as const

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

/** The endpoint has returned two shapes over its life: a list of connections,
 *  and a single connection object. Both are read here so an older backend does
 *  not blank the screen. */
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
  const content = copy[locale]
  const session = useSession()

  // Page connections
  const [data, setData] = useState<PageConnections | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [choices, setChoices] = useState<PageChoice[]>([])
  const [oauthState, setOauthState] = useState<string | null>(null)
  const [facebookError, setFacebookError] = useState<string | null>(null)
  const [selectedPage, setSelectedPage] = useState('')

  // Team
  const [team, setTeam] = useState<Team | null>(null)
  const [teamRole, setTeamRole] = useState<'owner' | 'member'>('member')
  const [freshInvite, setFreshInvite] = useState<CreatedInvitation | null>(null)
  const [copied, setCopied] = useState(false)
  const [teamProblem, setTeamProblem] = useState<string | null>(null)
  const [teamBusy, setTeamBusy] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const res = await listFacebookConnections()
      setData(normalizePageConnections(res))
      setState('ready')
    } catch {
      setState('error')
      return
    }

    const params = new URLSearchParams(window.location.search)
    const failed = params.get('facebook_error')
    if (failed) {
      setFacebookError(t.oauthErrors[failed as keyof typeof t.oauthErrors] ?? t.error)
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    const callbackState = params.get('facebook_session')
    if (!callbackState) return

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
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [t])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  useEffect(() => {
    void getTeam()
      .then((res) => {
        if (res && Array.isArray(res.members)) setTeam(res)
      })
      .catch(() => {})
  }, [])

  async function refreshTeam() {
    try {
      setTeam(await getTeam())
    } catch {
      // The visible list stays as it was; the action's own error is reported.
    }
  }

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
          : caught instanceof ApiError && caught.detail
            ? caught.detail
            : t.error,
      )
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
      setFacebookError(caught instanceof ApiError && caught.detail ? caught.detail : t.error)
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
        current
          ? { ...current, connections: (current.connections || []).filter((row) => row.page_id !== pageId) }
          : current,
      )
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  const isOwner = team?.your_role === 'owner'
  const inviteUrl = freshInvite ? `${window.location.origin}/join/${freshInvite.token}` : ''

  async function inviteMember() {
    setTeamBusy(true)
    setTeamProblem(null)
    try {
      setFreshInvite(await createInvitation(teamRole))
      setCopied(false)
      await refreshTeam()
    } catch {
      setTeamProblem(content.authUnreachable)
    } finally {
      setTeamBusy(false)
    }
  }

  async function removeTeamMember(userId: string) {
    setTeamProblem(null)
    try {
      await removeMember(userId)
      await refreshTeam()
    } catch (caught) {
      setTeamProblem(
        caught instanceof ApiError && caught.status === 409
          ? content.teamLastOwner
          : content.authUnreachable,
      )
    }
  }

  if (state === 'loading') {
    return <PageState kind="loading" message={t.loading} />
  }

  if (state === 'error' || !data) {
    return (
      <PageState
        action={
          <button className="ws-btn" onClick={() => { setState('loading'); void loadData() }} type="button">
            {t.retry}
          </button>
        }
        kind="error"
        message={t.error}
      />
    )
  }

  const connections = Array.isArray(data.connections) ? data.connections : []
  const pageLimit = data.page_limit ?? 3
  const atCap = connections.length >= pageLimit
  const members = team && Array.isArray(team.members) ? team.members : []
  const invitations = team && Array.isArray(team.invitations) ? team.invitations : []
  const isGrowth = data.plan === 'GROWTH'

  return (
    <Page>
      <PageHead
        actions={
          <>
            <Badge tone={isGrowth ? 'accent' : 'neutral'}>
              <Icon className="ws-btn-icon" name="star" />
              {isGrowth ? t.growthBadge : t.starterBadge}
            </Badge>
            {!atCap && (
              <button
                className="ws-btn"
                disabled={busy}
                onClick={() => void beginFacebook()}
                type="button"
              >
                <Icon className="ws-btn-icon" name="plus" />
                <span>{busy ? content.connAdding : content.connAdd}</span>
              </button>
            )}
            {isOwner && (
              <button
                className="ws-btn"
                disabled={teamBusy}
                onClick={() => void inviteMember()}
                type="button"
              >
                <Icon className="ws-btn-icon" name="plus" />
                <span>{content.teamInvite}</span>
              </button>
            )}
          </>
        }
        lead={t.lead}
        title={t.title}
      />

      {/* ---- Facebook Pages -------------------------------------------- */}
      <div className="ws-stack">
          <Card
            actions={
              !isGrowth && (
                <a className="ws-btn" data-variant="secondary" href="/#pricing">
                  <span>{t.upgradeToGrowthCta}</span>
                  <Icon className="ws-btn-icon" name="arrowRight" />
                </a>
              )
            }
            description={isGrowth ? t.growthSubtitle : t.starterSubtitle}
            title={t.planCapacityTitle}
          >
            <div className="ws-stack-tight">
              <Meter
                caption={t.pagesUsage(connections.length, pageLimit)}
                label={content.connPagesUsed}
                max={pageLimit}
                value={connections.length}
              />
              <ul className="ws-slots">
                {Array.from({ length: pageLimit }).map((_, index) => {
                  const conn = connections[index]
                  return (
                    <li
                      className="ws-slot"
                      data-state={conn ? 'used' : 'free'}
                      key={conn?.page_id ?? `slot-${index}`}
                    >
                      <Icon className="ws-btn-icon" name={conn ? 'check' : 'plus'} />
                      <span className="ws-slot-name">
                        {conn ? conn.page_name : `${content.connOpenSlot} ${index + 1}`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </Card>

          {facebookError && (
            <Banner role="alert" tone="danger">{facebookError}</Banner>
          )}
          {error && <Banner role="alert" tone="danger">{t.error}</Banner>}

          {/* Returned from Meta with a set of authorized Pages to pick from. */}
          {choices.length > 0 && (
            <Card description={t.chooseHelp} title={t.choose} tone="accent">
              <div className="ws-stack-tight">
                <ul className="ws-choices">
                  {choices.map((page) => (
                    <li key={page.page_id}>
                      <label className="ws-choice">
                        <input
                          checked={selectedPage === page.page_id}
                          name="page_choice"
                          onChange={() => setSelectedPage(page.page_id)}
                          type="radio"
                          value={page.page_id}
                        />
                        <span className="ws-choice-text">
                          <span className="ws-choice-name">{page.page_name}</span>
                          <span className="ws-choice-id">{page.page_id}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="ws-form-actions">
                  <button
                    className="ws-btn"
                    disabled={busy || !selectedPage}
                    onClick={() => void confirmPage()}
                    type="button"
                  >
                    {t.confirm}
                  </button>
                </div>
              </div>
            </Card>
          )}

          {atCap && (
            <Banner role="status" title={t.atCapTitle} tone="amber">
              {t.atCapBody}
            </Banner>
          )}

          <Card
            actions={<Badge tone="neutral">{t.pagesUsage(connections.length, pageLimit)}</Badge>}
            description={t.connectedPagesLead}
            title={t.connectedPagesTitle}
          >
            {connections.length === 0 ? (
              <EmptyState
                description={content.connEmptyPagesLead}
                icon="page"
                title={content.connEmptyPages}
              />
            ) : (
              <ul className="ws-rows">
                {connections.map((conn) => (
                  <li className="ws-row" key={conn.page_id}>
                    <div className="ws-row-main">
                      <Avatar icon="page" />
                      <div className="ws-row-text">
                        <p className="ws-row-title">{conn.page_name}</p>
                        <p className="ws-row-sub">ID: {conn.page_id}</p>
                        <div className="ws-row-tags">
                          {conn.can_moderate === false ? (
                            <Badge tone="amber">{t.permissionShort}</Badge>
                          ) : (
                            <Badge dot tone="accent">{t.ready}</Badge>
                          )}
                          <Badge tone="neutral">{content.connMethodFacebook}</Badge>
                        </div>
                        {conn.can_moderate === false && (
                          <p className="ws-row-sub">{t.permissionWarning}</p>
                        )}
                      </div>
                    </div>
                    <div className="ws-row-meta">
                      <button
                        className="ws-btn"
                        data-size="sm"
                        data-variant="danger"
                        disabled={busy}
                        onClick={() => void disconnect(conn.page_id)}
                        type="button"
                      >
                        {t.disconnect}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <ul className="ws-trust">
            <li>
              <Icon name="lock" />
              <div>
                <strong>{t.trustLockTitle}</strong>
                <p>{t.trustLockBody}</p>
              </div>
            </li>
            <li>
              <Icon name="shield" />
              <div>
                <strong>{t.trustScopeTitle}</strong>
                <p>{t.trustScopeBody}</p>
              </div>
            </li>
            <li>
              <Icon name="clock" />
              <div>
                <strong>{t.trustSyncTitle}</strong>
                <p>{t.trustSyncBody}</p>
              </div>
            </li>
          </ul>
      </div>

      {/* ---- Team ------------------------------------------------------- */}
      <div className="ws-stack">
          {teamProblem && <Banner role="alert" tone="danger">{teamProblem}</Banner>}

          <Card
            actions={<Badge tone="neutral">{t.teamMembersCount(members.length)}</Badge>}
            description={t.teamLead}
            title={t.teamTitle}
            footer={!isOwner ? <p className="ws-card-note">{content.teamOwnerOnly}</p> : undefined}
          >
            {members.length === 0 ? (
              <EmptyState
                description={content.connTeamEmptyLead}
                icon="users"
                title={content.connTeamEmpty}
              />
            ) : (
              <ul className="ws-rows">
                {members.map((member) => {
                  const you = member.user_id === session.user?.id
                  return (
                    <li className="ws-row" key={member.user_id}>
                      <div className="ws-row-main">
                        <Avatar name={member.display_name} />
                        <div className="ws-row-text">
                          <p className="ws-row-title">
                            {member.display_name}
                            {you && <Badge tone="accent">{content.teamYou}</Badge>}
                          </p>
                          {member.email && <p className="ws-row-sub">{member.email}</p>}
                        </div>
                      </div>
                      <div className="ws-row-meta">
                        <Badge tone={member.role === 'owner' ? 'violet' : 'neutral'}>
                          {member.role === 'owner' ? content.teamOwner : content.teamMember}
                        </Badge>
                        {isOwner && !you && (
                          <button
                            className="ws-link-btn"
                            data-tone="danger"
                            onClick={() => void removeTeamMember(member.user_id)}
                            type="button"
                          >
                            {content.teamRemove}
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          {/* The role picker sits beside the members it governs; the invite
              action itself is the page's header button. A fresh link is shown
              here because it can only ever be shown once. */}
          {isOwner && (
            <Card
              actions={
                <SelectField
                  id="invite-role"
                  label={content.teamInviteRole}
                  onChange={(e) => setTeamRole(e.target.value as 'owner' | 'member')}
                  value={teamRole}
                >
                  <option value="member">{content.teamMember}</option>
                  <option value="owner">{content.teamOwner}</option>
                </SelectField>
              }
              description={t.teamInviteSubtitle}
              title={t.teamInviteTitle}
            >
              <div className="ws-stack-tight">
                {freshInvite && (
                  <>
                    <Banner icon="link" role="status" title={content.teamLinkTitle} tone="accent">
                      {content.teamLinkBody}
                    </Banner>
                    <div className="ws-copy-row">
                      <input aria-label={content.teamLinkTitle} readOnly value={inviteUrl} />
                      <button
                        className="ws-btn"
                        data-variant="secondary"
                        onClick={() => {
                          void navigator.clipboard?.writeText(inviteUrl)
                          setCopied(true)
                        }}
                        type="button"
                      >
                        <Icon className="ws-btn-icon" name="copy" />
                        <span>{copied ? content.teamCopied : content.teamCopy}</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Open invitations are rows in the same shape as members, so
                    the tab reads as one list of people, pending or joined. */}
                <h3 className="ws-subhead">{content.connInviteOpen}</h3>
                {invitations.length === 0 ? (
                  <p className="ws-card-note">{content.connInviteNone}</p>
                ) : (
                  <ul className="ws-rows">
                    {invitations.map((invitation) => (
                      <li className="ws-row" key={invitation.token_hash}>
                        <div className="ws-row-main">
                          <Avatar icon="mail" />
                          <div className="ws-row-text">
                            <p className="ws-row-title">
                              {invitation.role === 'owner' ? content.teamOwner : content.teamMember}
                            </p>
                            <p className="ws-row-sub">
                              {content.teamExpires}{' '}
                              {new Date(invitation.expires_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="ws-row-meta">
                          <Badge tone="amber">{content.teamPending}</Badge>
                          <button
                            className="ws-link-btn"
                            data-tone="danger"
                            onClick={async () => {
                              await revokeInvitation(invitation.token_hash)
                              await refreshTeam()
                            }}
                            type="button"
                          >
                            {content.teamRevoke}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )}
      </div>
    </Page>
  )
}
