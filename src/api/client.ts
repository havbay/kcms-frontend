/**
 * Typed API client.
 *
 * Types in `schema.d.ts` are GENERATED from the backend-owned OpenAPI artifact
 * (`npm run api:generate`). Never hand-edit them — if the backend contract
 * changes, regenerate and let TypeScript surface the breakage.
 */

import type { components } from './schema'

export type WorkListItem = components['schemas']['WorkListItem']
export type WorkList = components['schemas']['WorkList']
export type HistoryEntry = components['schemas']['HistoryEntry']
export type ActionKind = components['schemas']['ActionRequest']['kind']
export type CorrectionRequest = components['schemas']['CorrectionRequest']
export type CorrectionResponse = components['schemas']['CorrectionResponse']
export type SeverityLabel = CorrectionRequest['severity']
export type TargetLabel = CorrectionRequest['target']
export type PageConnections = components['schemas']['PageConnections']
export type PageConnection = components['schemas']['PageConnection']
export type PageChoice = components['schemas']['PageChoice']
export type SyncResult = components['schemas']['SyncResult']

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** The API's own explanation, when it sent one. Some refusals are only
     *  actionable if the reason reaches the person reading the screen. */
    readonly detail?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Kept in memory and mirrored to localStorage. A bearer token is used rather
 *  than a cookie because the frontend and API are on different sites, where
 *  SameSite=None cookies are blocked by default in several browsers. */
const TOKEN_KEY = 'kcms.session'
let sessionToken: string | null = readStoredToken()

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setSessionToken(token: string | null) {
  sessionToken = token
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Private browsing: the in-memory token still works for this tab.
  }
}

export function getSessionToken(): string | null {
  return sessionToken
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        ...init?.headers,
      },
    })
  } catch {
    // Network failure, CORS rejection, or a cold backend that timed out.
    throw new ApiError(0, 'unreachable')
  }
  if (!response.ok) {
    let detail: string | undefined
    try {
      const failure = await response.json()
      if (typeof failure?.detail === 'string') detail = failure.detail
    } catch {
      // Not every failure carries a JSON body; the status still stands.
    }
    throw new ApiError(response.status, `request failed with ${response.status}`, detail)
  }
  // 204 and other empty bodies must not be fed to json(): sign-out returns
  // No Content, and parsing it throws after the request already succeeded.
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T
  }
  const body = await response.text()
  return (body ? JSON.parse(body) : undefined) as T
}

export type Summary = components['schemas']['Summary']

export type CommentFilters = {
  limit?: number
  offset?: number
  query?: string
  severity?: 'SAFE' | 'OFFENSIVE' | 'HARMFUL'
  target?: 'PERSON' | 'INSTITUTION' | 'NEITHER'
  surfacedReason?: 'triage' | 'institution_sample' | 'novel_language' | 'uncertainty' | 'cleared'
  reviewStatus?: 'PENDING' | 'ACTIONED'
  sort?: 'PRIORITY' | 'NEWEST' | 'OLDEST'
}

export function listComments(filters: CommentFilters = {}): Promise<WorkList> {
  const params = new URLSearchParams({
    limit: String(filters.limit ?? 25),
    offset: String(filters.offset ?? 0),
  })
  if (filters.query) params.set('query', filters.query)
  if (filters.severity) params.set('severity', filters.severity)
  if (filters.target) params.set('target', filters.target)
  if (filters.surfacedReason) params.set('surfaced_reason', filters.surfacedReason)
  if (filters.reviewStatus) params.set('review_status', filters.reviewStatus)
  if (filters.sort) params.set('sort', filters.sort)
  return request<WorkList>(`/api/v1/comments?${params.toString()}`)
}

export function getSummary(): Promise<Summary> {
  return request<Summary>('/api/v1/comments/summary')
}

export function recordAction(commentId: string, kind: ActionKind): Promise<HistoryEntry[]> {
  return request<HistoryEntry[]>(`/api/v1/comments/${encodeURIComponent(commentId)}/actions`, {
    method: 'POST',
    // No actor: the API attributes the action to the signed-in user. Sending
    // one implied a moderator's name was the client's to choose, and the
    // server discarded it anyway.
    body: JSON.stringify({ kind }),
  })
}

/**
 * Submit what a human says the labels should be.
 *
 * This is NOT an action: it does not hide, unhide or leave the comment. The
 * two are separate records on purpose — actions must never become labels.
 */
export function recordCorrection(
  commentId: string,
  severity: SeverityLabel,
  target: TargetLabel,
): Promise<CorrectionResponse> {
  return request<CorrectionResponse>(
    `/api/v1/comments/${encodeURIComponent(commentId)}/corrections`,
    // Same as recordAction: attribution is the server's, from the session.
    { method: 'POST', body: JSON.stringify({ severity, target }) },
  )
}

export type AuthUser = components['schemas']['AuthUser']
export type Session = components['schemas']['Session']
export type Providers = components['schemas']['Providers']

export function listAuthProviders(): Promise<Providers> {
  return request<Providers>('/api/v1/auth/providers')
}

export function signIn(email: string, password: string): Promise<Session> {
  return request<Session>('/api/v1/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function signInWithTelegram(payload: Record<string, string>): Promise<Session> {
  return request<Session>('/api/v1/auth/telegram', {
    method: 'POST',
    body: JSON.stringify({ payload }),
  })
}

export function exchangeClerkSession(clerkToken: string): Promise<Session> {
  return requestWithBearer<Session>('/api/v1/auth/clerk', clerkToken, { method: 'POST' })
}

async function requestWithBearer<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })
  if (!response.ok) throw new ApiError(response.status, `request failed with ${response.status}`)
  const body = await response.text()
  return (body ? JSON.parse(body) : undefined) as T
}

export function getCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>('/api/v1/auth/me')
}

export async function signOut(): Promise<void> {
  try {
    await request<void>('/api/v1/auth/signout', { method: 'POST' })
  } finally {
    setSessionToken(null)
  }
}

export type PilotRequestCreate = components['schemas']['PilotRequestCreate']
export type PilotRequestReceipt = components['schemas']['PilotRequestReceipt']
export type AdminPilotRequest = components['schemas']['AdminPilotRequest']
export type PilotDecisionResult = components['schemas']['PilotDecisionResult']
export type SetupInvitationPreview = components['schemas']['SetupInvitationPreview']

export function createPilotRequest(body: PilotRequestCreate): Promise<PilotRequestReceipt> {
  return request<PilotRequestReceipt>('/api/v1/pilot-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function listPilotRequests(status?: string): Promise<AdminPilotRequest[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return request<AdminPilotRequest[]>(`/api/v1/admin/pilot-requests${query}`)
}

export function decidePilotRequest(
  id: string,
  decision: 'APPROVED' | 'DECLINED',
  reason?: string,
): Promise<PilotDecisionResult> {
  return request<PilotDecisionResult>(
    `/api/v1/admin/pilot-requests/${encodeURIComponent(id)}/decision`,
    { method: 'POST', body: JSON.stringify({ decision, reason }) },
  )
}

export function previewSetupInvitation(token: string): Promise<SetupInvitationPreview> {
  return request<SetupInvitationPreview>(
    `/api/v1/setup-invitations/${encodeURIComponent(token)}`,
  )
}

export function acceptSetupInvitation(
  token: string,
  displayName: string,
  password: string,
): Promise<Session> {
  return request<Session>(`/api/v1/setup-invitations/${encodeURIComponent(token)}/accept`, {
    method: 'POST',
    body: JSON.stringify({ display_name: displayName, password }),
  })
}

type LegacyPageConnection = PageConnection | { state: 'NOT_CONNECTED'; can_moderate: false }

/** Accept the old response shape in tests and during a rolling deploy, while
 * using the backend-owned multi-Page collection route. */
export async function listFacebookConnections(): Promise<PageConnections> {
  const found = await request<PageConnections | LegacyPageConnection>(
    '/api/v1/facebook/connections',
  )
  if ('connections' in found) return found
  return {
    connections: found.state === 'CONNECTED' ? [found] : [],
    page_limit: 1,
    plan: 'STARTER',
  }
}

export function connectFacebookPageManually(pageAccessToken: string): Promise<PageConnection> {
  return request<PageConnection>('/api/v1/facebook/connections/manual', {
    method: 'POST',
    body: JSON.stringify({ page_access_token: pageAccessToken }),
  })
}

export function startFacebookAuthorization(): Promise<{ authorization_url: string }> {
  return request<{ authorization_url: string }>('/api/v1/facebook/oauth/start', {
    method: 'POST',
  })
}

export function listFacebookPageChoices(state: string): Promise<{ pages: PageChoice[] }> {
  return request<{ pages: PageChoice[] }>(
    `/api/v1/facebook/oauth/sessions/${encodeURIComponent(state)}`,
  )
}

export function selectFacebookPage(state: string, pageId: string): Promise<PageConnection> {
  return request<PageConnection>(
    `/api/v1/facebook/oauth/sessions/${encodeURIComponent(state)}/selection`,
    { method: 'POST', body: JSON.stringify({ page_id: pageId }) },
  )
}

export function syncFacebookComments(pageId: string): Promise<SyncResult> {
  return request<SyncResult>(
    `/api/v1/facebook/connections/${encodeURIComponent(pageId)}/sync`,
    { method: 'POST' },
  )
}

export function disconnectFacebookPage(pageId: string): Promise<void> {
  return request<void>(`/api/v1/facebook/connections/${encodeURIComponent(pageId)}`, {
    method: 'DELETE',
  })
}

export type Team = components['schemas']['Team']
export type Member = components['schemas']['Member']
export type CreatedInvitation = components['schemas']['CreatedInvitation']
export type InvitationPreview = components['schemas']['InvitationPreview']

export function getTeam(): Promise<Team> {
  return request<Team>('/api/v1/team')
}

export function createInvitation(role: 'owner' | 'member'): Promise<CreatedInvitation> {
  return request<CreatedInvitation>('/api/v1/team/invitations', {
    method: 'POST',
    body: JSON.stringify({ role }),
  })
}

export function revokeInvitation(tokenHash: string): Promise<void> {
  return request<void>(`/api/v1/team/invitations/${encodeURIComponent(tokenHash)}`, {
    method: 'DELETE',
  })
}

export function previewInvitation(token: string): Promise<InvitationPreview> {
  return request<InvitationPreview>(
    `/api/v1/team/invitations/${encodeURIComponent(token)}/preview`,
  )
}

export function acceptInvitation(token: string): Promise<{ workspace_name: string }> {
  return request<{ workspace_name: string }>(
    `/api/v1/team/invitations/${encodeURIComponent(token)}/accept`,
    { method: 'POST' },
  )
}

export function removeMember(userId: string): Promise<void> {
  return request<void>(`/api/v1/team/members/${encodeURIComponent(userId)}`, { method: 'DELETE' })
}

/** Leave the workspace you are in. Needs no permission from its owner. */
export function leaveWorkspace(): Promise<void> {
  return request<void>('/api/v1/team/membership', { method: 'DELETE' })
}

export type WorkspaceSettings = components['schemas']['WorkspaceSettings']

export function removeSampleComments(): Promise<{ removed: number }> {
  return request<{ removed: number }>('/api/v1/comments/samples', { method: 'DELETE' })
}

export function getSettings(): Promise<WorkspaceSettings> {
  return request<WorkspaceSettings>('/api/v1/settings')
}

export function renameWorkspace(name: string): Promise<WorkspaceSettings> {
  return request<WorkspaceSettings>('/api/v1/settings/workspace', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function renameSelf(displayName: string): Promise<WorkspaceSettings> {
  return request<WorkspaceSettings>('/api/v1/settings/me', {
    method: 'PATCH',
    body: JSON.stringify({ display_name: displayName }),
  })
}

export type AutoDeleteDelayMinutes = components['schemas']['SetAutoDeleteDelay']['delay_minutes']

export function setAutoDeleteDelay(delayMinutes: AutoDeleteDelayMinutes): Promise<WorkspaceSettings> {
  return request<WorkspaceSettings>('/api/v1/settings/auto-delete', {
    method: 'PATCH',
    body: JSON.stringify({ delay_minutes: delayMinutes }),
  })
}

export function setAutoHideOffensive(enabled: boolean): Promise<WorkspaceSettings> {
  return request<WorkspaceSettings>('/api/v1/settings/auto-hide-offensive', {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  })
}

export function setKeywordAllowlist(keywords: string[]): Promise<WorkspaceSettings> {
  return request<WorkspaceSettings>('/api/v1/settings/keyword-allowlist', {
    method: 'PATCH',
    body: JSON.stringify({ keywords }),
  })
}

export function setKeywordBlocklist(keywords: string[]): Promise<WorkspaceSettings> {
  return request<WorkspaceSettings>('/api/v1/settings/keyword-blocklist', {
    method: 'PATCH',
    body: JSON.stringify({ keywords }),
  })
}

/* ---- Moderation rules: this workspace's keywords -------------------------
 * Scoped to the workspace, never to the platform. Two severities only:
 * HARMFUL is taken off the Page automatically, OFFENSIVE goes to a reviewer.
 * There is no "safe" keyword — a word can surface a comment, never clear one.
 * ------------------------------------------------------------------------- */

export type KeywordSeverity = 'HARMFUL' | 'OFFENSIVE'
export type KeywordEntry = components['schemas']['KeywordEntry']

export function getKeywords(): Promise<KeywordEntry[]> {
  return request<KeywordEntry[]>('/api/v1/settings/keywords')
}

export function addKeyword(
  keyword: string,
  severity: KeywordSeverity,
  note?: string,
): Promise<KeywordEntry> {
  return request<KeywordEntry>('/api/v1/settings/keywords', {
    method: 'POST',
    body: JSON.stringify({ keyword, severity, note: note?.trim() || null }),
  })
}

export function removeKeyword(keyword: string): Promise<void> {
  return request<void>(
    `/api/v1/settings/keywords/${encodeURIComponent(keyword)}`,
    { method: 'DELETE' },
  )
}
