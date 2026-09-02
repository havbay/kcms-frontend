import { useCallback, useEffect, useState } from 'react'

import { getSummary, type Summary } from '../api/client'
import { copy, type Locale } from './copy'

type OverviewPageProps = { locale: Locale }
type LoadState = 'loading' | 'ready' | 'error'


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
  const [state, setState] = useState<LoadState>('loading')
  const [slow, setSlow] = useState(false)

  const load = useCallback(async () => {
    const slowTimer = setTimeout(() => setSlow(true), 3000)
    try {
      setSummary(await getSummary())
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

  return (
    <main className="dash-body overview-page">
      <header className="dash-head ov-head">
        <div className="dash-head-text">
          <div className="ov-title-row">
            <h1>{content.dashOverviewTitle}</h1>
            <span className="ov-live-pill">
              <span className="ov-live-dot" />
              <span>{locale === 'km' ? 'ស្ថានភាពបច្ចុប្បន្ន' : 'Current'}</span>
            </span>
          </div>
          <p>{locale === 'km' ? 'ទិន្នន័យគ្រប់គ្រងមតិយោបល់ និងស្ថានភាពជួររង់ចាំ' : 'Moderation metrics and current queue status.'}</p>
        </div>
      </header>

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
                const pct = Math.min(
                  100,
                  Math.round((row.count / Math.max(s.need_review, 1)) * 100),
                )
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
                  {s.deleted > 0 && (
                    <span
                      className="outcome-segment is-deleted"
                      style={{ inlineSize: `${(s.deleted / totalOutcomes) * 100}%` }}
                      title={`${content.dashDeleted}: ${s.deleted}`}
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
                  <li className="outcome-item is-deleted">
                    <div className="outcome-marker" />
                    <span className="outcome-label">{content.dashDeleted}</span>
                    <strong className="outcome-value">
                      {s.deleted} <small>({Math.round((s.deleted / totalOutcomes) * 100)}%)</small>
                    </strong>
                  </li>
                </ul>
              </div>
            ) : (
              <p className="dash-empty">{content.dashNoOutcomes}</p>
            )}
          </section>

        </div>
      </div>
    </main>
  )
}
