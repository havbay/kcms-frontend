import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import {
  type AdminAccessRequest, decideAccessRequest, listAccessRequests,
} from '../api/client'
import { copy, type Locale } from './copy'
import { useSession } from './session'

type AdminRequestsPageProps = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export function AdminRequestsPage({ locale, setLocale }: AdminRequestsPageProps) {
  const content = copy[locale]
  const session = useSession()
  const [rows, setRows] = useState<AdminAccessRequest[]>([])
  const [pendingOnly, setPendingOnly] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [declining, setDeclining] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async (onlyPending: boolean) => {
    try {
      setRows(await listAccessRequests(onlyPending ? 'PENDING' : undefined))
    } catch {
      setRows([])
    } finally {
      setLoaded(true)
    }
  }, [])

  // Only fetch once we know the viewer is an administrator. Firing first and
  // redirecting after leaves a 403 in the console of every ordinary visitor.
  const isAdmin = session.user?.is_platform_admin === true
  useEffect(() => {
    if (!isAdmin) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(pendingOnly)
  }, [isAdmin, load, pendingOnly])

  // Presentation only: the API enforces this independently on every request.
  if (session.status === 'checking') return null
  if (session.status === 'signed-out') return <Navigate replace to="/sign-in" />
  if (!isAdmin) return <Navigate replace to="/app" />

  async function decide(id: string, decision: 'APPROVED' | 'DECLINED') {
    setBusy(id)
    try {
      await decideAccessRequest(id, decision, decision === 'DECLINED' ? reason.trim() : undefined)
      setDeclining(null)
      setReason('')
      await load(pendingOnly)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="site admin-shell" lang={locale === 'km' ? 'km' : 'en'}>
      <header className="app-header">
        <div className="app-header-left">
          <span aria-hidden="true" className="brand-mark"><span /><span /></span>
          <div>
            <h1>{content.adminOps}</h1>
            <p>{content.adminTitle}</p>
          </div>
        </div>
        <div className="app-header-actions">
          <button
            aria-pressed={locale === 'km'}
            className="language-toggle"
            onClick={() => setLocale(locale === 'en' ? 'km' : 'en')}
            type="button"
          >
            <img alt="" aria-hidden="true" className="language-flag"
                 src={locale === 'en' ? '/flags/kh.svg' : '/flags/gb.svg'} />
            {content.language}
          </button>
          <Link className="text-link" to="/app">{content.dashNavOverview}</Link>
        </div>
      </header>

      <main className="dash-body">
        <div className="admin-filters" role="group" aria-label={content.adminTitle}>
          <button aria-pressed={pendingOnly} className="filter-chip"
                  onClick={() => setPendingOnly(true)} type="button">
            {content.adminPending}
          </button>
          <button aria-pressed={!pendingOnly} className="filter-chip"
                  onClick={() => setPendingOnly(false)} type="button">
            {content.adminAll}
          </button>
        </div>

        {!loaded && <p className="work-status" role="status">{content.modLoading}</p>}
        {loaded && rows.length === 0 && <p className="work-status">{content.adminEmpty}</p>}

        <ul className="admin-list">
          {rows.map((row) => (
            <li className="admin-card" data-status={row.status} key={row.id}>
              <div className="admin-card-head">
                <h2>{row.workspace_name}</h2>
                <span className={`work-chip status-${row.status}`}>{row.status}</span>
              </div>
              <p className="admin-requester">
                {row.requester_name}
                {row.requester_email && <> · {row.requester_email}</>}
              </p>
              <p className="admin-page">{row.page_name}</p>
              <p className="admin-meta">
                {content[`vol${row.monthly_comments}` as keyof typeof content] as string}{' '}
                {content.adminMonthly} ·{' '}
                {content[`team${row.team_size}` as keyof typeof content] as string}{' '}
                {content.adminModerators}
              </p>
              {row.note && <blockquote className="admin-note">{row.note}</blockquote>}
              {row.decision_reason && (
                <p className="admin-decision">{row.decision_reason}</p>
              )}

              {row.status === 'PENDING' && declining !== row.id && (
                <div className="admin-actions">
                  <button className="button button-small" disabled={busy === row.id}
                          onClick={() => void decide(row.id, 'APPROVED')} type="button">
                    {content.adminApprove}
                  </button>
                  <button className="button button-small button-quiet"
                          onClick={() => { setDeclining(row.id); setReason('') }} type="button">
                    {content.adminDecline}
                  </button>
                </div>
              )}

              {declining === row.id && (
                <div className="admin-decline">
                  <label htmlFor={`reason-${row.id}`}>{content.adminReason}</label>
                  <textarea id={`reason-${row.id}`} onChange={(e) => setReason(e.target.value)}
                            rows={2} value={reason} />
                  <p className="auth-field-hint">{content.adminReasonHint}</p>
                  <div className="admin-actions">
                    <button className="button button-small" disabled={!reason.trim() || busy === row.id}
                            onClick={() => void decide(row.id, 'DECLINED')} type="button">
                      {content.adminConfirmDecline}
                    </button>
                    <button className="button button-small button-quiet"
                            onClick={() => setDeclining(null)} type="button">
                      {content.adminCancel}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
