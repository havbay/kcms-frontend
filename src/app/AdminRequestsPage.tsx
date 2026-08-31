import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import {
  type AdminAccessRequest,
  type AdminPilotRequest,
  type PilotDecisionResult,
  decideAccessRequest,
  decidePilotRequest,
  listAccessRequests,
  listPilotRequests,
} from '../api/client'
import { copy, type Locale } from './copy'
import { useSession } from './session'

type Props = { locale: Locale; setLocale: (locale: Locale) => void }
type Queue = 'pilots' | 'connections'

export function AdminRequestsPage({ locale, setLocale }: Props) {
  const content = copy[locale]
  const session = useSession()
  const [queue, setQueue] = useState<Queue>('pilots')
  const [pilotRows, setPilotRows] = useState<AdminPilotRequest[]>([])
  const [connectionRows, setConnectionRows] = useState<AdminAccessRequest[]>([])
  const [pendingOnly, setPendingOnly] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [declining, setDeclining] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [delivery, setDelivery] = useState<Record<string, PilotDecisionResult>>({})

  const load = useCallback(async (selected: Queue, onlyPending: boolean) => {
    setLoaded(false)
    try {
      if (selected === 'pilots') {
        setPilotRows(await listPilotRequests(onlyPending ? 'PENDING' : undefined))
      } else {
        setConnectionRows(await listAccessRequests(onlyPending ? 'PENDING' : undefined))
      }
    } catch {
      if (selected === 'pilots') setPilotRows([])
      else setConnectionRows([])
    } finally {
      setLoaded(true)
    }
  }, [])

  const isAdmin = session.user?.is_platform_admin === true
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAdmin) void load(queue, pendingOnly)
  }, [isAdmin, load, pendingOnly, queue])

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

  async function decideConnection(id: string, decision: 'APPROVED' | 'DECLINED') {
    setBusy(id)
    try {
      await decideAccessRequest(
        id, decision, decision === 'DECLINED' ? reason.trim() : undefined,
      )
      setDeclining(null)
      setReason('')
      await load(queue, pendingOnly)
    } finally {
      setBusy(null)
    }
  }

  const rows = queue === 'pilots' ? pilotRows : connectionRows

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
          <div className="admin-filters" role="group" aria-label={locale === 'km' ? 'ប្រភេទសំណើ' : 'Request type'}>
            <button aria-pressed={queue === 'pilots'} className="filter-chip" onClick={() => setQueue('pilots')} type="button">{locale === 'km' ? 'សាកល្បងថ្មី' : 'New pilots'}</button>
            <button aria-pressed={queue === 'connections'} className="filter-chip" onClick={() => setQueue('connections')} type="button">{locale === 'km' ? 'ភ្ជាប់ទំព័រ' : 'Page connections'}</button>
          </div>
          <div className="admin-filters" role="group" aria-label={content.adminTitle}>
            <button aria-pressed={pendingOnly} className="filter-chip" onClick={() => setPendingOnly(true)} type="button">{content.adminPending}</button>
            <button aria-pressed={!pendingOnly} className="filter-chip" onClick={() => setPendingOnly(false)} type="button">{content.adminAll}</button>
          </div>
        </div>

        {!loaded && <p className="work-status" role="status">{content.modLoading}</p>}
        {loaded && rows.length === 0 && <p className="work-status">{content.adminEmpty}</p>}

        {queue === 'pilots' ? (
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
        ) : (
          <ul className="admin-list">
            {connectionRows.map((row) => (
              <li className="admin-card" data-status={row.status} key={row.id}>
                <div className="admin-card-head"><h2>{row.workspace_name}</h2><span className={`work-chip status-${row.status}`}>{row.status}</span></div>
                <p className="admin-requester">{row.requester_name}{row.requester_email && <> · {row.requester_email}</>}</p>
                <p className="admin-page">{row.page_name}</p>
                {row.note && <blockquote className="admin-note">{row.note}</blockquote>}
                {row.status === 'PENDING' && declining !== row.id && (
                  <div className="admin-actions">
                    <button className="button button-small" disabled={busy === row.id} onClick={() => void decideConnection(row.id, 'APPROVED')} type="button">{content.adminApprove}</button>
                    <button className="button button-small button-quiet" onClick={() => { setDeclining(row.id); setReason('') }} type="button">{content.adminDecline}</button>
                  </div>
                )}
                {declining === row.id && (
                  <DeclineBox busy={busy} content={content} id={row.id} onCancel={() => setDeclining(null)} onConfirm={() => void decideConnection(row.id, 'DECLINED')} onReason={setReason} reason={reason} />
                )}
              </li>
            ))}
          </ul>
        )}
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
