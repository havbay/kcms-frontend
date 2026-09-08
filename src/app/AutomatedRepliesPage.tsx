import { useEffect, useState } from 'react'

import {
  ApiError,
  createAutoReplyRule,
  deleteAutoReplyRule,
  getAutoReplySettings,
  listAutoReplyEvents,
  listAutoReplyRules,
  patchAutoReplySettings,
  simulateAutoReply,
  updateAutoReplyRule,
  type AutoReplyChannel,
  type AutoReplyDecision,
  type AutoReplyEvent,
  type AutoReplyRule,
  type AutoReplySettings,
} from '../api/client'
import { copy, type Locale } from './copy'
import { Banner, Badge, Card, Page, PageHead, PageState, SelectField, Toggle } from './ui'

type AutomatedRepliesPageProps = { locale: Locale }

type RuleForm = {
  name: string
  keywords: string
  replyBody: string
  onComments: boolean
  onMessages: boolean
  enabled: boolean
}

const emptyForm: RuleForm = {
  name: '',
  keywords: '',
  replyBody: '',
  onComments: true,
  onMessages: false,
  enabled: false,
}

function apiMessage(error: unknown): string {
  if (error instanceof ApiError && error.detail) return error.detail
  return 'Something went wrong. Please try again.'
}

function decisionText(decision: AutoReplyDecision, content: (typeof copy)[Locale]): string {
  if (decision.kind === 'REPLY') return content.autoReplyWouldReply
  if (decision.kind === 'UNSAFE') return content.autoReplyUnsafe
  return content.autoReplyNoMatch
}

function rulePayload(form: RuleForm) {
  return {
    name: form.name,
    keywords: form.keywords.split('\n').map((keyword) => keyword.trim()).filter(Boolean),
    reply_body: form.replyBody,
    on_comments: form.onComments,
    on_messages: form.onMessages,
    enabled: form.enabled,
  }
}

export function AutomatedRepliesPage({ locale }: AutomatedRepliesPageProps) {
  const content = copy[locale]
  const [settings, setSettings] = useState<AutoReplySettings | null>(null)
  const [rules, setRules] = useState<AutoReplyRule[]>([])
  const [events, setEvents] = useState<AutoReplyEvent[]>([])
  const [form, setForm] = useState<RuleForm>(emptyForm)
  const [simulationText, setSimulationText] = useState('')
  const [simulationChannel, setSimulationChannel] = useState<AutoReplyChannel>('comments')
  const [decision, setDecision] = useState<AutoReplyDecision | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyRule, setBusyRule] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [nextSettings, nextRules, nextEvents] = await Promise.all([
        getAutoReplySettings(), listAutoReplyRules(), listAutoReplyEvents(),
      ])
      setSettings(nextSettings)
      setRules(nextRules)
      setEvents(nextEvents)
    } catch (loadError) {
      setError(apiMessage(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    async function refreshEvents() {
      try {
        setEvents(await listAutoReplyEvents())
      } catch {
        // Keep the last decision log visible when a background sync is delayed.
      }
    }
    window.addEventListener('kcms:comments-synced', refreshEvents)
    return () => window.removeEventListener('kcms:comments-synced', refreshEvents)
  }, [])

  if (loading) return <PageState kind="loading" message="Loading automated replies…" />
  if (error || !settings) {
    return <PageState kind="error" message={error ?? 'Automated replies are unavailable.'} action={<button className="ws-btn" onClick={() => void load()} type="button">Try again</button>} />
  }

  const owner = settings.your_role === 'owner'

  async function changeEnabled(enabled: boolean) {
    if (enabled && !settings?.enabled && !window.confirm(content.autoReplyLiveConfirm)) return
    setSaving(true)
    setError(null)
    try {
      setSettings(await patchAutoReplySettings({ enabled }))
    } catch (saveError) {
      setError(apiMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function addRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const created = await createAutoReplyRule(rulePayload(form))
      setRules((current) => [...current, created])
      setForm(emptyForm)
    } catch (saveError) {
      setError(apiMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function toggleRule(rule: AutoReplyRule) {
    setBusyRule(rule.id)
    setError(null)
    try {
      const updated = await updateAutoReplyRule(rule.id, { ...rulePayload({
        name: rule.name,
        keywords: rule.keywords.join('\n'),
        replyBody: rule.reply_body,
        onComments: rule.on_comments,
        onMessages: rule.on_messages,
        enabled: !rule.enabled,
      }) })
      setRules((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (saveError) {
      setError(apiMessage(saveError))
    } finally {
      setBusyRule(null)
    }
  }

  async function removeRule(rule: AutoReplyRule) {
    setBusyRule(rule.id)
    setError(null)
    try {
      await deleteAutoReplyRule(rule.id)
      setRules((current) => current.filter((item) => item.id !== rule.id))
    } catch (saveError) {
      setError(apiMessage(saveError))
    } finally {
      setBusyRule(null)
    }
  }

  async function runSimulation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    try {
      setDecision(await simulateAutoReply(simulationText, simulationChannel))
    } catch (simulationError) {
      setError(apiMessage(simulationError))
    }
  }

  return (
    <Page>
      <PageHead
        title={content.autoReplyTitle}
        lead={content.autoReplyLead}
        actions={<Badge tone={settings.enabled ? 'accent' : 'amber'} dot>{settings.enabled ? content.autoReplyLive : content.autoReplyOff}</Badge>}
      />

      <Banner icon="shield" tone={settings.enabled ? 'accent' : 'amber'} title={settings.enabled ? content.autoReplyLive : content.autoReplyOff}>
        {settings.enabled ? content.autoReplyLiveLead : content.autoReplyOffLead}
      </Banner>

      {error && <Banner icon="alert" role="alert" tone="danger">{error}</Banner>}

      <Card
        title={settings.enabled ? content.autoReplyOn : content.autoReplyOff}
        description={content.autoReplyOwnerOnly}
      >
        <div className="auto-reply-controls">
          <Toggle
            checked={settings.enabled}
            disabled={!owner || saving}
            hint={owner ? content.autoReplyLiveLead : content.autoReplyOwnerOnly}
            id="auto-reply-enabled"
            label={settings.enabled ? content.autoReplyOn : content.autoReplyOff}
            onChange={(value) => void changeEnabled(value)}
          />
        </div>
        <div className="auto-reply-scope">
          <span className="ws-field-label">{content.autoReplyScope}</span>
          <span className="auto-reply-scope-item is-active">{content.autoReplyFacebookCommentsOnly}</span>
          <span className="auto-reply-scope-item is-disabled">{content.autoReplyChannelMessages} · {content.autoReplyMessengerDevelopment}</span>
        </div>
      </Card>

      <div className="ws-grid-2">
        <Card title={content.autoReplyRuleTitle} description={content.autoReplyRuleLead}>
          <div className="ws-stack">
            {rules.length === 0 && <p className="ws-card-note">{content.autoReplyEmpty}</p>}
            {rules.map((rule) => (
              <div className="auto-reply-rule" key={rule.id}>
                <div className="auto-reply-rule-copy">
                  <div className="auto-reply-rule-title">
                    <strong>{rule.name}</strong>
                    <Badge tone={rule.enabled ? 'accent' : 'neutral'}>{rule.enabled ? 'ON' : 'OFF'}</Badge>
                  </div>
                  <p className="ws-card-note">{rule.keywords.join(' · ')}</p>
                  <p className="auto-reply-rule-body">{rule.reply_body}</p>
                  <small className="ws-field-hint">
                    {[rule.on_comments && content.autoReplyChannelComments, rule.on_messages && content.autoReplyChannelMessages].filter(Boolean).join(' · ')}
                  </small>
                  {rule.warnings.map((warning) => <small className="ws-field-hint" key={warning}>{warning}</small>)}
                </div>
                {owner && <div className="auto-reply-rule-actions">
                  <button className="ws-btn" disabled={busyRule === rule.id} onClick={() => void toggleRule(rule)} type="button">{rule.enabled ? 'Disable' : 'Enable'}</button>
                  <button className="ws-link-btn" data-tone="danger" disabled={busyRule === rule.id} onClick={() => void removeRule(rule)} type="button">{content.autoReplyRemove}</button>
                </div>}
              </div>
            ))}
          </div>
        </Card>

        {owner && <Card title={content.autoReplyAdd} description={content.autoReplyKeywordsHint}>
          <form className="ws-stack" onSubmit={(event) => void addRule(event)}>
            <div className="ws-field">
              <label className="ws-field-label" htmlFor="auto-reply-name">{content.autoReplyName}</label>
              <input id="auto-reply-name" onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} />
            </div>
            <div className="ws-field">
              <label className="ws-field-label" htmlFor="auto-reply-keywords">{content.autoReplyKeywords}</label>
              <textarea id="auto-reply-keywords" onChange={(event) => setForm({ ...form, keywords: event.target.value })} required rows={3} value={form.keywords} />
              <p className="ws-field-hint">{content.autoReplyKeywordsHint}</p>
            </div>
            <div className="ws-field">
              <label className="ws-field-label" htmlFor="auto-reply-body">{content.autoReplyBody}</label>
              <textarea id="auto-reply-body" onChange={(event) => setForm({ ...form, replyBody: event.target.value })} required rows={4} value={form.replyBody} />
            </div>
            <div className="auto-reply-checks">
              <label><input checked={form.onComments} onChange={(event) => setForm({ ...form, onComments: event.target.checked })} type="checkbox" /> {content.autoReplyChannelComments}</label>
              <label><input checked={form.onMessages} disabled type="checkbox" /> {content.autoReplyChannelMessages} <small>{content.autoReplyMessengerDevelopment}</small></label>
              <label><input checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} type="checkbox" /> {content.autoReplyEnabled}</label>
            </div>
            <button className="ws-btn" disabled={saving} type="submit">{saving ? content.autoReplyAdding : content.autoReplyAdd}</button>
          </form>
        </Card>}
      </div>

      <Card title={content.autoReplySimulator} description={content.autoReplySimulatorLead}>
        <form className="auto-reply-simulator" onSubmit={(event) => void runSimulation(event)}>
          <div className="ws-field auto-reply-simulator-text">
            <label className="ws-field-label" htmlFor="auto-reply-simulation">Message text</label>
            <textarea id="auto-reply-simulation" onChange={(event) => setSimulationText(event.target.value)} placeholder="Type a safe comment to test…" required rows={3} value={simulationText} />
          </div>
          <SelectField id="auto-reply-channel" label="Channel" onChange={(event) => setSimulationChannel(event.target.value as AutoReplyChannel)} value={simulationChannel}>
            <option value="comments">{content.autoReplyChannelComments}</option>
            <option disabled value="messages">{content.autoReplyChannelMessages} ({content.autoReplyMessengerDevelopment})</option>
          </SelectField>
          <button className="ws-btn" type="submit">{content.autoReplySimulate}</button>
        </form>
        {decision && <div className={`auto-reply-result ${decision.kind === 'REPLY' ? 'is-match' : ''}`} role="status">
          <strong>{decisionText(decision, content)}</strong>
          <span>{decision.reason ?? decision.reply_body}</span>
        </div>}
      </Card>

      <Card title={content.autoReplyEvents} description={content.autoReplyEventsLead}>
        {events.length === 0 ? <p className="ws-card-note">{content.autoReplyEventsEmpty}</p> : <div className="auto-reply-events" role="table">
          <div className="auto-reply-event-row is-head" role="row"><span>Decision</span><span>Reason</span><span>Channel</span><span>Time</span></div>
          {events.map((event) => <div className="auto-reply-event-row" key={event.id} role="row"><span><Badge tone={event.decision === 'would_reply' ? 'accent' : 'neutral'}>{event.decision}</Badge></span><span>{event.reason}</span><span>{event.channel}</span><span>{new Date(event.occurred_at).toLocaleString()}</span></div>)}
        </div>}
      </Card>
    </Page>
  )
}
