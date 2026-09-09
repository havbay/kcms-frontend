import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getAdminWorkspace, patchAdminWorkspaceEntitlement, type AdminWorkspaceDetail } from '../api/client'
import { Badge, Card, Icon, Page, PageHead, PageState } from './ui'
import { copy, type Locale } from './copy'

type Props = { locale: Locale }
type CopyContent = (typeof copy)[Locale]
type Plan = 'TRIAL' | 'STARTER' | 'GROWTH'

function dateLabel(value: string | null, locale: Locale): string {
  if (!value) return locale === 'km' ? 'មិនទាន់មាន' : 'Not yet'
  return new Intl.DateTimeFormat(locale === 'km' ? 'km-KH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function pageTone(status: AdminWorkspaceDetail['pages'][number]['status']): 'accent' | 'amber' | 'danger' {
  return status === 'HEALTHY' ? 'accent' : status === 'STALE' ? 'amber' : 'danger'
}

function pageStatusLabel(status: AdminWorkspaceDetail['pages'][number]['status'], content: CopyContent): string {
  return { HEALTHY: content.adminPageHealthy, STALE: content.adminPageStale, NEVER_SYNCED: content.adminPageNeverSynced, SUSPENDED: content.adminStatusSuspended }[status]
}

export function AdminWorkspacePage({ locale }: Props) {
  const content = copy[locale]
  const { workspaceId = '' } = useParams()
  const [data, setData] = useState<AdminWorkspaceDetail | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [selectedPlan, setSelectedPlan] = useState<Plan>('TRIAL')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setState('loading')
    try {
      const next = await getAdminWorkspace(workspaceId)
      setData(next)
      setSelectedPlan(next.plan as Plan)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [workspaceId])

  async function update(patch: { plan?: Plan; suspended?: boolean }) {
    if (!data) return
    setBusy(true)
    try {
      const next = await patchAdminWorkspaceEntitlement(data.id, patch)
      setData(next)
      setSelectedPlan(next.plan as Plan)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  if (state === 'loading') return <PageState kind="loading" message={content.adminLoading} />
  if (state === 'error') return <PageState kind="error" message={content.adminWorkspaceError} action={<button className="ws-btn" onClick={() => void load()} type="button">{content.adminRetry}</button>} />
  if (!data) return null

  return (
    <Page>
      <Link className="admin-back-link" to="/admin/workspaces"><Icon name="arrowRight" />{content.adminBackToWorkspaces}</Link>
      <PageHead title={data.name} lead={content.adminWorkspaceDetailLead} actions={<Badge tone={data.status === 'EXPIRED' ? 'danger' : data.status === 'ACTIVE' ? 'accent' : 'amber'} dot>{data.status}</Badge>} />

      <section className="admin-identity-card">
        <div className="admin-identity-mark"><Icon name="building" /></div>
        <div className="admin-identity-copy"><span>{content.adminWorkspaceId}</span><strong>{data.id}</strong><small>{content.adminCreated} {dateLabel(data.created_at, locale)}</small></div>
        <div className="admin-identity-facts"><span><strong>{data.member_count}</strong>{content.adminMembers}</span><span><strong>{data.page_count}</strong>{content.adminPages}</span><span><strong>{data.comments_processed}</strong>{content.adminComments}</span></div>
      </section>

      <ul className="admin-metric-grid admin-detail-metrics">
        <Metric label={content.adminMetricComments} value={data.metrics.comments_processed_7d} hint={content.adminMetricSevenDays} icon="search" tone="accent" />
        <Metric label={content.adminPendingComments} value={data.metrics.pending_comments} hint={content.adminInReview} icon="clock" tone="amber" />
        <Metric label={content.adminReviewedComments} value={data.metrics.reviewed_comments} hint={content.adminCompletedActions} icon="check" tone="accent" />
        <Metric label={content.adminMetricReplies} value={data.metrics.replies_sent_7d} hint={content.adminMetricSevenDays} icon="mail" tone="violet" />
      </ul>

      <div className="admin-detail-grid">
        <Card title={content.adminMembers} description={data.owner_name ? `${content.adminOwner}: ${data.owner_name}` : content.adminNoOwner}>
          <ul className="admin-member-list">
            {data.members.map((member) => <li key={member.id}><span className="ws-avatar" aria-hidden="true">{member.display_name.slice(0, 2).toUpperCase()}</span><span><strong>{member.display_name}</strong><small>{member.role}</small></span><Badge tone={member.role === 'owner' ? 'violet' : 'neutral'}>{member.role === 'owner' ? content.adminOwner : content.adminMember}</Badge></li>)}
          </ul>
        </Card>

        <Card title={content.adminPages} description={content.adminPagesLead}>
          {data.pages.length === 0 ? <div className="admin-inline-empty"><Icon name="page" />{content.adminNoPages}</div> : <ul className="admin-page-list">{data.pages.map((page) => <li key={page.page_id}><span className="admin-page-mark"><Icon name="facebook" /></span><span className="admin-page-copy"><strong>{page.page_name}</strong><small>{page.page_id}</small><small>{content.adminLastSync}: {dateLabel(page.last_synced_at, locale)}</small></span><Badge tone={pageTone(page.status)} dot>{pageStatusLabel(page.status, content)}</Badge></li>)}</ul>}
        </Card>

        <Card title={content.adminWorkspaceActivity} description={content.adminWorkspaceActivityLead}>
          <dl className="admin-fact-grid">
            <div><dt>{content.adminOwner}</dt><dd>{data.owner_name ?? content.adminNotAvailable}</dd></div>
            <div><dt>{content.adminPlan}</dt><dd>{data.plan}</dd></div>
            <div><dt>{content.adminAutoReplies}</dt><dd><Badge tone={data.auto_reply_enabled ? 'accent' : 'neutral'} dot>{data.auto_reply_enabled ? content.adminEnabled : content.adminDisabled}</Badge></dd></div>
            <div><dt>{content.adminLastActivity}</dt><dd>{dateLabel(data.latest_activity_at, locale)}</dd></div>
          </dl>
        </Card>

        <Card title={content.adminWorkspaceControls} description={content.adminWorkspaceControlsLead}>
          <div className="admin-control-stack">
            <label htmlFor="admin-workspace-plan">{content.adminPlan}</label>
            <div className="admin-control-row"><select id="admin-workspace-plan" disabled={busy} onChange={(event) => setSelectedPlan(event.target.value as Plan)} value={selectedPlan}><option value="TRIAL">TRIAL</option><option value="STARTER">STARTER</option><option value="GROWTH">GROWTH</option></select><button className="ws-btn" disabled={busy || selectedPlan === data.plan} onClick={() => void update({ plan: selectedPlan })} type="button">{content.adminSavePlan}</button></div>
            <button className="ws-btn" data-variant="secondary" disabled={busy} onClick={() => void update({ suspended: !data.is_suspended })} type="button">{data.is_suspended ? content.adminReactivate : content.adminSuspend}</button>
          </div>
        </Card>

        <Card title={content.adminReplyHealth} description={content.adminReplyHealthLead}>
          <div className="admin-health-list"><HealthRow label={content.adminRepliesSent} value={data.metrics.replies_sent_7d} tone="accent" /><HealthRow label={content.adminReplyFailures} value={data.metrics.reply_failures_7d} tone={data.metrics.reply_failures_7d ? 'danger' : 'neutral'} /></div>
          <p className="admin-data-note"><Icon name="info" />{content.adminNoCommentContent}</p>
        </Card>
      </div>
    </Page>
  )
}

function Metric({ label, value, hint, icon, tone }: { label: string; value: number; hint: string; icon: 'search' | 'clock' | 'check' | 'mail'; tone: 'accent' | 'amber' | 'violet' }) {
  return <li className="admin-metric-card" data-tone={tone}><div className="admin-metric-head"><span>{label}</span><span className="admin-metric-icon"><Icon name={icon} /></span></div><strong>{value.toLocaleString()}</strong><small>{hint}</small></li>
}

function HealthRow({ label, value, tone }: { label: string; value: number; tone: 'accent' | 'danger' | 'neutral' }) {
  return <div className="admin-health-row"><span className="admin-health-row-dot" data-tone={tone} /><span>{label}</span><strong>{value.toLocaleString()}</strong></div>
}
