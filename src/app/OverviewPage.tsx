import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getSummary,
  listComments,
  listFacebookConnections,
  recordAction,
  syncFacebookComments,
  type PageConnections,
  type Summary,
  type WorkListItem,
} from '../api/client'
import { copy, type Locale } from './copy'

type OverviewPageProps = { locale: Locale }
type LoadState = 'loading' | 'ready' | 'error'

const AVATAR_PALETTES = [
  { bg: '#e6f4f2', color: '#0b6b63', border: 'rgba(11, 107, 99, 0.25)' },
  { bg: '#fef3e6', color: '#b25e00', border: 'rgba(194, 106, 10, 0.25)' },
  { bg: '#f3effc', color: '#5b3aa8', border: 'rgba(122, 92, 196, 0.25)' },
  { bg: '#eaf4fe', color: '#1864cc', border: 'rgba(24, 119, 242, 0.25)' },
  { bg: '#e8f7ec', color: '#196e38', border: 'rgba(25, 110, 56, 0.25)' },
]

function getAuthorInfo(authorRef: string, locale: Locale) {
  let hash = 0
  for (let i = 0; i < authorRef.length; i++) {
    hash = (hash * 31 + authorRef.charCodeAt(i)) >>> 0
  }
  const palette = AVATAR_PALETTES[hash % AVATAR_PALETTES.length]!

  if (authorRef.startsWith('fb:')) {
    const rawId = authorRef.slice(3)
    const shortId = rawId.length > 8 ? `${rawId.slice(0, 4)}…${rawId.slice(-3)}` : rawId
    return {
      name: locale === 'km' ? 'អ្នកប្រើប្រាស់ Facebook' : 'Facebook User',
      handle: `@${shortId}`,
      initials: 'FB',
      ...palette,
    }
  }

  const userMatch = authorRef.match(/^user-([a-zA-Z0-9]+)$/i)
  if (userMatch && userMatch[1]) {
    const key = userMatch[1].toUpperCase()
    return {
      name: locale === 'km' ? `សមាជិក ${key}` : `Member ${key}`,
      handle: `@user_${key.toLowerCase()}`,
      initials: key,
      ...palette,
    }
  }

  return {
    name: authorRef,
    handle: `@${authorRef.toLowerCase().replace(/\s+/g, '_')}`,
    initials: authorRef.slice(0, 2).toUpperCase(),
    ...palette,
  }
}

function formatRelativeTime(dateStr: string, locale: Locale): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return locale === 'km' ? 'មុននេះ' : 'Just now'
    if (diffMins < 60) return locale === 'km' ? `${diffMins} នាទីមុន` : `${diffMins}m ago`
    if (diffHours < 24) return locale === 'km' ? `${diffHours} ម៉ោងមុន` : `${diffHours}h ago`
    return locale === 'km' ? `${diffDays} ថ្ងៃមុន` : `${diffDays}d ago`
  } catch {
    return dateStr
  }
}

function getShortReasonLabel(reason: string, locale: Locale): string {
  const isKm = locale === 'km'
  switch (reason) {
    case 'triage':
    case 'PERSON_DIRECTED_ABUSE':
      return isKm ? 'អាចមានគ្រោះថ្នាក់' : 'Possible harm'
    case 'institution_sample':
    case 'INSTITUTIONAL_COMPLAINT':
      return isKm ? 'ការរិះគន់ស្ថាប័ន' : 'Organization criticism'
    case 'novel_language':
    case 'UNKNOWN_SLANG':
      return isKm ? 'ពាក្យស្លោកមិនស្គាល់' : 'Unfamiliar slang'
    case 'uncertainty':
    case 'HIGH_RISK_KEYWORD':
      return isKm ? 'ពាក្យគន្លឹះប្រឈម' : 'Low confidence'
    case 'SCAM_OR_FRAUD':
      return isKm ? 'ការបោកប្រាស់' : 'Scam & fraud'
    case 'cleared':
      return isKm ? 'សុវត្ថិភាព' : 'Cleared'
    default:
      return reason.replace(/_/g, ' ')
  }
}

function getReasonMeta(reason: string) {
  switch (reason) {
    case 'triage':
    case 'PERSON_DIRECTED_ABUSE':
      return {
        tone: 'harm',
        dotColor: '#dc2626',
        bgPill: 'rgba(220, 38, 38, 0.1)',
        textPill: '#b91c1c',
      }
    case 'institution_sample':
    case 'INSTITUTIONAL_COMPLAINT':
      return {
        tone: 'org',
        dotColor: '#0b6b63',
        bgPill: 'rgba(11, 107, 99, 0.1)',
        textPill: '#0b6b63',
      }
    case 'novel_language':
    case 'UNKNOWN_SLANG':
      return {
        tone: 'slang',
        dotColor: '#7c3aed',
        bgPill: 'rgba(124, 58, 237, 0.1)',
        textPill: '#6d28d9',
      }
    case 'uncertainty':
    case 'HIGH_RISK_KEYWORD':
      return {
        tone: 'warn',
        dotColor: '#d97706',
        bgPill: 'rgba(217, 119, 6, 0.1)',
        textPill: '#b45309',
      }
    case 'SCAM_OR_FRAUD':
      return {
        tone: 'scam',
        dotColor: '#ea580c',
        bgPill: 'rgba(234, 88, 12, 0.1)',
        textPill: '#c2410c',
      }
    default:
      return {
        tone: 'default',
        dotColor: '#0b6b63',
        bgPill: 'rgba(11, 107, 99, 0.1)',
        textPill: '#0b6b63',
      }
  }
}

export function OverviewPage({ locale }: OverviewPageProps) {
  const content = copy[locale]
  const [summary, setSummary] = useState<Summary | null>(null)
  const [connections, setConnections] = useState<PageConnections | null>(null)
  const [recentQueue, setRecentQueue] = useState<WorkListItem[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [slow, setSlow] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncNote, setSyncNote] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const slowTimer = setTimeout(() => setSlow(true), 3000)
    try {
      const [sumRes, connRes, queueRes] = await Promise.allSettled([
        getSummary(),
        listFacebookConnections(),
        listComments({ reviewStatus: 'PENDING', limit: 3 }),
      ])

      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value)
      } else {
        throw sumRes.reason
      }

      if (connRes.status === 'fulfilled') {
        setConnections(connRes.value)
      }
      if (queueRes.status === 'fulfilled') {
        setRecentQueue(queueRes.value.items || [])
      }

      setState('ready')
    } catch {
      setState('error')
    } finally {
      clearTimeout(slowTimer)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const syncNow = async () => {
    setSyncing(true)
    setSyncNote(null)
    try {
      const connRes = await listFacebookConnections()
      const conns = connRes?.connections || []
      if (conns.length === 0) {
        setSyncNote(locale === 'km' ? 'សូមភ្ជាប់ Facebook Page ជាមុន' : 'No Facebook Page connected')
        return
      }
      let importedTotal = 0
      for (const c of conns) {
        const res = await syncFacebookComments(c.page_id)
        importedTotal += res.imported
      }
      setSyncNote(
        importedTotal > 0
          ? (locale === 'km' ? `បាននាំចូល ${importedTotal} មតិយោបល់ថ្មី` : `Imported ${importedTotal} new comment${importedTotal === 1 ? '' : 's'}`)
          : (locale === 'km' ? 'គ្មានមតិយោបល់ថ្មីទេ' : 'All comments up to date')
      )
      await load()
    } catch {
      setSyncNote(locale === 'km' ? 'មិនអាចទាក់ទង Facebook បានទេ' : 'Sync failed. Check connection.')
    } finally {
      setSyncing(false)
    }
  }

  const handleQuickAction = async (commentId: string, kind: 'LEAVE' | 'HIDE') => {
    setActingId(commentId)
    try {
      await recordAction(commentId, kind)
      await load()
    } catch {
      // ignore
    } finally {
      setActingId(null)
    }
  }

  if (state === 'loading') {
    return (
      <main className="dash-body">
        <p className="work-status" role="status">
          <span aria-hidden="true" className="work-spinner" />
          {slow ? content.modWaking : content.modLoading}
        </p>
      </main>
    )
  }

  if (state === 'error') {
    return (
      <main className="dash-body">
        <div className="work-error" role="alert">
          <strong>{content.modErrorTitle}</strong>
          <p>{content.modErrorBody}</p>
          <button className="button" onClick={() => { setState('loading'); setSlow(false); void load() }} type="button">
            {content.modRetry}
          </button>
        </div>
      </main>
    )
  }

  if (!summary) return null
  const s = summary
  const totalOutcomes = Math.max(s.reviewed, 1)
  const connectedPagesList = connections?.connections || []
  const activePage = connectedPagesList[0]

  return (
    <main className="dash-body overview-page">
      <header className="dash-head ov-head">
        <div className="dash-head-text">
          <div className="ov-title-row">
            <h1>{content.dashOverviewTitle}</h1>
            <span className="ov-live-pill">
              <span className="ov-live-dot" />
              <span>{locale === 'km' ? 'សកម្ម' : 'Live'}</span>
            </span>
          </div>
          <p>{locale === 'km' ? 'ទិន្នន័យគ្រប់គ្រងមតិយោបល់ និងស្ថានភាពជួររង់ចាំ' : 'Real-time moderation metrics and queue status.'}</p>
        </div>
        <div className="dash-head-actions">
          <button
            className="button button-quiet ov-sync-btn"
            disabled={syncing}
            onClick={() => void syncNow()}
            type="button"
          >
            <span className={`ov-sync-icon ${syncing ? 'is-spinning' : ''}`}>⚡</span>
            <span>{syncing ? (locale === 'km' ? 'កំពុងទាញ…' : 'Syncing…') : (locale === 'km' ? 'ទាញពី Facebook' : 'Sync Facebook')}</span>
          </button>
          <Link className="button button-primary ov-cta-btn" to="/app/moderate">
            <span>{content.dashOpenModerate}</span>
            {s.need_review > 0 && <span className="ov-badge-count">{s.need_review}</span>}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      {syncNote && (
        <div className="ov-sync-toast" role="status">
          <span>{syncNote}</span>
          <button className="ov-toast-close" onClick={() => setSyncNote(null)} type="button">✕</button>
        </div>
      )}

      {/* 4 Hero KPI Cards */}
      <ul className="stat-row ov-kpi-grid">
        <li className="stat stat-primary ov-stat-card" data-tone="teal">
          <div className="stat-header">
            <span className="stat-label">{content.dashProcessed}</span>
            <div className="stat-icon-wrap is-teal" aria-hidden="true">
              <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
            </div>
          </div>
          <span className="stat-value">{s.processed}</span>
          <span className="stat-hint">{locale === 'km' ? 'បានស្កេនសរុប' : 'Total scanned'}</span>
        </li>

        <li className="stat stat-warning ov-stat-card" data-tone="amber">
          <div className="stat-header">
            <span className="stat-label">{content.dashNeedReview}</span>
            <div className="stat-header-right">
              <span className="stat-pill">{locale === 'km' ? 'សកម្ម' : 'Active'}</span>
              <div className="stat-icon-wrap is-amber" aria-hidden="true">
                <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>
          </div>
          <span className="stat-value">{s.need_review}</span>
          <span className="stat-hint">{locale === 'km' ? 'រង់ចាំពិនិត្យ' : 'Pending review'}</span>
        </li>

        <li className="stat stat-success ov-stat-card" data-tone="teal">
          <div className="stat-header">
            <span className="stat-label">{content.dashReviewed}</span>
            <div className="stat-icon-wrap is-green" aria-hidden="true">
              <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <span className="stat-value">{s.reviewed}</span>
          <span className="stat-hint">{locale === 'km' ? 'បានពិនិត្យរួច' : 'Completed'}</span>
        </li>

        <li className="stat stat-pending ov-stat-card" data-tone="plain">
          <div className="stat-header">
            <span className="stat-label">{content.dashPending}</span>
            <div className="stat-icon-wrap is-purple" aria-hidden="true">
              <svg className="stat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <span className="stat-value">{s.pending}</span>
          <span className="stat-hint">{locale === 'km' ? 'ក្នុងជួរចាត់ថ្នាក់' : 'In triage'}</span>
        </li>
      </ul>

      {/* Main 2-Column Dashboard Grid */}
      <div className="dash-panels ov-panels-grid">
        {/* Left Column: Risk Categories Breakdown + Live Incidents Stream */}
        <div className="ov-col-main">
          {/* Risk Breakdown Panel */}
          <section className="dash-panel ov-panel ov-threats-panel">
            <div className="dash-panel-head">
              <div className="ov-panel-title-wrap">
                <div className="ov-icon-badge is-teal" aria-hidden="true">
                  <svg className="ov-panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h2>{content.dashBreakdown}</h2>
              </div>
              <span className="ov-cat-badge">{s.reasons.length} {locale === 'km' ? 'ប្រភេទ' : 'categories'}</span>
            </div>

            <ul className="ov-threat-list">
              {s.reasons.map((row) => {
                const pct = Math.round((row.count / Math.max(s.need_review, 1)) * 100)
                const shortLabel = getShortReasonLabel(row.surfaced_reason, locale)
                const meta = getReasonMeta(row.surfaced_reason)

                return (
                  <li className="ov-threat-card" key={row.surfaced_reason}>
                    <div className="ov-threat-header">
                      <div className="ov-threat-title-group">
                        <span className="ov-threat-dot" style={{ backgroundColor: meta.dotColor }} />
                        <strong className="ov-threat-name">{shortLabel}</strong>
                      </div>
                      <div className="ov-threat-metrics">
                        <strong className="ov-threat-count">{row.count}</strong>
                        <span
                          className="ov-threat-pill"
                          style={{ backgroundColor: meta.bgPill, color: meta.textPill }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>

                    <div className="ov-threat-track">
                      <span
                        aria-hidden="true"
                        className={`ov-threat-bar tone-${meta.tone}`}
                        style={{ inlineSize: `${pct}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Recent High Priority Comments Stream */}
          <section className="dash-panel ov-panel">
            <div className="dash-panel-head">
              <div className="ov-panel-title-wrap">
                <div className="ov-icon-badge is-amber" aria-hidden="true">
                  <svg className="ov-panel-icon is-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h2>{content.dashRecentIncidents}</h2>
              </div>
              <Link className="ov-link-action" to="/app/moderate">
                {content.dashViewAllQueue} →
              </Link>
            </div>
            {recentQueue.length > 0 ? (
              <ul className="ov-incident-list">
                {recentQueue.map((item) => {
                  const author = getAuthorInfo(item.author_ref, locale)
                  const sev = item.severity
                  const shortLabel = item.surfaced_reason ? getShortReasonLabel(item.surfaced_reason, locale) : ''

                  return (
                    <li className="ov-incident-card" key={item.comment_id}>
                      <div className="ov-incident-top">
                        <div className="ov-author-block">
                          <span
                            className="ov-author-avatar"
                            style={{
                              backgroundColor: author.bg,
                              color: author.color,
                              border: `1px solid ${author.border}`,
                            }}
                          >
                            {author.initials}
                          </span>
                          <div className="ov-author-info">
                            <strong>{author.name}</strong>
                            <span className="ov-time-text">{formatRelativeTime(item.posted_at, locale)}</span>
                          </div>
                        </div>
                        {sev && (
                          <span className={`work-chip severity-${sev.toLowerCase()}`}>
                            {content.modSeverity[sev as keyof typeof content.modSeverity] || sev}
                          </span>
                        )}
                      </div>
                      <p className="ov-comment-excerpt" lang="km">{item.text}</p>
                      <div className="ov-incident-footer">
                        <span className="ov-reason-tag">
                          {shortLabel}
                        </span>
                        <div className="ov-quick-actions">
                          <button
                            className="ov-btn-action is-leave"
                            disabled={actingId === item.comment_id}
                            onClick={() => void handleQuickAction(item.comment_id, 'LEAVE')}
                            type="button"
                            title={content.modLeave}
                          >
                            ✓ {content.modLeave}
                          </button>
                          <button
                            className="ov-btn-action is-hide"
                            disabled={actingId === item.comment_id}
                            onClick={() => void handleQuickAction(item.comment_id, 'HIDE')}
                            type="button"
                            title={content.modHide}
                          >
                            ✕ {content.modHide}
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="dash-empty">{content.dashNoRecentIncidents}</p>
            )}
          </section>
        </div>

        {/* Right Column: Outcomes Ratio + Page Health + Quick Actions */}
        <div className="ov-col-side">
          {/* Moderation Outcomes Panel */}
          <section className="dash-panel ov-panel ov-outcomes-panel">
            <div className="dash-panel-head">
              <div className="ov-panel-title-wrap">
                <div className="ov-icon-badge is-teal" aria-hidden="true">
                  <svg className="ov-panel-icon is-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <h2>{content.dashOutcomes}</h2>
              </div>
              <span className="ov-cat-badge">{s.reviewed} {locale === 'km' ? 'សរុប' : 'total'}</span>
            </div>
            {s.reviewed > 0 ? (
              <div className="outcomes-container ov-outcomes-wrap">
                <div className="outcomes-ratio-bar ov-ratio-bar">
                  {s.left_visible > 0 && (
                    <span
                      className="outcome-segment is-left"
                      style={{ inlineSize: `${(s.left_visible / totalOutcomes) * 100}%` }}
                      title={`${content.dashLeft}: ${s.left_visible}`}
                    />
                  )}
                  {s.hidden > 0 && (
                    <span
                      className="outcome-segment is-hidden"
                      style={{ inlineSize: `${(s.hidden / totalOutcomes) * 100}%` }}
                      title={`${content.dashHidden}: ${s.hidden}`}
                    />
                  )}
                  {s.unhidden > 0 && (
                    <span
                      className="outcome-segment is-unhidden"
                      style={{ inlineSize: `${(s.unhidden / totalOutcomes) * 100}%` }}
                      title={`${content.dashUnhidden}: ${s.unhidden}`}
                    />
                  )}
                </div>

                <ul className="outcome-list ov-outcome-list">
                  <li className="outcome-item is-left">
                    <div className="outcome-marker" />
                    <span className="outcome-label">{content.dashLeft}</span>
                    <strong className="outcome-value">
                      {s.left_visible} <small>({Math.round((s.left_visible / totalOutcomes) * 100)}%)</small>
                    </strong>
                  </li>
                  <li className="outcome-item is-hidden">
                    <div className="outcome-marker" />
                    <span className="outcome-label">{content.dashHidden}</span>
                    <strong className="outcome-value">
                      {s.hidden} <small>({Math.round((s.hidden / totalOutcomes) * 100)}%)</small>
                    </strong>
                  </li>
                  <li className="outcome-item is-unhidden">
                    <div className="outcome-marker" />
                    <span className="outcome-label">{content.dashUnhidden}</span>
                    <strong className="outcome-value">
                      {s.unhidden} <small>({Math.round((s.unhidden / totalOutcomes) * 100)}%)</small>
                    </strong>
                  </li>
                </ul>
              </div>
            ) : (
              <p className="dash-empty">{content.dashNoOutcomes}</p>
            )}
          </section>

          {/* Facebook Connection & Health Widget */}
          <section className="dash-panel ov-panel ov-health-panel">
            <div className="dash-panel-head">
              <div className="ov-panel-title-wrap">
                <div className="ov-icon-badge is-fb" aria-hidden="true">
                  <svg className="ov-fb-icon" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 3.925 23.094 9.101 24v-8.437H6.627v-2.49h2.474V9.9c0-2.457 1.457-3.813 3.678-3.813 1.066 0 2.18.19 2.18.19v2.4h-1.229c-1.21 0-1.587.755-1.587 1.53v1.837h2.7l-.431 2.49h-2.269V24C20.075 23.094 24 18.1 24 12.073z" />
                  </svg>
                </div>
                <h2>{content.dashPageHealthTitle}</h2>
              </div>
              <span className={`ov-health-pill ${activePage ? 'is-active' : 'is-idle'}`}>
                <span className="ov-health-dot" />
                <span>{activePage ? 'Active' : 'Not linked'}</span>
              </span>
            </div>
            <div className="ov-page-info-box">
              <div className="ov-page-main">
                <strong>{activePage?.page_name || 'Facebook Page'}</strong>
                <span className="ov-sync-hint">
                  ⚡ {activePage ? content.dashSyncActive : 'Link a Page to start sync'}
                </span>
              </div>
              <Link className="button button-small ov-manage-btn" to="/app/connect">
                {content.dashManagePages} →
              </Link>
            </div>
          </section>

          {/* Quick Operations Shortcuts */}
          <section className="dash-panel ov-panel ov-shortcuts-panel">
            <div className="dash-panel-head">
              <div className="ov-panel-title-wrap">
                <div className="ov-icon-badge is-purple" aria-hidden="true">
                  <svg className="ov-panel-icon is-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h2>{content.dashQuickShortcuts}</h2>
              </div>
            </div>
            <div className="ov-shortcuts-grid">
              <Link className="ov-shortcut-tile" to="/app/moderate">
                <div className="ov-shortcut-icon is-teal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <strong>{content.dashOpenModerate}</strong>
                  <small>{s.need_review} {locale === 'km' ? 'រង់ចាំ' : 'pending'}</small>
                </div>
              </Link>

              <Link className="ov-shortcut-tile" to="/app/settings">
                <div className="ov-shortcut-icon is-amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <div>
                  <strong>{content.dashShortcutRules}</strong>
                  <small>{locale === 'km' ? 'វិធាន' : 'Rules'}</small>
                </div>
              </Link>

              <Link className="ov-shortcut-tile" to="/app/team">
                <div className="ov-shortcut-icon is-purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <strong>{content.dashShortcutTeam}</strong>
                  <small>{locale === 'km' ? 'ក្រុម' : 'Team'}</small>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
