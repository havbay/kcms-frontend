import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import {
  type AdminPilotRequest,
  type PilotDecisionResult,
  decidePilotRequest,
  listPilotRequests,
} from '../api/client'
import { copy, type Locale } from './copy'
import { useSession } from './session'

type Props = { locale: Locale; setLocale: (locale: Locale) => void }
export function AdminRequestsPage({ locale, setLocale }: Props) {
  const content = copy[locale]
  const session = useSession()
  const [pilotRows, setPilotRows] = useState<AdminPilotRequest[]>([])
  const [pendingOnly, setPendingOnly] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [declining, setDeclining] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [delivery, setDelivery] = useState<Record<string, PilotDecisionResult>>({})

  const load = useCallback(async (onlyPending: boolean) => {
    setLoaded(false)
    try {
      setPilotRows(await listPilotRequests(onlyPending ? 'PENDING' : undefined))
    } catch {
      setPilotRows([])
    } finally {
      setLoaded(true)
    }
  }, [])

  const isAdmin = session.user?.is_platform_admin === true
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAdmin) void load(pendingOnly)
  }, [isAdmin, load, pendingOnly])

  if (session.status === 'checking') return null
  if (session.status === 'signed-out') return <Navigate replace to="/sign-in" />
  if (!isAdmin) return <Navigate replace to="/app" />

  async function decidePilot(id: string, decision: 'APPROVED' | 'DECLINED') {
    setBusy(id)
    try {
      const result = await decidePilotRequest(
        id, decision, decision === 'DECLINED' ? reason.trim() : undefined,
      )
      setDelivery((current) => ({ ...current, [id]: result }))
      setPilotRows((rows) => rows.map((row) => (
        row.id === id ? { ...row, status: result.status } : row
      )))
      setDeclining(null)
      setReason('')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="site admin-shell" lang={locale === 'km' ? 'km' : 'en'}>
      <header className="app-header">
        <div className="app-header-left">
          <span aria-hidden="true" className="brand-mark"><span /><span /></span>
          <div><h1>{content.adminOps}</h1><p>{content.adminTitle}</p></div>
        </div>
        <div className="app-header-actions">
          <button className="language-toggle" onClick={() => setLocale(locale === 'en' ? 'km' : 'en')} type="button">{content.language}</button>
          <Link className="text-link" to="/app">{content.dashNavOverview}</Link>
        </div>
      </header>

      <main className="dash-body">
        <div className="admin-toolbar">
          <div className="admin-filters" role="group" aria-label={content.adminTitle}>
            <button aria-pressed={pendingOnly} className="filter-chip" onClick={() => setPendingOnly(true)} type="button">{content.adminPending}</button>
            <button aria-pressed={!pendingOnly} className="filter-chip" onClick={() => setPendingOnly(false)} type="button">{content.adminAll}</button>
          </div>
        </div>

        {!loaded && <p className="work-status" role="status">{content.modLoading}</p>}
        {loaded && pilotRows.length === 0 && <p className="work-status">{content.adminEmpty}</p>}

        <ul className="admin-list">
            {pilotRows.map((row) => {
              const result = delivery[row.id]
              return (
                <li className="admin-card" data-status={row.status} key={row.id}>
                  <div className="admin-card-head"><h2>{row.organization}</h2><span className={`work-chip status-${row.status}`}>{row.status}</span></div>
                  <p className="admin-requester">{row.name} · {row.email}</p>
                  <p className="admin-page">{row.facebook_page}</p>
                  {row.note && <blockquote className="admin-note">{row.note}</blockquote>}
                  {row.status === 'PENDING' && declining !== row.id && (
                    <div className="admin-actions">
                      <button className="button button-small" disabled={busy === row.id} onClick={() => void decidePilot(row.id, 'APPROVED')} type="button">{content.adminApprove}</button>
                      <button className="button button-small button-quiet" onClick={() => { setDeclining(row.id); setReason('') }} type="button">{content.adminDecline}</button>
                    </div>
                  )}
                  {declining === row.id && (
                    <DeclineBox busy={busy} content={content} id={row.id} onCancel={() => setDeclining(null)} onConfirm={() => void decidePilot(row.id, 'DECLINED')} onReason={setReason} reason={reason} />
                  )}
                  {result && (
                    <div className="delivery-result" data-status={result.delivery_status}>
                      <strong>{result.delivery_status === 'SENT' ? 'Approval email sent.' : 'Email not sent—share this link manually.'}</strong>
                      {result.invitation_url && (
                        <div className="delivery-link">
                          <input aria-label="Setup invitation link" readOnly value={result.invitation_url} />
                          <button className="button button-small button-quiet" onClick={() => void navigator.clipboard?.writeText(result.invitation_url!)} type="button">Copy link</button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
        </ul>
      </main>
    </div>
  )
}

function DeclineBox({ content, id, reason, busy, onReason, onCancel, onConfirm }: {
  content: {
    adminReason: string
    adminReasonHint: string
    adminConfirmDecline: string
    adminCancel: string
  }
  id: string
  reason: string
  busy: string | null
  onReason: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="admin-decline">
      <label htmlFor={`reason-${id}`}>{content.adminReason}</label>
      <textarea id={`reason-${id}`} onChange={(event) => onReason(event.target.value)} rows={2} value={reason} />
      <p className="auth-field-hint">{content.adminReasonHint}</p>
      <div className="admin-actions">
        <button className="button button-small" disabled={!reason.trim() || busy === id} onClick={onConfirm} type="button">{content.adminConfirmDecline}</button>
        <button className="button button-small button-quiet" onClick={onCancel} type="button">{content.adminCancel}</button>
      </div>
    </div>
  )
}
