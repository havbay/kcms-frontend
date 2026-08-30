import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { listComments, type WorkListItem } from '../api/client'
import { copy, type Locale } from './copy'

type OverviewPageProps = { locale: Locale }

type LoadState = 'loading' | 'ready' | 'error'

/** Every figure here is derived from real work-list data. Nothing is invented:
 *  if the backend has no actions yet, the outcomes panel says so rather than
 *  showing a zero that reads like a measured result. */
function summarise(items: WorkListItem[]) {
  const surfaced = items.filter((i) => i.surfaced_reason && i.surfaced_reason !== 'cleared')
  const reviewed = items.filter((i) => i.latest_action)
  const reasons = new Map<string, number>()
  for (const item of surfaced) {
    const key = item.surfaced_reason ?? 'cleared'
    reasons.set(key, (reasons.get(key) ?? 0) + 1)
  }
  const outcomes = { LEAVE: 0, HIDE: 0, UNHIDE: 0 }
  for (const item of reviewed) {
    if (item.latest_action && item.latest_action in outcomes) {
      outcomes[item.latest_action as keyof typeof outcomes] += 1
    }
  }
  return {
    processed: items.length,
    needReview: surfaced.length,
    reviewed: reviewed.length,
    pending: surfaced.filter((i) => !i.latest_action).length,
    reasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]),
    outcomes,
    hasOutcomes: reviewed.length > 0,
  }
}

export function OverviewPage({ locale }: OverviewPageProps) {
  const content = copy[locale]
  const [items, setItems] = useState<WorkListItem[]>([])
  const [state, setState] = useState<LoadState>('loading')

  const load = useCallback(async () => {
    try {
      const data = await listComments()
      setItems(data.items)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  if (state === 'loading') return <main className="dash-body"><p className="work-status" role="status">{content.modLoading}</p></main>
  if (state === 'error') {
    return (
      <main className="dash-body">
        <div className="work-error" role="alert">
          <strong>{content.modErrorTitle}</strong>
          <p>{content.modErrorBody}</p>
          <button className="button" onClick={() => { setState('loading'); void load() }} type="button">
            {content.modRetry}
          </button>
        </div>
      </main>
    )
  }

  const s = summarise(items)

  return (
    <main className="dash-body">
      <header className="dash-head">
        <h1>{content.dashOverviewTitle}</h1>
        <p>{content.dashOverviewSubtitle}</p>
      </header>

      <ul className="stat-row">
        {[
          { label: content.dashProcessed, value: s.processed },
          { label: content.dashNeedReview, value: s.needReview, tone: 'amber' },
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
            {s.reasons.map(([reason, count]) => (
              <li key={reason}>
                <span className="reason-name">
                  {content.modReasons[reason as keyof typeof content.modReasons] ?? reason}
                </span>
                <span aria-hidden="true" className="reason-bar" data-reason={reason}
                      style={{ inlineSize: `${Math.round((count / Math.max(s.needReview, 1)) * 100)}%` }} />
                <span className="reason-count">{count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="dash-panel">
          <h2>{content.dashOutcomes}</h2>
          {s.hasOutcomes ? (
            <ul className="outcome-list">
              <li><span>{content.dashLeft}</span><strong>{s.outcomes.LEAVE}</strong></li>
              <li><span>{content.dashHidden}</span><strong>{s.outcomes.HIDE}</strong></li>
              <li><span>{content.dashUnhidden}</span><strong>{s.outcomes.UNHIDE}</strong></li>
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
