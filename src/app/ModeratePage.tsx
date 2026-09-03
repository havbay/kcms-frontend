import { useCallback, useEffect, useRef, useState } from 'react'

import {
  ApiError,
  type ActionKind,
  type CommentFilters,
  listComments,
  listFacebookConnections,
  recordAction,
  syncFacebookComments,
  type WorkListItem,
} from '../api/client'
import { CorrectionForm } from './CorrectionForm'
import { copy, type Locale } from './copy'

type ModeratePageProps = { locale: Locale }
type LoadState = 'loading' | 'ready' | 'error'

const SYNC_INTERVAL_MS = 60_000

const AVATAR_PALETTES = [
  { bg: 'rgba(11, 107, 99, 0.12)', color: '#075049', border: 'rgba(11, 107, 99, 0.25)' },
  { bg: 'rgba(194, 106, 10, 0.12)', color: '#874600', border: 'rgba(194, 106, 10, 0.25)' },
  { bg: 'rgba(122, 92, 196, 0.12)', color: '#5b3aa8', border: 'rgba(122, 92, 196, 0.25)' },
  { bg: 'rgba(2, 132, 199, 0.12)', color: '#0369a1', border: 'rgba(2, 132, 199, 0.25)' },
  { bg: 'rgba(225, 29, 72, 0.12)', color: '#be123c', border: 'rgba(225, 29, 72, 0.25)' },
  { bg: 'rgba(217, 119, 6, 0.12)', color: '#b45309', border: 'rgba(217, 119, 6, 0.25)' },
  { bg: 'rgba(13, 148, 136, 0.12)', color: '#0f766e', border: 'rgba(13, 148, 136, 0.25)' },
  { bg: 'rgba(79, 70, 229, 0.12)', color: '#4338ca', border: 'rgba(79, 70, 229, 0.25)' },
]

function getAuthorInfo(authorRef: string, locale: Locale) {
  let hash = 0
  for (let i = 0; i < authorRef.length; i++) {
    hash = (hash * 31 + authorRef.charCodeAt(i)) % AVATAR_PALETTES.length
  }
  const palette = AVATAR_PALETTES[hash] ?? AVATAR_PALETTES[0]!

  if (authorRef.startsWith('fb:')) {
    // Meta withheld `from`, so there is no name and no handle. The stored
    // "fb:<comment id>" is a record, not an identity: inventing "User #1220"
    // and "@fb_1220" from it presented a person who does not exist, about a
    // real comment a moderator is about to act on.
    return {
      name: locale === 'km' ? 'មិនស្គាល់អ្នកផ្ដល់មតិ' : 'Unknown commenter',
      handle: locale === 'km' ? 'Facebook មិនបានផ្ដល់ឈ្មោះ' : 'Facebook did not share a name',
      initials: '?',
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
    // The name Meta gave is not a handle, and rendering it as one implied a
    // Facebook username that was never supplied.
    handle: '',
    initials: authorRef.slice(0, 2).toUpperCase(),
    ...palette,
  }
}

function formatPostCaption(rawText: string | null | undefined, fallback: string): string {
  if (!rawText) return fallback
  const cleaned = rawText.replace(/^(?:វីដេអូថ្មី[៖:]\s*|New\s+video:\s*)/i, '').trim()
  return cleaned || rawText || fallback
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
    if (diffDays < 7) return locale === 'km' ? `${diffDays} ថ្ងៃមុន` : `${diffDays}d ago`
    return date.toLocaleDateString()
  } catch {
    return dateStr
  }
}

const ui = {
  en: {
    search: 'Search comments', status: 'Review status', severity: 'Severity', target: 'Target', reason: 'Why surfaced', sort: 'Sort by',
    all: 'All', pending: 'Pending', actioned: 'Actioned', priority: 'Priority', newest: 'Newest', oldest: 'Oldest', apply: 'Apply filters', reset: 'Reset',
    source: 'Source post', type: 'Type', received: 'Received', details: 'Comment details', close: 'Close details', replyTo: 'Replying to',
    verdict: 'Automatic detection', context: 'Conversation context', action: 'Moderation action', correction: 'Label correction', video: 'Video', post: 'Post', openPost: 'Open source post',
    emptyConnected: 'No comments from your connected Page yet. Sync to fetch the latest ones.',
    from: 'From',
    page: 'Page', unknownAuthor: 'Unknown commenter', actions: 'Actions',
    onFacebook: 'on Facebook', kcmsOnly: 'KCMS only',
    actionFailed: 'That action could not be completed. Please try again.',
    notConnectedTitle: 'No Facebook Page connected.',
    notConnectedBody: 'These are sample comments — deleting one is recorded in KCMS and changes nothing on Facebook.',
    untitledPost: 'Untitled post',
    sync: 'Sync from Facebook', syncing: 'Syncing…',
    syncImported: (n: number) => `Imported ${n} new comment${n === 1 ? '' : 's'}`,
    syncNone: 'No new comments on the connected Page',
    syncNoPage: 'Connect a Facebook Page first.',
    syncError: 'Facebook could not be reached. Try again.',
    activeFilters: 'Active filters',
    clearAll: 'Clear all',
    queueStatus: 'Queue status',
    filters: 'Filters',
    displayLimit: 'Display limit',
  },
  km: {
    search: 'ស្វែងរកមតិយោបល់', status: 'ស្ថានភាពពិនិត្យ', severity: 'កម្រិត', target: 'គោលដៅ', reason: 'ហេតុផលបង្ហាញ', sort: 'តម្រៀបតាម',
    all: 'ទាំងអស់', pending: 'រង់ចាំ', actioned: 'បានធ្វើ', priority: 'អាទិភាព', newest: 'ថ្មីបំផុត', oldest: 'ចាស់បំផុត', apply: 'ប្រើតម្រង', reset: 'សម្អាត',
    source: 'ប្រភព Post', type: 'ប្រភេទ', received: 'ទទួលបាន', details: 'ព័ត៌មានមតិយោបល់', close: 'បិទព័ត៌មាន', replyTo: 'ឆ្លើយតបទៅ',
    verdict: 'ការរកឃើញស្វ័យប្រវត្តិ', context: 'បរិបទសន្ទនា', action: 'សកម្មភាពគ្រប់គ្រង', correction: 'ការកែស្លាក', video: 'វីដេអូ', post: 'Post', openPost: 'បើក Post ប្រភព',
    emptyConnected: 'មិនទាន់មានមតិយោបល់ពី Page ដែលបានភ្ជាប់ទេ។ សូមទាញយកដើម្បីទទួលបានមតិយោបល់ថ្មី។',
    from: 'អ្នកផ្ដល់មតិ',
    page: 'Page', unknownAuthor: 'មិនស្គាល់អ្នកផ្ដល់មតិ', actions: 'សកម្មភាព',
    onFacebook: 'នៅលើ Facebook', kcmsOnly: 'តែក្នុង KCMS',
    actionFailed: 'មិនអាចធ្វើសកម្មភាពនេះបានទេ។ សូមព្យាយាមម្ដងទៀត។',
    notConnectedTitle: 'មិនទាន់ភ្ជាប់ Facebook Page ទេ។',
    notConnectedBody: 'ទាំងនេះជាមតិយោបល់គំរូ — ការលុបត្រូវបានកត់ត្រាក្នុង KCMS ប៉ុណ្ណោះ ហើយមិនប្ដូរអ្វីនៅលើ Facebook ទេ។',
    untitledPost: 'Post គ្មានចំណងជើង',
    sync: 'ទាញមតិយោបល់ពី Facebook', syncing: 'កំពុងទាញ…',
    syncImported: (n: number) => `បាននាំចូលមតិយោបល់ថ្មី ${n}`,
    syncNone: 'គ្មានមតិយោបល់ថ្មីនៅលើ Page ដែលបានភ្ជាប់ទេ',
    syncNoPage: 'សូមភ្ជាប់ Facebook Page ជាមុនសិន។',
    syncError: 'មិនអាចទាក់ទង Facebook បានទេ។ សូមព្យាយាមម្ដងទៀត។',
    activeFilters: 'តម្រងសកម្ម',
    clearAll: 'សម្អាតទាំងអស់',
    queueStatus: 'ស្ថានភាពជួរ',
    filters: 'តម្រង',
    displayLimit: 'កំណត់ចំនួនបង្ហាញ',
  },
} as const

export function ModeratePage({ locale }: ModeratePageProps) {
  const content = copy[locale]
  const t = ui[locale]
  const [items, setItems] = useState<WorkListItem[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [pageSize, setPageSize] = useState(100)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
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
  // Deleting cannot be undone on Facebook and these are real comments on a
  // customer's Page, so it is never one click away.
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)

  const activeFilterCount = (severity ? 1 : 0) + (target ? 1 : 0) + (reason ? 1 : 0) + (sort !== 'PRIORITY' ? 1 : 0)

  const load = useCallback(async (nextOffset: number, nextFilters: CommentFilters, nextPageSize: number) => {
    const slowTimer = setTimeout(() => setSlow(true), 3000)
    try {
      const page = await listComments({ ...nextFilters, limit: nextPageSize, offset: nextOffset })
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
    void load(offset, filters, pageSize)
  }, [filters, load, offset, pageSize])


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
      const found = await listFacebookConnections()
      const connections = Array.isArray(found?.connections)
        ? found.connections
        : (found as unknown as { state?: string })?.state === 'CONNECTED'
          ? [{ page_id: 'page-real', page_name: 'Demo Page', connected_at: '', can_moderate: true, method: 'FACEBOOK_LOGIN' as const }]
          : []
      if (connections.length === 0) {
        setConnected(false)
        if (!quiet) setSyncNote(t.syncNoPage)
        return
      }
      setConnected(true)
      // A workspace can hold several connected Pages, so a sync pulls every
      // one of them rather than assuming there is only ever one.
      let imported = 0
      for (const connection of connections) {
        imported += (await syncFacebookComments(connection.page_id)).imported
      }
      // A background tick that found nothing must not keep announcing itself.
      if (!quiet || imported > 0) {
        setSyncNote(imported > 0 ? t.syncImported(imported) : t.syncNone)
      }
      // Reload from the server rather than appending, so a newly imported
      // comment lands in the right place under the active filters and sort.
      if (imported > 0) {
        setOffset(0)
        await load(0, filters, pageSize)
      }
    } catch {
      if (!quiet) setSyncNote(t.syncError)
    } finally {
      setSyncing(false)
    }
  }, [filters, load, pageSize, t])

  // Whether a Page is connected decides what an action can actually do, so it
  // is read on mount rather than inferred from the first sync attempt.
  useEffect(() => {
    listFacebookConnections()
      .then((found) => {
        const raw = found as unknown as Record<string, unknown>
        if (Array.isArray(raw?.connections)) setConnected(raw.connections.length > 0)
        else if (raw?.state === 'CONNECTED') setConnected(true)
        else if (raw?.state === 'NOT_CONNECTED') setConnected(false)
        else setConnected(false)
      })
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
  const to = Math.min(offset + items.length, total)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.floor(offset / pageSize) + 1

  if (state === 'loading') return <main className="dash-body"><p className="work-status" role="status"><span aria-hidden="true" className="work-spinner" />{slow ? content.modWaking : content.modLoading}</p></main>

  if (state === 'error') {
    return <main className="dash-body"><div className="work-error" role="alert"><strong>{content.modErrorTitle}</strong><p>{content.modErrorBody}</p><button className="button" onClick={() => { setState('loading'); void load(offset, filters, pageSize) }} type="button">{content.modRetry}</button></div></main>
  }

  return (
    <main className="dash-body moderation-page">
      {connected === false && (
        <p className="work-banner" role="status">
          <strong>{t.notConnectedTitle}</strong> {t.notConnectedBody}
        </p>
      )}
      <header className="dash-head">
        <div className="dash-head-text">
          <h1>{content.modTitle}</h1>
          <p>{content.modSubtitle}</p>
        </div>
        <div className="dash-head-actions">
          {syncNote && <span className="sync-note" role="status">{syncNote}</span>}
          <button className="button button-small" disabled={syncing} onClick={() => void sync(false)} type="button">{syncing ? t.syncing : t.sync}</button>
        </div>
      </header>

      <div className="mod-toolbar">
        <div aria-label={t.queueStatus} className="mod-status-tabs" role="tablist">
          <button
            aria-selected={reviewStatus === ''}
            className={`mod-tab-btn ${reviewStatus === '' ? 'is-active' : ''}`}
            onClick={() => {
              setReviewStatus('')
              setOffset(0)
              setFilters((prev) => ({ ...prev, reviewStatus: undefined }))
            }}
            role="tab"
            type="button"
          >
            <span>{t.all}</span>
            {reviewStatus === '' && <span className="mod-tab-badge is-all">{total}</span>}
          </button>
          <button
            aria-selected={reviewStatus === 'PENDING'}
            className={`mod-tab-btn ${reviewStatus === 'PENDING' ? 'is-active' : ''}`}
            onClick={() => {
              setReviewStatus('PENDING')
              setOffset(0)
              setFilters((prev) => ({ ...prev, reviewStatus: 'PENDING' }))
            }}
            role="tab"
            type="button"
          >
            <span>{t.pending}</span>
            {reviewStatus === 'PENDING' && <span className="mod-tab-badge is-pending">{total}</span>}
          </button>
          <button
            aria-selected={reviewStatus === 'ACTIONED'}
            className={`mod-tab-btn ${reviewStatus === 'ACTIONED' ? 'is-active' : ''}`}
            onClick={() => {
              setReviewStatus('ACTIONED')
              setOffset(0)
              setFilters((prev) => ({ ...prev, reviewStatus: 'ACTIONED' }))
            }}
            role="tab"
            type="button"
          >
            <span>{t.actioned}</span>
            {reviewStatus === 'ACTIONED' && <span className="mod-tab-badge is-actioned">{total}</span>}
          </button>
        </div>

        <div className="mod-toolbar-actions">
          <div className="mod-quick-search">
            <svg className="mod-search-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              aria-label={t.search}
              className="mod-search-input"
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  setOffset(0)
                  setFilters((f) => ({ ...f, query: search.trim() || undefined }))
                }
              }}
              placeholder={t.search}
              type="search"
              value={search}
            />
          </div>

          <div aria-label={t.displayLimit} className="mod-size-toggle" role="group">
            <button
              aria-pressed={pageSize === 20}
              className={`mod-size-btn ${pageSize === 20 ? 'is-active' : ''}`}
              onClick={() => {
                setPageSize(20)
                setOffset(0)
              }}
              title={locale === 'km' ? 'បង្ហាញ ២០ មតិយោបល់' : 'Show 20 comments'}
              type="button"
            >
              20
            </button>
            <button
              aria-pressed={pageSize === 50}
              className={`mod-size-btn ${pageSize === 50 ? 'is-active' : ''}`}
              onClick={() => {
                setPageSize(50)
                setOffset(0)
              }}
              title={locale === 'km' ? 'បង្ហាញ ៥០ មតិយោបល់' : 'Show 50 comments'}
              type="button"
            >
              50
            </button>
            <button
              aria-pressed={pageSize >= 100}
              className={`mod-size-btn ${pageSize >= 100 ? 'is-active' : ''}`}
              onClick={() => {
                setPageSize(100)
                setOffset(0)
              }}
              title={locale === 'km' ? 'បង្ហាញទាំងអស់' : 'Show all comments'}
              type="button"
            >
              {t.all}
            </button>
          </div>

          <button
            aria-expanded={isFiltersOpen}
            className={`mod-filter-toggle-btn ${isFiltersOpen || activeFilterCount > 0 ? 'is-active' : ''}`}
            onClick={() => setIsFiltersOpen((open) => !open)}
            type="button"
          >
            <svg className="mod-filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>{t.filters}</span>
            {activeFilterCount > 0 && <span className="mod-filter-count-badge">{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      <form className={`moderation-filters ${isFiltersOpen ? 'is-open' : 'is-collapsed'}`} onSubmit={applyFilters}>
        <label className="filter-status-select">
          <span>{t.status}</span>
          <select onChange={(event) => setReviewStatus(event.target.value)} value={reviewStatus}>
            <option value="">{t.all}</option>
            <option value="PENDING">{t.pending}</option>
            <option value="ACTIONED">{t.actioned}</option>
          </select>
        </label>
        <label className="filter-field">
          <span>{t.severity}</span>
          <select onChange={(event) => setSeverity(event.target.value)} value={severity}>
            <option value="">{t.all}</option>
            <option value="SAFE">{content.modSeverity.SAFE}</option>
            <option value="OFFENSIVE">{content.modSeverity.OFFENSIVE}</option>
            <option value="HARMFUL">{content.modSeverity.HARMFUL}</option>
          </select>
        </label>
        <label className="filter-field">
          <span>{t.target}</span>
          <select onChange={(event) => setTarget(event.target.value)} value={target}>
            <option value="">{t.all}</option>
            <option value="PERSON">{content.modTarget.PERSON}</option>
            <option value="INSTITUTION">{content.modTarget.INSTITUTION}</option>
            <option value="NEITHER">{content.modTarget.NEITHER}</option>
          </select>
        </label>
        <label className="filter-field">
          <span>{t.reason}</span>
          <select onChange={(event) => setReason(event.target.value)} value={reason}>
            <option value="">{t.all}</option>
            <option value="triage">{content.modReasons.triage}</option>
            <option value="institution_sample">{content.modReasons.institution_sample}</option>
            <option value="novel_language">{content.modReasons.novel_language}</option>
            <option value="uncertainty">{content.modReasons.uncertainty}</option>
          </select>
        </label>
        <label className="filter-field">
          <span>{t.sort}</span>
          <select onChange={(event) => setSort(event.target.value as CommentFilters['sort'])} value={sort}>
            <option value="PRIORITY">{t.priority}</option>
            <option value="NEWEST">{t.newest}</option>
            <option value="OLDEST">{t.oldest}</option>
          </select>
        </label>
        <div className="filter-actions">
          <button className="button button-small" type="submit">{t.apply}</button>
          <button className="button button-small button-quiet" onClick={resetFilters} type="button">{t.reset}</button>
        </div>
      </form>

      {(search || severity || target || reason || reviewStatus) && (
        <div className="mod-active-filters">
          <span className="active-filters-label">{t.activeFilters}:</span>
          {search && (
            <button
              className="active-filter-pill"
              onClick={() => {
                setSearch('')
                setFilters((f) => ({ ...f, query: undefined }))
              }}
              type="button"
            >
              <span>{t.search}: "{search}"</span>
              <span className="pill-x">×</span>
            </button>
          )}
          {reviewStatus && (
            <button
              className="active-filter-pill"
              onClick={() => {
                setReviewStatus('')
                setFilters((f) => ({ ...f, reviewStatus: undefined }))
              }}
              type="button"
            >
              <span>{t.status}: {reviewStatus === 'PENDING' ? t.pending : t.actioned}</span>
              <span className="pill-x">×</span>
            </button>
          )}
          {severity && (
            <button
              className="active-filter-pill"
              onClick={() => {
                setSeverity('')
                setFilters((f) => ({ ...f, severity: undefined }))
              }}
              type="button"
            >
              <span>{content.modSeverity[severity as keyof typeof content.modSeverity]}</span>
              <span className="pill-x">×</span>
            </button>
          )}
          {target && (
            <button
              className="active-filter-pill"
              onClick={() => {
                setTarget('')
                setFilters((f) => ({ ...f, target: undefined }))
              }}
              type="button"
            >
              <span>{content.modTarget[target as keyof typeof content.modTarget]}</span>
              <span className="pill-x">×</span>
            </button>
          )}
          {reason && (
            <button
              className="active-filter-pill"
              onClick={() => {
                setReason('')
                setFilters((f) => ({ ...f, surfacedReason: undefined }))
              }}
              type="button"
            >
              <span>{content.modReasons[reason as keyof typeof content.modReasons]}</span>
              <span className="pill-x">×</span>
            </button>
          )}
          <button className="active-filters-clear" onClick={resetFilters} type="button">
            {t.clearAll}
          </button>
        </div>
      )}

      {total === 0 ? (
        /* "Nothing needs review" reads as a cleared queue. After connecting a
           Page nothing has been fetched yet, which is a different situation
           and has a different next step. */
        connected ? (
          <div className="work-empty">
            <p>{t.emptyConnected}</p>
            <button className="button button-small" disabled={syncing} onClick={() => void sync(false)} type="button">
              {syncing ? t.syncing : t.sync}
            </button>
          </div>
        ) : (
          <p className="work-status">{content.modEmpty}</p>
        )
      ) : (
        <div className={`moderation-workspace ${selected ? 'has-selection' : ''}`}>
          <div className="moderation-list">
            <div className="table-wrap">
              <table className="work-table moderation-table">
                <thead><tr><th scope="col">{content.colComment}</th><th scope="col">{t.source}</th><th scope="col">{t.page}</th><th scope="col">{content.colSeverity}</th><th scope="col">{content.colTarget}</th><th scope="col">{content.colStatus}</th><th scope="col">{t.actions}</th></tr></thead>
                <tbody>{items.map((item) => {
                  const author = getAuthorInfo(item.author_ref, locale)
                  // Was https://facebook.com/<comment id>, which is not a
                  // person and resolves to nothing. Meta gives no public profile
                  // URL for a commenter, so this links to the comment in
                  // context instead — which is what a moderator actually needs.
                  const commentSuffix = item.comment_id.split('_').pop()
                  const profileUrl = item.post_permalink && commentSuffix
                    ? `${item.post_permalink}${item.post_permalink.includes('?') ? '&' : '?'}comment_id=${commentSuffix}`
                    : null
                  const avatarIcon = (
                    <span
                      className="author-profile-icon"
                      style={{
                        backgroundColor: author.bg,
                        color: author.color,
                        borderColor: author.border,
                      }}
                    >
                      <svg className="user-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                  )

                  return (
                    <tr
                      className={`work-row severity-${item.severity ?? 'SAFE'} ${selectedId === item.comment_id ? 'is-selected' : ''}`}
                      data-reason={item.surfaced_reason ?? 'cleared'}
                      data-severity={item.severity ?? 'SAFE'}
                      key={item.comment_id}
                    >
                      <td className="cell-comment">
                        <div className="comment-cell-wrap">
                          {profileUrl ? (
                            <a
                              aria-label={`${t.from}: ${author.name}`}
                              className="author-profile-btn"
                              href={profileUrl}
                              onClick={(event) => event.stopPropagation()}
                              rel="noreferrer"
                              target="_blank"
                              title={`${author.name}${author.handle ? ` — ${author.handle}` : ''} — ${locale === 'km' ? 'មើលមតិយោបល់នៅលើ Facebook' : 'Open this comment on Facebook'}`}
                            >
                              {avatarIcon}
                            </a>
                          ) : (
                            <span
                              aria-label={`${t.from}: ${author.name}`}
                              className="author-profile-btn is-static"
                              title={author.handle ? `${author.name} — ${author.handle}` : author.name}
                            >
                              {avatarIcon}
                            </span>
                          )}
                          <div className="comment-content-wrap">
                            <button aria-expanded={selectedId === item.comment_id} className="row-open" onClick={() => setSelectedId(item.comment_id)} type="button">
                              <span lang="km">{item.text}</span>
                            </button>
                            <span className="comment-time-hint">{formatRelativeTime(item.posted_at, locale)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="cell-source">
                        {item.post_permalink ? (
                          <a
                            className="work-chip source-chip"
                            href={item.post_permalink}
                            onClick={(event) => event.stopPropagation()}
                            rel="noreferrer"
                            target="_blank"
                            title={`${formatPostCaption(item.post_text, t.untitledPost)} — ${t.openPost}`}
                          >
                            <span lang="km">{formatPostCaption(item.post_text, t.untitledPost)}</span>
                          </a>
                        ) : (
                          <span className="work-chip source-chip is-static" lang="km" title={formatPostCaption(item.post_text, '')}>
                            <span>{formatPostCaption(item.post_text, '—')}</span>
                          </span>
                        )}
                      </td>
                      {/* A workspace can hold several Pages now, so the row has
                          to say which one this came from. */}
                      <td className="cell-page" title={item.page_name ?? undefined}>{item.page_name ?? '—'}</td>
                      <td className="cell-severity">
                        {item.severity && <span className={`work-chip severity-${item.severity}`}>{content.modSeverity[item.severity as keyof typeof content.modSeverity]}</span>}
                      </td>
                      <td className="cell-target">
                        {item.target && <span className={`work-chip target-${item.target}`}>{content.modTarget[item.target as keyof typeof content.modTarget]}</span>}
                      </td>
                      <td className="cell-status">
                        <div className={`status-pill ${item.latest_action ? 'is-done' : 'is-pending'}`}>
                          <span className="status-pill-dot" />
                          <span>{item.latest_action ?? content.statusPending}</span>
                        </div>
                        {/* A delete that never reached Facebook is not the same
                            outcome, and showing one status for both let a sample
                            delete read as a real moderation. */}
                        {item.latest_action && item.latest_action !== 'LEAVE' && (
                          <small className={item.latest_action_on_facebook ? 'reach-yes' : 'reach-no'}>
                            {item.latest_action_on_facebook ? t.onFacebook : t.kcmsOnly}
                          </small>
                        )}
                      </td>
                      <td className="cell-actions" onClick={(event) => event.stopPropagation()}>
                        <div className="row-actions">
                          {/* Hide first: it is the reversible one, and the
                              order the buttons sit in is a recommendation
                              whether or not it is meant as one. Unhide appears
                              only on a hidden comment, where it means something. */}
                          {item.latest_action === 'HIDE' ? (
                            <button className="button button-small" disabled={pendingAction === item.comment_id} onClick={() => void act(item.comment_id, 'UNHIDE')} type="button">{content.modUnhide}</button>
                          ) : (
                            <button className="button button-small" disabled={pendingAction === item.comment_id} onClick={() => void act(item.comment_id, 'HIDE')} type="button">{content.modHide}</button>
                          )}
                          <button className="button button-small button-quiet" disabled={pendingAction === item.comment_id} onClick={() => void act(item.comment_id, 'LEAVE')} type="button">{content.modLeave}</button>
                          {confirmDelete === item.comment_id ? (
                            <>
                              <button className="button button-small button-action-delete" disabled={pendingAction === item.comment_id} onClick={() => { setConfirmDelete(null); void act(item.comment_id, 'DELETE') }} type="button">{content.modDeleteConfirm}</button>
                              <button className="button button-small button-quiet" onClick={() => setConfirmDelete(null)} type="button">{content.modCancel}</button>
                            </>
                          ) : (
                            <button className="button button-small button-action-delete" disabled={pendingAction === item.comment_id} onClick={() => setConfirmDelete(item.comment_id)} type="button">{content.modDelete}</button>
                          )}
                        </div>
                        {actionError?.commentId === item.comment_id && (
                          <p className="row-action-error" role="alert">{actionError.message}</p>
                        )}
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
            <nav aria-label="Pagination" className="pager">
              <div className="pager-info">
                <p>
                  {total <= items.length ? (
                    locale === 'km' ? (
                      <>បង្ហាញទាំងអស់ <strong>{total}</strong> មតិយោបល់</>
                    ) : (
                      <>Showing all <strong>{total}</strong> comments</>
                    )
                  ) : (
                    <>
                      {content.pageShowing} <strong>{from}–{to}</strong> {content.pageOf} <strong>{total}</strong>
                    </>
                  )}
                </p>
              </div>

              {totalPages > 1 && (
                <div className="pager-controls">
                  <div className="pager-nav-buttons">
                    <button
                      className="button button-small button-quiet"
                      disabled={offset === 0}
                      onClick={() => setOffset(Math.max(0, offset - pageSize))}
                      type="button"
                    >
                      ← {content.pagePrev}
                    </button>

                    {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1]
                        const isGap = prev != null && p - prev > 1
                        return (
                          <span className="pager-page-wrapper" key={p}>
                            {isGap && <span className="pager-ellipsis">…</span>}
                            <button
                              aria-current={p === currentPage ? 'page' : undefined}
                              className={`pager-page-btn ${p === currentPage ? 'is-active' : ''}`}
                              onClick={() => setOffset((p - 1) * pageSize)}
                              type="button"
                            >
                              {p}
                            </button>
                          </span>
                        )
                      })}

                    <button
                      className="button button-small button-quiet"
                      disabled={to >= total}
                      onClick={() => setOffset(offset + pageSize)}
                      type="button"
                    >
                      {content.pageNext} →
                    </button>
                  </div>
                </div>
              )}
            </nav>
          </div>

          {selected && (
            <aside aria-label={t.details} className="comment-detail-panel">
              <header className="detail-panel-head">
                <div>
                  <span>{t.details}</span>
                  <strong>{getAuthorInfo(selected.author_ref, locale).name}</strong>
                  <small style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 400 }}>
                    {getAuthorInfo(selected.author_ref, locale).handle}
                  </small>
                </div>
                <button aria-label={t.close} className="panel-close" onClick={() => setSelectedId(null)} type="button">×</button>
              </header>
              <section className="detail-section"><h2>{content.colComment}</h2><blockquote lang="km">{selected.text}</blockquote></section>
              <section className="detail-section"><h2>{t.context}</h2><dl className="detail-facts"><div><dt>{t.source}</dt><dd lang="km">{formatPostCaption(selected.post_text, '—')}</dd></div><div><dt>{t.type}</dt><dd>{selected.post_kind === 'VIDEO' ? t.video : t.post}</dd></div>{selected.parent_text && <div><dt>{t.replyTo}</dt><dd lang="km">{selected.parent_text}</dd></div>}</dl>{selected.post_permalink && <a className="detail-link" href={selected.post_permalink} rel="noreferrer" target="_blank">{t.openPost}</a>}</section>
              <section className="detail-section"><h2>{t.verdict}</h2><dl className="detail-facts"><div><dt>{content.colSeverity}</dt><dd>{selected.severity ? content.modSeverity[selected.severity as keyof typeof content.modSeverity] : '—'} · {Math.round((selected.severity_confidence ?? 0) * 100)}%</dd></div><div><dt>{content.colTarget}</dt><dd>{selected.target ? content.modTarget[selected.target as keyof typeof content.modTarget] : '—'} · {Math.round((selected.target_confidence ?? 0) * 100)}%</dd></div><div><dt>{content.pattern}</dt><dd>{selected.model_version}</dd></div>{selected.rationale && <div><dt>{content.modWhySurfaced}</dt><dd>{selected.rationale}</dd></div>}{selected.corrected_severity && <div><dt>{content.modCorrected}</dt><dd>{content.modSeverity[selected.corrected_severity as keyof typeof content.modSeverity]} · {content.modTarget[selected.corrected_target as keyof typeof content.modTarget]}</dd></div>}{selected.latest_action && <div><dt>{content.modActioned}</dt><dd>{selected.latest_action} {content.modBy} {selected.latest_actor}</dd></div>}</dl></section>
              <section className="detail-section"><h2>{t.action}</h2><div className="moderation-actions">{selected.latest_action === 'HIDE' ? (<button className="button button-small" disabled={pendingAction === selected.comment_id} onClick={() => void act(selected.comment_id, 'UNHIDE')} type="button">{content.modUnhide}</button>) : (<button className="button button-small" disabled={pendingAction === selected.comment_id} onClick={() => void act(selected.comment_id, 'HIDE')} type="button">{content.modHide}</button>)}<button className="button button-small button-quiet" disabled={pendingAction === selected.comment_id} onClick={() => void act(selected.comment_id, 'LEAVE')} type="button">{content.modLeave}</button>{confirmDelete === selected.comment_id ? (<><button className="button button-small button-action-delete" disabled={pendingAction === selected.comment_id} onClick={() => { setConfirmDelete(null); void act(selected.comment_id, 'DELETE') }} type="button">{content.modDeleteConfirm}</button><button className="button button-small button-quiet" onClick={() => setConfirmDelete(null)} type="button">{content.modCancel}</button></>) : (<button className="button button-small button-action-delete" disabled={pendingAction === selected.comment_id} onClick={() => setConfirmDelete(selected.comment_id)} type="button">{content.modDelete}</button>)}</div></section>
              <section className="detail-section"><h2>{t.correction}</h2><CorrectionForm commentId={selected.comment_id} currentSeverity={selected.severity} currentTarget={selected.target} locale={locale} onSaved={(newSeverity, newTarget) => setItems((current) => current.map((row) => row.comment_id === selected.comment_id ? { ...row, corrected_severity: newSeverity, corrected_target: newTarget, corrected_by: 'you' } : row))} /></section>
            </aside>
          )}
        </div>
      )}
    </main>
  )
}
