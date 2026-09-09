import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getAdminPlanOverview,
  listAdminWorkspaces,
  patchAdminWorkspaceEntitlement,
  type AdminPlanOverview,
  type AdminWorkspaceList,
  type AdminWorkspaceSummary,
} from '../api/client'
import { Badge, Card, Icon, Page, PageHead, PageState } from './ui'
import { copy, type Locale } from './copy'

type Props = { locale: Locale }
type Plan = 'TRIAL' | 'STARTER' | 'GROWTH'
type CopyContent = (typeof copy)[Locale]

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

export function AdminPlansPage({ locale }: Props) {
  const content = copy[locale]
  const [plans, setPlans] = useState<AdminPlanOverview | null>(null)
  const [workspaces, setWorkspaces] = useState<AdminWorkspaceList | null>(null)
  const [selected, setSelected] = useState<Record<string, Plan>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  const load = useCallback(async () => {
    setState('loading')
    try {
      const [nextPlans, nextWorkspaces] = await Promise.all([getAdminPlanOverview(), listAdminWorkspaces()])
      setPlans(nextPlans)
      setWorkspaces(nextWorkspaces)
      setSelected(Object.fromEntries(nextWorkspaces.items.map((workspace) => [workspace.id, workspace.plan as Plan])))
      setState('ready')
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function update(workspace: AdminWorkspaceSummary, patch: { plan?: Plan; suspended?: boolean }) {
    setBusy(workspace.id)
    try {
      await patchAdminWorkspaceEntitlement(workspace.id, patch)
      await load()
    } finally {
      setBusy(null)
    }
  }

  if (state === 'loading') return <PageState kind="loading" message={content.adminLoading} />
  if (state === 'error' || !plans || !workspaces) return <PageState kind="error" message={content.adminError} action={<button className="ws-btn" onClick={() => void load()} type="button">{content.adminRetry}</button>} />

  return (
    <Page>
      <PageHead title={content.adminPlans} lead={content.adminPlansLead} actions={<button className="ws-btn" onClick={() => void load()} type="button"><Icon name="clock" />{content.adminRefresh}</button>} />

      <div className="admin-plan-grid">
        {plans.plans.map((plan) => (
          <Card key={plan.plan} title={plan.plan} description={content.adminPlanCardLead}>
            <div className="admin-plan-limit"><strong>{plan.page_limit}</strong><span>{content.adminPageLimit}</span></div>
            <div className="admin-plan-facts"><span>{content.adminWorkspaces}: <strong>{plan.workspace_count}</strong></span><span>{content.adminSuspended}: <strong>{plan.suspended_count}</strong></span></div>
          </Card>
        ))}
      </div>

      <Card title={content.adminEntitlements} description={content.adminEntitlementsLead}>
        {workspaces.items.length === 0 ? (
          <div className="admin-empty"><Icon name="building" /><strong>{content.adminNoWorkspaces}</strong><p>{content.adminNoWorkspacesLead}</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-entitlements-table">
              <caption className="sr-only">{content.adminEntitlements}</caption>
              <thead><tr><th>{content.adminWorkspace}</th><th>{content.adminStatus}</th><th>{content.adminPlan}</th><th>{content.adminPageUsage}</th><th>{content.adminActions}</th></tr></thead>
              <tbody>
                {workspaces.items.map((workspace) => {
                  const plan = selected[workspace.id] ?? workspace.plan as Plan
                  const changing = plan !== workspace.plan
                  const isBusy = busy === workspace.id
                  return (
                    <tr key={workspace.id}>
                      <td><Link className="admin-table-primary" to={`/admin/workspaces/${encodeURIComponent(workspace.id)}`}>{workspace.name}</Link><span className="admin-table-secondary">{workspace.id}</span></td>
                      <td><Badge dot tone={statusTone(workspace.status)}>{statusLabel(workspace.status, content)}</Badge></td>
                      <td><select aria-label={`${content.adminPlan} ${workspace.name}`} disabled={isBusy} onChange={(event) => setSelected((current) => ({ ...current, [workspace.id]: event.target.value as Plan }))} value={plan}><option value="TRIAL">TRIAL</option><option value="STARTER">STARTER</option><option value="GROWTH">GROWTH</option></select></td>
                      <td>{workspace.page_count} / {workspace.page_limit} {content.adminPages}</td>
                      <td><div className="admin-row-actions"><button className="ws-btn" data-size="sm" disabled={!changing || isBusy} onClick={() => void update(workspace, { plan })} type="button">{content.adminSavePlan}</button><button className="ws-btn" data-size="sm" data-variant="secondary" disabled={isBusy} onClick={() => void update(workspace, { suspended: !workspace.is_suspended })} type="button">{workspace.is_suspended ? content.adminReactivate : content.adminSuspend}</button></div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  )
}
