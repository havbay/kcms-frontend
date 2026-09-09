import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { listAdminWorkspaces, type AdminWorkspaceList, type AdminWorkspaceSummary } from '../api/client'
import { Badge, Icon, Page, PageHead } from './ui'
import { copy, type Locale } from './copy'

type Props = { locale: Locale }
type CopyContent = (typeof copy)[Locale]

function dateLabel(value: string | null, locale: Locale): string {
  if (!value) return locale === 'km' ? 'មិនទាន់មាន' : 'Not yet'
  return new Intl.DateTimeFormat(locale === 'km' ? 'km-KH' : 'en-US', { dateStyle: 'medium' }).format(new Date(value))
}

function statusTone(status: AdminWorkspaceSummary['status']): 'neutral' | 'accent' | 'amber' | 'danger' {
  if (status === 'ACTIVE') return 'accent'
  if (status === 'TRIAL' || status === 'SANDBOX') return 'amber'
  return 'danger'
}

function statusLabel(status: AdminWorkspaceSummary['status'], content: CopyContent): string {
  return { ACTIVE: content.adminStatusActive, TRIAL: content.adminStatusTrial, SANDBOX: content.adminStatusSandbox, EXPIRED: content.adminStatusExpired, SUSPENDED: content.adminStatusSuspended }[status]
}

export function AdminWorkspacesPage({ locale }: Props) {
  const content = copy[locale]
  const [data, setData] = useState<AdminWorkspaceList | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const load = useCallback(async (query: string) => {
    setState('loading')
    try {
      setData(await listAdminWorkspaces(query))
      setState('ready')
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(appliedSearch)
  }, [appliedSearch, load])

  function submit(event: FormEvent) {
    event.preventDefault()
    setAppliedSearch(search)
  }

  return (
    <Page>
      <PageHead title={content.adminWorkspaces} lead={content.adminWorkspacesLead} />
      <form className="admin-searchbar" onSubmit={submit} role="search">
        <label className="sr-only" htmlFor="admin-workspace-search">{content.adminSearch}</label>
        <Icon name="search" />
        <input id="admin-workspace-search" onChange={(event) => setSearch(event.target.value)} placeholder={content.adminSearchPlaceholder} value={search} />
        <button className="ws-btn" data-size="sm" type="submit">{content.adminSearch}</button>
      </form>

      {state === 'loading' && <div className="admin-page-state" role="status"><span className="ws-spinner" /><p>{content.adminLoading}</p></div>}
      {state === 'error' && <div className="admin-page-state" role="alert"><Icon className="ws-banner-icon" name="alert" /><p>{content.adminError}</p><button className="ws-btn" onClick={() => void load(appliedSearch)} type="button">{content.adminRetry}</button></div>}
      {state === 'ready' && data && (
        <section className="admin-workspaces-card" aria-label={content.adminWorkspaces}>
          <div className="admin-list-summary"><strong>{data.total.toLocaleString()}</strong> {content.adminWorkspaceCount}</div>
          {data.items.length === 0 ? (
            <div className="admin-empty"><Icon name="building" /><strong>{content.adminNoWorkspaces}</strong><p>{content.adminNoWorkspacesLead}</p></div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table admin-workspace-table">
                <caption className="sr-only">{content.adminWorkspaces}</caption>
                <thead><tr><th>{content.adminWorkspace}</th><th>{content.adminStatus}</th><th>{content.adminMembers}</th><th>{content.adminPages}</th><th>{content.adminComments}</th><th>{content.adminLastActivity}</th><th><span className="sr-only">{content.adminOpen}</span></th></tr></thead>
                <tbody>
                  {data.items.map((workspace) => (
                    <tr key={workspace.id}>
                      <td><Link className="admin-table-primary" to={`/admin/workspaces/${encodeURIComponent(workspace.id)}`}>{workspace.name}</Link><span className="admin-table-secondary">{workspace.id}</span></td>
                      <td><Badge tone={statusTone(workspace.status)} dot>{statusLabel(workspace.status, content)}</Badge></td>
                      <td>{workspace.member_count}</td>
                      <td>{workspace.page_count}</td>
                      <td><strong>{workspace.comments_processed_7d}</strong><span className="admin-table-secondary">{content.adminSevenDays}</span></td>
                      <td>{dateLabel(workspace.latest_activity_at, locale)}</td>
                      <td><Link aria-label={`${content.adminOpen} ${workspace.name}`} className="admin-icon-link" to={`/admin/workspaces/${encodeURIComponent(workspace.id)}`}><Icon name="arrowRight" /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </Page>
  )
}
