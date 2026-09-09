import { useCallback, useEffect, useState } from 'react'

import { getAdminAccess, revokeAdminSessions, type AdminAccess } from '../api/client'
import { Badge, Card, Icon, Page, PageHead, PageState } from './ui'
import { copy, type Locale } from './copy'
import { useSession } from './session'

type Props = { locale: Locale }

function dateLabel(value: string | null, locale: Locale): string {
  if (!value) return locale === 'km' ? 'មិនទាន់មាន' : 'No active session'
  return new Intl.DateTimeFormat(locale === 'km' ? 'km-KH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function AdminAccessPage({ locale }: Props) {
  const content = copy[locale]
  const session = useSession()
  const [data, setData] = useState<AdminAccess | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setState('loading')
    try {
      setData(await getAdminAccess())
      setState('ready')
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function revoke(userId: string) {
    setBusy(userId)
    try {
      await revokeAdminSessions(userId)
      await load()
    } finally {
      setBusy(null)
    }
  }

  if (state === 'loading') return <PageState kind="loading" message={content.adminLoading} />
  if (state === 'error' || !data) return <PageState kind="error" message={content.adminError} action={<button className="ws-btn" onClick={() => void load()} type="button">{content.adminRetry}</button>} />

  return (
    <Page>
      <PageHead title={content.adminAccess} lead={content.adminAccessLead} actions={<button className="ws-btn" onClick={() => void load()} type="button"><Icon name="clock" />{content.adminRefresh}</button>} />

      <div className="admin-content-grid">
        <Card title={content.adminAdmins} description={content.adminAdminsLead}>
          {data.admins.length === 0 ? <div className="admin-empty"><Icon name="key" /><strong>{content.adminNoAdmins}</strong></div> : <ul className="admin-access-list">{data.admins.map((admin) => { const isCurrent = admin.id === session.user?.id; return <li key={admin.id}><span className="ws-avatar" aria-hidden="true">{admin.display_name.slice(0, 2).toUpperCase()}</span><span className="admin-access-copy"><strong>{admin.display_name}{isCurrent && <Badge tone="accent">{content.adminCurrent}</Badge>}</strong><small>{admin.email}</small><small>{content.adminActiveSessions}: {admin.active_session_count} · {content.adminLastSession}: {dateLabel(admin.latest_session_at, locale)}</small></span>{isCurrent ? <span className="admin-access-current">{content.adminCurrentSession}</span> : <button className="ws-btn" data-size="sm" data-variant="secondary" disabled={busy === admin.id} onClick={() => void revoke(admin.id)} type="button">{content.adminRevokeSessions}</button>}</li> })}</ul>}
        </Card>

        <Card title={content.adminSecurity} description={content.adminSecurityLead}>
          <dl className="admin-fact-grid"><div><dt>{content.adminRoleManagement}</dt><dd><Badge tone="accent" dot>{content.adminDeploymentManaged}</Badge></dd></div><div><dt>{content.adminMfa}</dt><dd><Badge tone="amber" dot>{content.adminNotConfigured}</Badge></dd></div></dl>
          <p className="admin-data-note"><Icon name="info" />{content.adminAccessPolicy}</p>
        </Card>
      </div>
    </Page>
  )
}
