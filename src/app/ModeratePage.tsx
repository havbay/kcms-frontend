import { useCallback, useEffect, useRef, useState } from 'react'

import {
  ApiError,
  type ActionKind,
  type CommentFilters,
  listComments,
  getFacebookConnection,
  recordAction,
  syncFacebookComments,
  type WorkListItem,
} from '../api/client'
import { CorrectionForm } from './CorrectionForm'
import { copy, type Locale } from './copy'

type ModeratePageProps = { locale: Locale }
type LoadState = 'loading' | 'ready' | 'error'

const PAGE_SIZE = 10
const SYNC_INTERVAL_MS = 60_000

/** Meta withholds `from` for commenters who have not authorized the app, and
 *  the fetcher stores "fb:<comment id>" rather than inventing a name. That is
 *  the right thing to keep, but it is not a name to show a moderator. */
function authorName(authorRef: string, unknown: string): string {
  return authorRef.startsWith('fb:') ? unknown : authorRef
}

const ui = {
  en: {
    search: 'Search comments', status: 'Review status', severity: 'Severity', target: 'Target', reason: 'Why surfaced', sort: 'Sort by',
    all: 'All', pending: 'Pending', actioned: 'Actioned', priority: 'Priority', newest: 'Newest', oldest: 'Oldest', apply: 'Apply filters', reset: 'Reset',
    source: 'Source post', type: 'Type', received: 'Received', details: 'Comment details', close: 'Close details', replyTo: 'Replying to',
    verdict: 'Automatic detection', context: 'Conversation context', action: 'Moderation action', correction: 'Label correction', video: 'Video', post: 'Post', openPost: 'Open source post',
    from: 'From', unknownAuthor: 'Unknown commenter', actions: 'Actions',
    onFacebook: 'on Facebook', kcmsOnly: 'KCMS only',
    actionFailed: 'That action could not be completed. Please try again.',
    notConnectedTitle: 'No Facebook Page connected.',
    notConnectedBody: 'These are sample comments — hiding one is recorded in KCMS and changes nothing on Facebook.',
    untitledPost: 'Untitled post',
    sync: 'Sync from Facebook', syncing: 'Syncing…',
    syncImported: (n: number) => `Imported ${n} new comment${n === 1 ? '' : 's'}`,
    syncNone: 'No new comments on the connected Page',
    syncNoPage: 'Connect a Facebook Page first.',
    syncError: 'Facebook could not be reached. Try again.',
  },
  km: {
    search: 'ស្វែងរកមតិយោបល់', status: 'ស្ថានភាពពិនិត្យ', severity: 'កម្រិត', target: 'គោលដៅ', reason: 'ហេតុផលបង្ហាញ', sort: 'តម្រៀបតាម',
    all: 'ទាំងអស់', pending: 'រង់ចាំ', actioned: 'បានធ្វើ', priority: 'អាទិភាព', newest: 'ថ្មីបំផុត', oldest: 'ចាស់បំផុត', apply: 'ប្រើតម្រង', reset: 'សម្អាត',
    source: 'ប្រភព Post', type: 'ប្រភេទ', received: 'ទទួលបាន', details: 'ព័ត៌មានមតិយោបល់', close: 'បិទព័ត៌មាន', replyTo: 'ឆ្លើយតបទៅ',
    verdict: 'ការរកឃើញស្វ័យប្រវត្តិ', context: 'បរិបទសន្ទនា', action: 'សកម្មភាពគ្រប់គ្រង', correction: 'ការកែស្លាក', video: 'វីដេអូ', post: 'Post', openPost: 'បើក Post ប្រភព',
    from: 'អ្នកផ្ដល់មតិ', unknownAuthor: 'មិនស្គាល់អ្នកផ្ដល់មតិ', actions: 'សកម្មភាព',
    onFacebook: 'នៅលើ Facebook', kcmsOnly: 'តែក្នុង KCMS',
    actionFailed: 'មិនអាចធ្វើសកម្មភាពនេះបានទេ។ សូមព្យាយាមម្ដងទៀត។',
    notConnectedTitle: 'មិនទាន់ភ្ជាប់ Facebook Page ទេ។',
    notConnectedBody: 'ទាំងនេះជាមតិយោបល់គំរូ — ការលាក់ត្រូវបានកត់ត្រាក្នុង KCMS ប៉ុណ្ណោះ ហើយមិនប្ដូរអ្វីនៅលើ Facebook ទេ។',
    untitledPost: 'Post គ្មានចំណងជើង',
    sync: 'ទាញមតិយោបល់ពី Facebook', syncing: 'កំពុងទាញ…',
    syncImported: (n: number) => `បាននាំចូលមតិយោបល់ថ្មី ${n}`,
    syncNone: 'គ្មានមតិយោបល់ថ្មីនៅលើ Page ដែលបានភ្ជាប់ទេ',
    syncNoPage: 'សូមភ្ជាប់ Facebook Page ជាមុនសិន។',
    syncError: 'មិនអាចទាក់ទង Facebook បានទេ។ សូមព្យាយាមម្ដងទៀត។',
  },
} as const

export function ModeratePage({ locale }: ModeratePageProps) {
  const content = copy[locale]
  const t = ui[locale]
  const [items, setItems] = useState<WorkListItem[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [state, setState] = useState<LoadState>('loading')
  const [slow, setSlow] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [reviewStatus, setReviewStatus] = useState('')
  const [severity, setSeverity] = useState('')
  const [target, setTarget] = useState('')
  const [reason, setReason] = useState('')
  const [sort, setSort] = useState<CommentFilters['sort']>('PRIORITY')
  const [filters, setFilters] = useState<CommentFilters>({ sort: 'PRIORITY' })
  const [syncing, setSyncing] = useState(false)
  const [syncNote, setSyncNote] = useState<string | null>(null)
  const [actionError, setActionError] = useState<{ commentId: string; message: string } | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)

  const load = useCallback(async (nextOffset: number, nextFilters: CommentFilters) => {
    const slowTimer = setTimeout(() => setSlow(true), 3000)
    try {
      const page = await listComments({ ...nextFilters, limit: PAGE_SIZE, offset: nextOffset })
      setItems(page.items)
      setTotal(page.total)
      setState('ready')
      setSlow(false)
      setSelectedId((current) => page.items.some((item) => item.comment_id === current) ? current : null)
    } catch {
      setState('error')
    } finally {
      clearTimeout(slowTimer)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(offset, filters)
  }, [filters, load, offset])


  async function act(commentId: string, kind: ActionKind) {
    setPendingAction(commentId)
    setActionError(null)
    try {
      const history = await recordAction(commentId, kind)
      const latest = history[0]
      setItems((current) => current.map((item) => item.comment_id === commentId ? {
        ...item,
        latest_action: latest?.kind ?? item.latest_action,
        latest_actor: latest?.actor ?? item.latest_actor,
        latest_action_at: latest?.occurred_at ?? item.latest_action_at,
        latest_action_on_facebook: connected === true,
      } : item))
    } catch (caught) {
      // A refused action is about one comment. Replacing the whole screen with
      // an error discarded the queue and every other row with it.
      setActionError({
        commentId,
        message: caught instanceof ApiError && caught.detail ? caught.detail : t.actionFailed,
      })
    } finally {
      setPendingAction(null)
    }
  }

  const sync = useCallback(async (quiet = false) => {
    setSyncing(true)
    if (!quiet) setSyncNote(null)
    try {
      const result = await syncFacebookComments()
      setConnected(true)
      // A background tick that found nothing must not keep announcing itself.
      if (!quiet || result.imported > 0) {
        setSyncNote(result.imported > 0 ? t.syncImported(result.imported) : t.syncNone)
      }
      // Reload from the server rather than appending, so a newly imported
      // comment lands in the right place under the active filters and sort.
      if (result.imported > 0) {
        setOffset(0)
        await load(0, filters)
      }
    } catch (caught) {
      const noPage = caught instanceof ApiError && caught.status === 409
      if (noPage) setConnected(false)
      if (!quiet) setSyncNote(noPage ? t.syncNoPage : t.syncError)
    } finally {
      setSyncing(false)
    }
  }, [filters, load, t])

  // Whether a Page is connected decides what an action can actually do, so it
  // is read on mount rather than inferred from the first sync attempt.
  useEffect(() => {
    getFacebookConnection()
      .then((found) => setConnected(found.state === 'CONNECTED'))
      .catch(() => setConnected(null))
  }, [])

  const syncingRef = useRef(false)
  useEffect(() => {
    syncingRef.current = syncing
  }, [syncing])
  // Poll for new comments while this screen is open. A hidden tab is skipped
  // so a forgotten background tab does not spend the Page's Graph quota, and
  // an in-flight sync suppresses the next tick rather than stacking calls.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible' || syncingRef.current) return
      void sync(true)
    }, SYNC_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [sync])

  function applyFilters(event: React.FormEvent) {
    event.preventDefault()
    setOffset(0)
    setFilters({
      query: search.trim() || undefined,
      reviewStatus: (reviewStatus || undefined) as CommentFilters['reviewStatus'],
      severity: (severity || undefined) as CommentFilters['severity'],
      target: (target || undefined) as CommentFilters['target'],
      surfacedReason: (reason || undefined) as CommentFilters['surfacedReason'],
      sort,
    })
  }

  function resetFilters() {
    setSearch(''); setReviewStatus(''); setSeverity(''); setTarget(''); setReason(''); setSort('PRIORITY')
    setOffset(0); setFilters({ sort: 'PRIORITY' })
  }

  const selected = items.find((item) => item.comment_id === selectedId) ?? null
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + PAGE_SIZE, total)

  if (state === 'loading') return <main className="dash-body"><p className="work-status" role="status"><span aria-hidden="true" className="work-spinner" />{slow ? content.modWaking : content.modLoading}</p></main>

  if (state === 'error') {
    return <main className="dash-body"><div className="work-error" role="alert"><strong>{content.modErrorTitle}</strong><p>{content.modErrorBody}</p><button className="button" onClick={() => { setState('loading'); void load(offset, filters) }} type="button">{content.modRetry}</button></div></main>
  }

  return (
    <main className="dash-body moderation-page">
      {connected === false && (
        <p className="work-banner" role="status">
          <strong>{t.notConnectedTitle}</strong> {t.notConnectedBody}
        </p>
      )}
      <header className="dash-head">
        <div className="dash-head-text"><h1>{content.modTitle}</h1><p>{content.modSubtitle}</p></div>
        <div className="dash-head-actions">
          {syncNote && <span className="sync-note" role="status">{syncNote}</span>}
          <button className="button button-small" disabled={syncing} onClick={() => void sync(false)} type="button">{syncing ? t.syncing : t.sync}</button>
        </div>
      </header>

      <form className="moderation-filters" onSubmit={applyFilters}>
        <label className="filter-search"><span>{t.search}</span><input onChange={(event) => setSearch(event.target.value)} placeholder={t.search} type="search" value={search} /></label>
        <label><span>{t.status}</span><select onChange={(event) => setReviewStatus(event.target.value)} value={reviewStatus}><option value="">{t.all}</option><option value="PENDING">{t.pending}</option><option value="ACTIONED">{t.actioned}</option></select></label>
        <label><span>{t.severity}</span><select onChange={(event) => setSeverity(event.target.value)} value={severity}><option value="">{t.all}</option><option value="SAFE">{content.modSeverity.SAFE}</option><option value="OFFENSIVE">{content.modSeverity.OFFENSIVE}</option><option value="HARMFUL">{content.modSeverity.HARMFUL}</option></select></label>
        <label><span>{t.target}</span><select onChange={(event) => setTarget(event.target.value)} value={target}><option value="">{t.all}</option><option value="PERSON">{content.modTarget.PERSON}</option><option value="INSTITUTION">{content.modTarget.INSTITUTION}</option><option value="NEITHER">{content.modTarget.NEITHER}</option></select></label>
        <label><span>{t.reason}</span><select onChange={(event) => setReason(event.target.value)} value={reason}><option value="">{t.all}</option><option value="triage">{content.modReasons.triage}</option><option value="institution_sample">{content.modReasons.institution_sample}</option><option value="novel_language">{content.modReasons.novel_language}</option><option value="uncertainty">{content.modReasons.uncertainty}</option></select></label>
        <label><span>{t.sort}</span><select onChange={(event) => setSort(event.target.value as CommentFilters['sort'])} value={sort}><option value="PRIORITY">{t.priority}</option><option value="NEWEST">{t.newest}</option><option value="OLDEST">{t.oldest}</option></select></label>
        <div className="filter-actions"><button className="button button-small" type="submit">{t.apply}</button><button className="button button-small button-quiet" onClick={resetFilters} type="button">{t.reset}</button></div>
      </form>

      {total === 0 ? <p className="work-status">{content.modEmpty}</p> : (
        <div className={`moderation-workspace ${selected ? 'has-selection' : ''}`}>
          <div className="moderation-list">
            <div className="table-wrap">
              <table className="work-table moderation-table">
                <thead><tr><th scope="col">{content.colComment}</th><th scope="col">{t.from}</th><th scope="col">{t.source}</th><th scope="col">{content.colSeverity}</th><th scope="col">{content.colTarget}</th><th scope="col">{content.colReason}</th><th scope="col">{content.colStatus}</th><th scope="col">{t.received}</th><th scope="col">{t.actions}</th></tr></thead>
                <tbody>{items.map((item) => (
                  <tr className={`work-row ${selectedId === item.comment_id ? 'is-selected' : ''}`} data-reason={item.surfaced_reason ?? 'cleared'} key={item.comment_id}>
                    <td className="cell-comment"><button aria-expanded={selectedId === item.comment_id} className="row-open" onClick={() => setSelectedId(item.comment_id)} type="button"><span lang="km">{item.text}</span></button></td>
                    <td className="cell-author">{authorName(item.author_ref, t.unknownAuthor)}</td>
                    <td className="cell-source">
                      <span className="source-kind">{item.post_kind === 'VIDEO' ? t.video : t.post}</span>
                      {/* stopPropagation: the row toggles the detail panel, and
                          opening the post must not also expand the row. */}
                      {item.post_permalink ? (
                        <a className="source-link" href={item.post_permalink} onClick={(event) => event.stopPropagation()} rel="noreferrer" target="_blank" title={t.openPost}>
                          <span lang="km">{item.post_text || t.untitledPost}</span>
                        </a>
                      ) : (
                        <span lang="km">{item.post_text || '—'}</span>
                      )}
                    </td>
                    <td>{item.severity && <span className={`work-chip severity-${item.severity}`}>{content.modSeverity[item.severity as keyof typeof content.modSeverity]}</span>}</td>
                    <td className="cell-muted">{item.target && content.modTarget[item.target as keyof typeof content.modTarget]}</td>
                    <td className="cell-muted cell-reason">{content.modReasons[(item.surfaced_reason ?? 'cleared') as keyof typeof content.modReasons]}</td>
                    <td className="cell-status">
                      <span className={`dot-status ${item.latest_action ? 'is-done' : 'is-pending'}`} />
                      {item.latest_action ?? content.statusPending}
                      {/* A hide that never reached Facebook is not the same
                          outcome, and showing one status for both let a sample
                          hide read as a real moderation. */}
                      {item.latest_action && item.latest_action !== 'LEAVE' && (
                        <small className={item.latest_action_on_facebook ? 'reach-yes' : 'reach-no'}>
                          {item.latest_action_on_facebook ? t.onFacebook : t.kcmsOnly}
                        </small>
                      )}
                    </td>
                    <td className="cell-muted cell-date">{new Date(item.posted_at).toLocaleDateString()}</td>
                    <td className="cell-actions" onClick={(event) => event.stopPropagation()}>
                      <div className="row-actions">
                        <button className="button button-small" disabled={pendingAction === item.comment_id} onClick={() => void act(item.comment_id, 'HIDE')} type="button">{content.modHide}</button>
                        <button className="button button-small button-quiet" disabled={pendingAction === item.comment_id} onClick={() => void act(item.comment_id, 'UNHIDE')} type="button">{content.modUnhide}</button>
                      </div>
                      {actionError?.commentId === item.comment_id && (
                        <p className="row-action-error" role="alert">{actionError.message}</p>
                      )}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <nav aria-label="Pagination" className="pager"><p>{content.pageShowing} {from}–{to} {content.pageOf} {total}</p><div><button className="button button-small button-quiet" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} type="button">{content.pagePrev}</button><button className="button button-small button-quiet" disabled={to >= total} onClick={() => setOffset(offset + PAGE_SIZE)} type="button">{content.pageNext}</button></div></nav>
          </div>

          {selected && (
            <aside aria-label={t.details} className="comment-detail-panel">
              <header className="detail-panel-head"><div><span>{t.details}</span><strong>{selected.author_ref}</strong></div><button aria-label={t.close} className="panel-close" onClick={() => setSelectedId(null)} type="button">×</button></header>
              <section className="detail-section"><h2>{content.colComment}</h2><blockquote lang="km">{selected.text}</blockquote></section>
              <section className="detail-section"><h2>{t.context}</h2><dl className="detail-facts"><div><dt>{t.source}</dt><dd lang="km">{selected.post_text || '—'}</dd></div><div><dt>{t.type}</dt><dd>{selected.post_kind === 'VIDEO' ? t.video : t.post}</dd></div>{selected.parent_text && <div><dt>{t.replyTo}</dt><dd lang="km">{selected.parent_text}</dd></div>}</dl>{selected.post_permalink && <a className="detail-link" href={selected.post_permalink} rel="noreferrer" target="_blank">{t.openPost}</a>}</section>
              <section className="detail-section"><h2>{t.verdict}</h2><dl className="detail-facts"><div><dt>{content.colSeverity}</dt><dd>{selected.severity ? content.modSeverity[selected.severity as keyof typeof content.modSeverity] : '—'} · {Math.round((selected.severity_confidence ?? 0) * 100)}%</dd></div><div><dt>{content.colTarget}</dt><dd>{selected.target ? content.modTarget[selected.target as keyof typeof content.modTarget] : '—'} · {Math.round((selected.target_confidence ?? 0) * 100)}%</dd></div><div><dt>{content.pattern}</dt><dd>{selected.model_version}</dd></div>{selected.rationale && <div><dt>{content.modWhySurfaced}</dt><dd>{selected.rationale}</dd></div>}{selected.corrected_severity && <div><dt>{content.modCorrected}</dt><dd>{content.modSeverity[selected.corrected_severity as keyof typeof content.modSeverity]} · {content.modTarget[selected.corrected_target as keyof typeof content.modTarget]}</dd></div>}{selected.latest_action && <div><dt>{content.modActioned}</dt><dd>{selected.latest_action} {content.modBy} {selected.latest_actor}</dd></div>}</dl></section>
              <section className="detail-section"><h2>{t.action}</h2><div className="moderation-actions"><button className="button button-small" disabled={pendingAction === selected.comment_id} onClick={() => void act(selected.comment_id, 'HIDE')} type="button">{content.modHide}</button><button className="button button-small button-quiet" disabled={pendingAction === selected.comment_id} onClick={() => void act(selected.comment_id, 'LEAVE')} type="button">{content.modLeave}</button><button className="button button-small button-quiet" disabled={pendingAction === selected.comment_id} onClick={() => void act(selected.comment_id, 'UNHIDE')} type="button">{content.modUnhide}</button></div></section>
              <section className="detail-section"><h2>{t.correction}</h2><CorrectionForm commentId={selected.comment_id} currentSeverity={selected.severity} currentTarget={selected.target} locale={locale} onSaved={(newSeverity, newTarget) => setItems((current) => current.map((row) => row.comment_id === selected.comment_id ? { ...row, corrected_severity: newSeverity, corrected_target: newTarget, corrected_by: 'you' } : row))} /></section>
            </aside>
          )}
        </div>
      )}
    </main>
  )
}
