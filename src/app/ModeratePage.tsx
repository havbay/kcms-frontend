import { useCallback, useEffect, useState } from 'react'

import { type ActionKind, listComments, recordAction, type WorkListItem } from '../api/client'
import { copy, type Locale } from './copy'

type ModeratePageProps = {
  locale: Locale
}

type LoadState = 'loading' | 'ready' | 'error'

export function ModeratePage({ locale }: ModeratePageProps) {
  const content = copy[locale]
  const [items, setItems] = useState<WorkListItem[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [slow, setSlow] = useState(false)
  const [pending, setPending] = useState<string | null>(null)

  // No synchronous setState here: the component already starts in 'loading',
  // so the initial effect does not need to set it and cause a cascading render.
  const load = useCallback(async () => {
    // The free backend plan sleeps when idle. Say so rather than looking broken.
    const slowTimer = setTimeout(() => setSlow(true), 4000)
    try {
      const data = await listComments()
      setItems(data.items)
      setState('ready')
    } catch {
      setState('error')
    } finally {
      clearTimeout(slowTimer)
    }
  }, [])

  useEffect(() => {
    // Every setState inside load() runs after an await, so none of them are
    // synchronous within this effect. The rule cannot see past the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  function retry() {
    setState('loading')
    setSlow(false)
    void load()
  }

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

  return (
    <main className="work-list">
        {state === 'loading' && (
          <p className="work-status" role="status">
            {slow ? content.modWaking : content.modLoading}
          </p>
        )}

        {state === 'error' && (
          <div className="work-error" role="alert">
            <strong>{content.modErrorTitle}</strong>
            <p>{content.modErrorBody}</p>
            <button className="button" onClick={retry} type="button">
              {content.modRetry}
            </button>
          </div>
        )}

        {state === 'ready' && items.length === 0 && (
          <p className="work-status">{content.modEmpty}</p>
        )}

        {state === 'ready' && items.length > 0 && (
          <>
            <p className="work-count">{items.length} {content.modCounts}</p>
            <ul className="work-items">
              {items.map((item) => (
                <li
                  className="work-item"
                  data-reason={item.surfaced_reason ?? 'cleared'}
                  key={item.comment_id}
                >
                  <blockquote lang="km">{item.text}</blockquote>

                  <p className="work-tags">
                    {item.severity && (
                      <span className={`work-chip severity-${item.severity}`}>
                        {content.modSeverity[item.severity as keyof typeof content.modSeverity]}
                      </span>
                    )}
                    {item.target && (
                      <span className="work-chip target">
                        {content.modTarget[item.target as keyof typeof content.modTarget]}
                      </span>
                    )}
                    {item.abstain && <span className="work-chip abstain">{content.modAbstain}</span>}
                  </p>

                  <p className="work-reason">
                    <strong>{content.modWhySurfaced}:</strong>{' '}
                    {content.modReasons[
                      (item.surfaced_reason ?? 'cleared') as keyof typeof content.modReasons
                    ]}
                  </p>

                  {item.latest_action && (
                    <p className="work-latest">
                      {content.modActioned}: <strong>{item.latest_action}</strong>{' '}
                      {content.modBy} {item.latest_actor}
                    </p>
                  )}

                  <div className="work-actions">
                    <button
                      className="button button-small"
                      disabled={pending === item.comment_id}
                      onClick={() => void act(item.comment_id, 'LEAVE')}
                      type="button"
                    >
                      {content.modLeave}
                    </button>
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
                      onClick={() => void act(item.comment_id, 'UNHIDE')}
                      type="button"
                    >
                      {content.modUnhide}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
    </main>
  )
}
