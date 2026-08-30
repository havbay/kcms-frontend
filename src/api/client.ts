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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    // Network failure, CORS rejection, or a cold backend that timed out.
    throw new ApiError(0, 'unreachable')
  }
  if (!response.ok) {
    throw new ApiError(response.status, `request failed with ${response.status}`)
  }
  return (await response.json()) as T
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
