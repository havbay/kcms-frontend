import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getSummary, type Summary } from '../api/client'
import { copy, type Locale } from './copy'

type OverviewPageProps = { locale: Locale }

type LoadState = 'loading' | 'ready' | 'error'

export function OverviewPage({ locale }: OverviewPageProps) {
  const content = copy[locale]
  const [summary, setSummary] = useState<Summary | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [slow, setSlow] = useState(false)

  const load = useCallback(async () => {
    // The free backend plan sleeps when idle and takes 30-60s to wake. Saying
    // so beats a spinner that looks frozen.
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

  return (
    <main className="dash-body">
      <header className="dash-head">
        <h1>{content.dashOverviewTitle}</h1>
        <p>{content.dashOverviewSubtitle}</p>
      </header>

      <ul className="stat-row">
        {[
          { label: content.dashProcessed, value: s.processed },
          { label: content.dashNeedReview, value: s.need_review, tone: 'amber' },
          { label: content.dashReviewed, value: s.reviewed },
          { label: content.dashPending, value: s.pending, tone: 'amber' },
        ].map((stat) => (
          <li className="stat" data-tone={stat.tone ?? 'plain'} key={stat.label}>
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </li>
        ))}
      </ul>

      <div className="dash-panels">
        <section className="dash-panel">
          <h2>{content.dashBreakdown}</h2>
          <ul className="reason-bars">
            {s.reasons.map((row) => (
              <li key={row.surfaced_reason}>
                <span className="reason-name">
                  {content.modReasons[
                    row.surfaced_reason as keyof typeof content.modReasons
                  ] ?? row.surfaced_reason}
                </span>
                <span aria-hidden="true" className="reason-bar" data-reason={row.surfaced_reason}
                      style={{
                        inlineSize: `${Math.min(100, Math.round((row.count / Math.max(s.need_review, 1)) * 100))}%`,
                      }} />
                <span className="reason-count">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="dash-panel">
          <h2>{content.dashOutcomes}</h2>
          {s.reviewed > 0 ? (
            <ul className="outcome-list">
              <li><span>{content.dashLeft}</span><strong>{s.left_visible}</strong></li>
              <li><span>{content.dashHidden}</span><strong>{s.hidden}</strong></li>
              <li><span>{content.dashUnhidden}</span><strong>{s.unhidden}</strong></li>
            </ul>
          ) : (
            <p className="dash-empty">{content.dashNoOutcomes}</p>
          )}
          <Link className="button button-small" to="/app/moderate">{content.dashOpenModerate}</Link>
        </section>
      </div>
    </main>
  )
}
