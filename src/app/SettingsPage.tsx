import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Switch } from '@/components/animate-ui/components/headless/switch'
import { Label } from '@/components/ui/label'

import {
  ApiError, type AutoDeleteDelayMinutes, getSettings,
  setAutoDeleteDelay, setAutoHideOffensive, type WorkspaceSettings,
} from '../api/client'
import { copy, type Locale } from './copy'
import {
  Badge, Banner, Card, Icon, Page, PageHead, PageState, SelectField,
} from './ui'

const AUTO_DELETE_OPTIONS: AutoDeleteDelayMinutes[] = [0, 5, 30, 60, 720, 1440]

type SettingsPageProps = { locale: Locale }
type SaveState = 'idle' | 'saving' | 'saved'

export function SettingsPage({ locale }: SettingsPageProps) {
  const content = copy[locale]
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [autoDeleteState, setAutoDeleteState] = useState<SaveState>('idle')
  const [autoHideState, setAutoHideState] = useState<SaveState>('idle')


  const load = useCallback(async () => {
    try {
      setSettings(await getSettings())
    } catch {
      setSettings(null)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  if (!loaded) {
    return <PageState kind="loading" message={content.modLoading} />
  }
  if (!settings) {
    return <PageState kind="error" message={content.modErrorTitle} />
  }

  const isOwner = settings.your_role === 'owner'

  async function saveAutoDelete(nextDelay: AutoDeleteDelayMinutes) {
    setAutoDeleteState('saving')
    setProblem(null)
    try {
      setSettings(await setAutoDeleteDelay(nextDelay))
      setAutoDeleteState('saved')
    } catch (caught) {
      setAutoDeleteState('idle')
      setProblem(
        caught instanceof ApiError && caught.status === 403
          ? content.setAutoDeleteOwnerOnly
          : content.authUnreachable,
      )
    }
  }

  async function saveAutoHideOffensiveToggle(nextEnabled: boolean) {
    setAutoHideState('saving')
    setProblem(null)
    try {
      setSettings(await setAutoHideOffensive(nextEnabled))
      setAutoHideState('saved')
    } catch (caught) {
      setAutoHideState('idle')
      setProblem(
        caught instanceof ApiError && caught.status === 403
          ? content.setModerationOwnerOnly
          : content.authUnreachable,
      )
    }
  }

  return (
    <Page>
      <PageHead
        actions={
          <Badge tone={settings.is_sandbox ? 'amber' : 'accent'} dot>
            {settings.is_sandbox ? content.setSandbox : content.setConnected}
          </Badge>
        }
        lead={content.setLead}
        title={content.setTitle}
      />

      {problem && <Banner role="alert" tone="danger">{problem}</Banner>}

      <div className="ws-split">
        <nav aria-label={content.setTitle} className="ws-sidenav">
          <a className="ws-sidenav-link" href="#settings-general">
            <Icon name="building" />
            <span>{content.setNavGeneral}</span>
          </a>
          <Link className="ws-sidenav-link" to="/app/profile">
            <Icon name="user" />
            <span>{content.setNavProfile}</span>
          </Link>
        </nav>

        <div className="ws-stack">
          <div className="ws-stack" id="settings-general">
            <Card description={content.setModerationLead} title={content.setModeration}>
              <div className="ws-form ws-settings-section">
                <SelectField
                  disabled={!isOwner}
                  hint={isOwner ? content.setAutoDeleteLead : content.setAutoDeleteOwnerOnly}
                  id="set-auto-delete"
                  label={content.setAutoDelete}
                  onChange={(e) => void saveAutoDelete(Number(e.target.value) as AutoDeleteDelayMinutes)}
                  value={settings.auto_delete_delay_minutes}
                >
                  {AUTO_DELETE_OPTIONS.map((minutes) => (
                    <option key={minutes} value={minutes}>{content.setAutoDeleteOptions[minutes]}</option>
                  ))}
                </SelectField>
                {autoDeleteState === 'saved' && (
                  <span className="ws-save-state" role="status">{content.setSaved}</span>
                )}
              </div>

              <div className="ws-form ws-settings-section">
                <Label className="flex items-center gap-x-3">
                  <Switch
                    aria-describedby="set-auto-hide-offensive-hint"
                    checked={settings.auto_hide_offensive}
                    disabled={!isOwner}
                    onChange={(next) => {
                      // Headless UI's Switch always calls back with a boolean;
                      // the union with ChangeEvent is a typing artifact from
                      // intersecting Switch's props with native button props.
                      if (typeof next === 'boolean') void saveAutoHideOffensiveToggle(next)
                    }}
                  />
                  {content.setAutoHide}
                </Label>
                <p className="ws-field-hint" id="set-auto-hide-offensive-hint">
                  {isOwner ? content.setAutoHideLead : content.setModerationOwnerOnly}
                </p>
                {autoHideState === 'saved' && (
                  <span className="ws-save-state" role="status">{content.setSaved}</span>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  )
}
