import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getAdminIntegrationHealth, type AdminIntegration, type AdminIntegrationHealth } from '../api/client'
import { Badge, Card, Icon, Page, PageHead, PageState } from './ui'
import { copy, type Locale } from './copy'

type Props = { locale: Locale }
type Filter = 'ALL' | AdminIntegration['status']
type CopyContent = (typeof copy)[Locale]

function dateLabel(value: string | null, locale: Locale): string {
  if (!value) return locale === 'km' ? 'មិនទាន់មាន' : 'Never'
  return new Intl.DateTimeFormat(locale === 'km' ? 'km-KH' : 'en-US', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(value))
}

function statusTone(status: AdminIntegration['status']): 'accent' | 'amber' | 'danger' {
  if (status === 'HEALTHY') return 'accent'
  if (status === 'STALE') return 'amber'
  return 'danger'
}

function statusLabel(status: AdminIntegration['status'], content: CopyContent): string {
  return {
    HEALTHY: content.adminPageHealthy,
    STALE: content.adminPageStale,
    NEVER_SYNCED: content.adminPageNeverSynced,
    SUSPENDED: content.adminStatusSuspended,
  }[status]
}

export function AdminIntegrationsPage({ locale }: Props) {
  const content = copy[locale]
  const [data, setData] = useState<AdminIntegrationHealth | null>(null)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  const load = useCallback(async (nextFilter: Filter) => {
    setState('loading')
    try {
      setData(await getAdminIntegrationHealth(nextFilter === 'ALL' ? undefined : nextFilter))
      setState('ready')
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(filter)
  }, [filter, load])

  if (state === 'loading') return <PageState kind="loading" message={content.adminLoading} />
  if (state === 'error') return <PageState kind="error" message={content.adminError} action={<button className="ws-btn" onClick={() => void load(filter)} type="button">{content.adminRetry}</button>} />
  if (!data) return null

  return (
    <Page>
      <PageHead
        title={content.adminIntegrations}
        lead={content.adminIntegrationsLead}
        actions={<button className="ws-btn" onClick={() => void load(filter)} type="button"><Icon name="clock" />{content.adminRefresh}</button>}
      />

      <section className="admin-health-hero" aria-labelledby="admin-integration-health-title">
        <div className="admin-health-copy">
          <div className="admin-health-eyebrow"><span className="admin-health-pulse" />{content.adminHealthLabel}</div>
          <h2 id="admin-integration-health-title">{data.attention ? content.adminHealthAttention : content.adminHealthOperational}</h2>
          <p>{content.adminIntegrationsHeroLead}</p>
        </div>
        <div className="admin-health-stat">
          <span>{content.adminHealthyPages}</span>
          <strong>{data.healthy}/{data.total}</strong>
          <small>{content.adminHealthyPagesHint}</small>
        </div>
      </section>

      <div className="admin-toolbar">
        <div className="admin-filters" aria-label={content.adminIntegrationFilter} role="group">
          {(['ALL', 'HEALTHY', 'STALE', 'NEVER_SYNCED', 'SUSPENDED'] as const).map((value) => (
            <button aria-pressed={filter === value} className="filter-chip" key={value} onClick={() => setFilter(value)} type="button">
              {value === 'ALL' ? content.adminAll : statusLabel(value, content)}
            </button>
          ))}
        </div>
      </div>

      <Card title={content.adminConnectedPages} description={content.adminIntegrationsTableLead}>
        {data.items.length === 0 ? (
          <div className="admin-empty"><Icon name="link" /><strong>{content.adminNoIntegrations}</strong><p>{content.adminNoIntegrationsLead}</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-integration-table">
              <caption className="sr-only">{content.adminIntegrations}</caption>
              <thead><tr><th>{content.adminPage}</th><th>{content.adminWorkspace}</th><th>{content.adminStatus}</th><th>{content.adminLastSync}</th><th>{content.adminMethod}</th></tr></thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={`${item.workspace_id}-${item.page_id}`}>
                    <td><span className="admin-table-primary">{item.page_name}</span><span className="admin-table-secondary">{item.page_id}</span></td>
                    <td><Link className="admin-table-primary" to={`/admin/workspaces/${encodeURIComponent(item.workspace_id)}`}>{item.workspace_name}</Link></td>
                    <td><Badge dot tone={statusTone(item.status)}>{statusLabel(item.status, content)}</Badge></td>
                    <td>{dateLabel(item.last_synced_at, locale)}</td>
                    <td>{item.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  )
}
