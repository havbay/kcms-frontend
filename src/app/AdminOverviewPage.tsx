import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getAdminOverview, type AdminOverview, type AdminWorkspaceSummary } from '../api/client'
import { Badge, Card, Icon, Page, PageHead, PageState } from './ui'
import { copy, type Locale } from './copy'

type Props = { locale: Locale }
type LoadState = 'loading' | 'ready' | 'error'
type CopyContent = (typeof copy)[Locale]

function dateLabel(value: string | null, locale: Locale): string {
  if (!value) return locale === 'km' ? 'មិនទាន់មាន' : 'Not yet'
  return new Intl.DateTimeFormat(locale === 'km' ? 'km-KH' : 'en-US', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(value))
}

function statusTone(status: AdminWorkspaceSummary['status']): 'neutral' | 'accent' | 'amber' | 'danger' {
  if (status === 'ACTIVE') return 'accent'
  if (status === 'TRIAL' || status === 'SANDBOX') return 'amber'
  return 'danger'
}

function statusLabel(status: AdminWorkspaceSummary['status'], content: CopyContent): string {
  return {
    ACTIVE: content.adminStatusActive,
    TRIAL: content.adminStatusTrial,
    SANDBOX: content.adminStatusSandbox,
    EXPIRED: content.adminStatusExpired,
    SUSPENDED: content.adminStatusSuspended,
  }[status]
}

export function AdminOverviewPage({ locale }: Props) {
  const content = copy[locale]
  const [data, setData] = useState<AdminOverview | null>(null)
  const [state, setState] = useState<LoadState>('loading')

  const load = useCallback(async () => {
    setState('loading')
    try {
      setData(await getAdminOverview())
      setState('ready')
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  if (state === 'loading') return <PageState kind="loading" message={content.adminLoading} />
  if (state === 'error') {
    return <PageState kind="error" message={content.adminError} action={<button className="ws-btn" onClick={() => void load()} type="button">{content.adminRetry}</button>} />
  }
  if (!data) return null

  const attention = data.integration_attention > 0

  return (
    <Page>
      <PageHead
        title={content.adminOverview}
        lead={content.adminOverviewLead}
        actions={<button className="ws-btn" onClick={() => void load()} type="button"><Icon name="clock" />{content.adminRefresh}</button>}
      />

      <section className="admin-health-hero" aria-labelledby="admin-health-title">
        <div className="admin-health-copy">
          <div className="admin-health-eyebrow"><span className="admin-health-pulse" />{content.adminHealthLabel}</div>
          <h2 id="admin-health-title">{attention ? content.adminHealthAttention : content.adminHealthOperational}</h2>
          <p>{attention ? content.adminHealthAttentionLead : content.adminHealthOperationalLead}</p>
        </div>
        <div className="admin-health-stat">
          <span>{content.adminIntegrationAttention}</span>
          <strong>{data.integration_attention}</strong>
          <small>{content.adminIntegrationAttentionHint}</small>
        </div>
      </section>

      <ul className="admin-metric-grid">
        <Metric label={content.adminMetricWorkspaces} value={data.total_workspaces} hint={`${data.active_workspaces} ${content.adminMetricActiveSuffix}`} icon="building" tone="accent" />
        <Metric label={content.adminMetricTrials} value={data.trial_workspaces} hint={content.adminMetricTrialsHint} icon="clock" tone="amber" />
        <Metric label={content.adminMetricPages} value={data.connected_pages} hint={content.adminMetricPagesHint} icon="page" tone="accent" />
        <Metric label={content.adminMetricComments} value={data.comments_processed_7d} hint={content.adminMetricSevenDays} icon="search" tone="violet" />
        <Metric label={content.adminMetricReplies} value={data.replies_sent_7d} hint={content.adminMetricSevenDays} icon="check" tone="accent" />
        <Metric label={content.adminMetricSuspended} value={data.suspended_workspaces} hint={content.adminMetricSuspendedHint} icon="ban" tone="amber" />
      </ul>

      <div className="admin-content-grid">
        <Card
          title={content.adminRecentWorkspaces}
          description={content.adminRecentWorkspacesLead}
          actions={<Link className="ws-btn" data-size="sm" data-variant="secondary" to="/admin/workspaces">{content.adminViewAll}</Link>}
        >
          <div className="admin-table-wrap">
            <table className="admin-table">
              <caption className="sr-only">{content.adminRecentWorkspaces}</caption>
              <thead><tr><th>{content.adminWorkspace}</th><th>{content.adminStatus}</th><th>{content.adminPages}</th><th>{content.adminComments}</th><th>{content.adminLastActivity}</th></tr></thead>
              <tbody>
                {data.recent_workspaces.map((workspace) => (
                  <tr key={workspace.id}>
                    <td><Link className="admin-table-primary" to={`/admin/workspaces/${encodeURIComponent(workspace.id)}`}>{workspace.name}</Link><span className="admin-table-secondary">{workspace.id}</span></td>
                    <td><Badge tone={statusTone(workspace.status)} dot>{statusLabel(workspace.status, content)}</Badge></td>
                    <td>{workspace.page_count}</td>
                    <td>{workspace.comments_processed_7d}</td>
                    <td>{dateLabel(workspace.latest_activity_at, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={content.adminReplyHealth} description={content.adminReplyHealthLead}>
          <div className="admin-health-list">
            <HealthRow label={content.adminRepliesSent} value={data.replies_sent_7d} tone="accent" />
            <HealthRow label={content.adminReplyFailures} value={data.reply_failures_7d} tone={data.reply_failures_7d ? 'danger' : 'neutral'} />
          </div>
          <p className="admin-data-note"><Icon name="info" />{content.adminSevenDayNote}</p>
        </Card>
      </div>
    </Page>
  )
}

function Metric({ label, value, hint, icon, tone }: { label: string; value: number; hint: string; icon: 'building' | 'clock' | 'page' | 'search' | 'check' | 'ban'; tone: 'accent' | 'amber' | 'violet' }) {
  return (
    <li className="admin-metric-card" data-tone={tone}>
      <div className="admin-metric-head"><span>{label}</span><span className="admin-metric-icon"><Icon name={icon} /></span></div>
      <strong>{value.toLocaleString()}</strong>
      <small>{hint}</small>
    </li>
  )
}

function HealthRow({ label, value, tone }: { label: string; value: number; tone: 'accent' | 'amber' | 'danger' | 'neutral' }) {
  return <div className="admin-health-row"><span className="admin-health-row-dot" data-tone={tone} /><span>{label}</span><strong>{value.toLocaleString()}</strong></div>
}
