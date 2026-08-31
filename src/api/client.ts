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

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
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
    throw new ApiError(response.status, `request failed with ${response.status}`)
  }
  // 204 and other empty bodies must not be fed to json(): sign-out returns
  // No Content, and parsing it throws after the request already succeeded.
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T
  }
  const body = await response.text()
  return (body ? JSON.parse(body) : undefined) as T
}

export function listComments(): Promise<WorkList> {
  return request<WorkList>('/api/v1/comments')
}

export function recordAction(commentId: string, kind: ActionKind): Promise<HistoryEntry[]> {
  return request<HistoryEntry[]>(`/api/v1/comments/${encodeURIComponent(commentId)}/actions`, {
    method: 'POST',
    body: JSON.stringify({ kind, actor: 'demo-client' }),
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
    { method: 'POST', body: JSON.stringify({ severity, target, actor: 'demo-client' }) },
  )
}

export type AuthUser = components['schemas']['AuthUser']
export type Session = components['schemas']['Session']
export type Providers = components['schemas']['Providers']

export function listAuthProviders(): Promise<Providers> {
  return request<Providers>('/api/v1/auth/providers')
}

export function signUp(
  email: string,
  password: string,
  displayName: string,
  organization = '',
): Promise<Session> {
  return request<Session>('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      display_name: displayName,
      organization,
    }),
  })
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

export type AccessRequest = components['schemas']['AccessRequest']
export type AdminAccessRequest = components['schemas']['AdminAccessRequest']
export type MonthlyComments = components['schemas']['AccessRequestCreate']['monthly_comments']
export type TeamSize = components['schemas']['AccessRequestCreate']['team_size']

export function createAccessRequest(body: {
  page_name: string
  monthly_comments: MonthlyComments
  team_size: TeamSize
  note?: string | null
}): Promise<AccessRequest> {
  return request<AccessRequest>('/api/v1/access-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getMyAccessRequest(): Promise<AccessRequest | null> {
  return request<AccessRequest | null>('/api/v1/access-requests/mine')
}

export function listAccessRequests(status?: string): Promise<AdminAccessRequest[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return request<AdminAccessRequest[]>(`/api/v1/admin/access-requests${query}`)
}

export function decideAccessRequest(
  id: string,
  decision: 'APPROVED' | 'DECLINED',
  reason?: string,
): Promise<AccessRequest> {
  return request<AccessRequest>(`/api/v1/admin/access-requests/${encodeURIComponent(id)}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason }),
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
