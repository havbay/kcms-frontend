import { useCallback, useEffect, useState } from 'react'

import { listAdminAuditLog, type AdminAuditEvent } from '../api/client'
import { Badge, Card, Icon, Page, PageHead, PageState } from './ui'
import { copy, type Locale } from './copy'

type Props = { locale: Locale }

function dateLabel(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'km' ? 'km-KH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function metadataLabel(metadata: AdminAuditEvent['metadata']): string {
  const entries = Object.entries(metadata)
  if (!entries.length) return '—'
  return entries.map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`).join(' · ')
}

export function AdminAuditPage({ locale }: Props) {
  const content = copy[locale]
  const [events, setEvents] = useState<AdminAuditEvent[] | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  const load = useCallback(async () => {
    setState('loading')
    try {
      setEvents(await listAdminAuditLog())
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
  if (state === 'error' || !events) return <PageState kind="error" message={content.adminError} action={<button className="ws-btn" onClick={() => void load()} type="button">{content.adminRetry}</button>} />

  return (
    <Page>
      <PageHead title={content.adminAudit} lead={content.adminAuditLead} actions={<button className="ws-btn" onClick={() => void load()} type="button"><Icon name="clock" />{content.adminRefresh}</button>} />
      <Card title={content.adminAuditEvents} description={content.adminAuditEventsLead}>
        {events.length === 0 ? <div className="admin-empty"><Icon name="clock" /><strong>{content.adminNoAudit}</strong><p>{content.adminNoAuditLead}</p></div> : <div className="admin-table-wrap"><table className="admin-table admin-audit-table"><caption className="sr-only">{content.adminAuditEvents}</caption><thead><tr><th>{content.adminTime}</th><th>{content.adminActor}</th><th>{content.adminAction}</th><th>{content.adminTarget}</th><th>{content.adminDetails}</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{dateLabel(event.created_at, locale)}</td><td>{event.actor}</td><td><Badge tone="neutral">{event.action}</Badge></td><td><span className="admin-table-primary">{event.target_type}</span><span className="admin-table-secondary">{event.target_id}</span></td><td className="admin-audit-details">{metadataLabel(event.metadata)}</td></tr>)}</tbody></table></div>}
      </Card>
    </Page>
  )
}
