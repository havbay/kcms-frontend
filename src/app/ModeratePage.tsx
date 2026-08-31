import { useCallback, useEffect, useState } from 'react'

import { type ActionKind, listComments, recordAction, type WorkListItem } from '../api/client'
import { CorrectionForm } from './CorrectionForm'
import { copy, type Locale } from './copy'

type ModeratePageProps = { locale: Locale }
type LoadState = 'loading' | 'ready' | 'error'

const PAGE_SIZE = 25

export function ModeratePage({ locale }: ModeratePageProps) {
  const content = copy[locale]
  const [items, setItems] = useState<WorkListItem[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [state, setState] = useState<LoadState>('loading')
  const [slow, setSlow] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(async (nextOffset: number) => {
    const slowTimer = setTimeout(() => setSlow(true), 3000)
    try {
      const page = await listComments(PAGE_SIZE, nextOffset)
      setItems(page.items)
      setTotal(page.total)
      setState('ready')
    } catch {
      setState('error')
    } finally {
      clearTimeout(slowTimer)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(offset)
  }, [load, offset])

  async function act(commentId: string, kind: ActionKind) {
    setPending(commentId)
    try {
      const history = await recordAction(commentId, kind)
      const latest = history[0]
      setItems((current) =>
        current.map((item) =>
          item.comment_id === commentId
            ? {
                ...item,
                latest_action: latest?.kind ?? item.latest_action,
                latest_actor: latest?.actor ?? item.latest_actor,
                latest_action_at: latest?.occurred_at ?? item.latest_action_at,
              }
            : item,
        ),
      )
    } catch {
      setState('error')
    } finally {
      setPending(null)
    }
  }

  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + PAGE_SIZE, total)

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
          <button className="button" onClick={() => { setState('loading'); void load(offset) }} type="button">
            {content.modRetry}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="dash-body">
      <header className="dash-head">
        <h1>{content.modTitle}</h1>
        <p>{content.modSubtitle}</p>
      </header>

      {total === 0 ? (
        <p className="work-status">{content.modEmpty}</p>
      ) : (
        <>
          {/* Scrolls inside its own container so the page never scrolls sideways. */}
          <div className="table-wrap">
            <table className="work-table">
              <thead>
                <tr>
                  <th scope="col">{content.colComment}</th>
                  <th scope="col">{content.colSeverity}</th>
                  <th scope="col">{content.colTarget}</th>
                  <th scope="col">{content.colReason}</th>
                  <th scope="col">{content.colStatus}</th>
                  <th scope="col"><span className="visually-hidden">{content.colActions}</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const expanded = open === item.comment_id
                  return [
                    <tr
                      className="work-row"
                      data-reason={item.surfaced_reason ?? 'cleared'}
                      key={item.comment_id}
                    >
                      <td className="cell-comment">
                        <button
                          aria-expanded={expanded}
                          className="row-open"
                          onClick={() => setOpen(expanded ? null : item.comment_id)}
                          type="button"
                        >
                          <span lang="km">{item.text}</span>
                        </button>
                      </td>
                      <td>
                        {item.severity && (
                          <span className={`work-chip severity-${item.severity}`}>
                            {content.modSeverity[item.severity as keyof typeof content.modSeverity]}
                          </span>
                        )}
                      </td>
                      <td className="cell-muted">
                        {item.target &&
                          content.modTarget[item.target as keyof typeof content.modTarget]}
                      </td>
                      <td className="cell-muted cell-reason">
                        {content.modReasons[
                          (item.surfaced_reason ?? 'cleared') as keyof typeof content.modReasons
                        ]}
                      </td>
                      <td>
                        <span className={`dot-status ${item.latest_action ? 'is-done' : 'is-pending'}`} />
                        {item.latest_action
                          ? `${item.latest_action}`
                          : content.statusPending}
                      </td>
                      <td className="cell-actions">
                        <button
                          className="button button-small button-quiet"
                          disabled={pending === item.comment_id}
                          onClick={() => void act(item.comment_id, 'HIDE')}
                          type="button"
                        >
                          {content.modHide}
                        </button>
                        <button
                          className="button button-small button-quiet"
                          disabled={pending === item.comment_id}
                          onClick={() => void act(item.comment_id, 'LEAVE')}
                          type="button"
                        >
                          {content.modLeave}
                        </button>
                      </td>
                    </tr>,
                    expanded && (
                      <tr className="work-detail" key={`${item.comment_id}-detail`}>
                        <td colSpan={6}>
                          <blockquote lang="km">{item.text}</blockquote>
                          <dl className="detail-facts">
                            <div>
                              <dt>{content.modConfidence}</dt>
                              <dd>
                                {Math.round((item.severity_confidence ?? 0) * 100)}% ·{' '}
                                {Math.round((item.target_confidence ?? 0) * 100)}%
                              </dd>
                            </div>
                            <div><dt>{content.pattern}</dt><dd>{item.model_version}</dd></div>
                            {item.rationale && (
                              <div><dt>{content.modWhySurfaced}</dt><dd>{item.rationale}</dd></div>
                            )}
                            {item.corrected_severity && (
                              <div>
                                <dt>{content.modCorrected}</dt>
                                <dd>
                                  {content.modSeverity[
                                    item.corrected_severity as keyof typeof content.modSeverity
                                  ]}
                                  {' · '}
                                  {content.modTarget[
                                    item.corrected_target as keyof typeof content.modTarget
                                  ]}
                                </dd>
                              </div>
                            )}
                            {item.latest_action && (
                              <div>
                                <dt>{content.modActioned}</dt>
                                <dd>{item.latest_action} {content.modBy} {item.latest_actor}</dd>
                              </div>
                            )}
                          </dl>
                          <div className="detail-actions">
                            <button
                              className="button button-small button-quiet"
                              disabled={pending === item.comment_id}
                              onClick={() => void act(item.comment_id, 'UNHIDE')}
                              type="button"
                            >
                              {content.modUnhide}
                            </button>
                            <CorrectionForm
                              commentId={item.comment_id}
                              currentSeverity={item.severity}
                              currentTarget={item.target}
                              locale={locale}
                              onSaved={(severity, target) =>
                                setItems((current) =>
                                  current.map((row) =>
                                    row.comment_id === item.comment_id
                                      ? {
                                          ...row,
                                          corrected_severity: severity,
                                          corrected_target: target,
                                          corrected_by: 'you',
                                        }
                                      : row,
                                  ),
                                )
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ),
                  ]
                })}
              </tbody>
            </table>
          </div>

          <nav aria-label="Pagination" className="pager">
            <p>
              {content.pageShowing} {from}–{to} {content.pageOf} {total}
            </p>
            <div>
              <button
                className="button button-small button-quiet"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                type="button"
              >
                {content.pagePrev}
              </button>
              <button
                className="button button-small button-quiet"
                disabled={to >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
                type="button"
              >
                {content.pageNext}
              </button>
            </div>
          </nav>
        </>
      )}
    </main>
  )
}
