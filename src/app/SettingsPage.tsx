import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  ApiError, getSettings, removeSampleComments, renameWorkspace,
  type WorkspaceSettings,
} from '../api/client'
import { copy, type Locale } from './copy'
import {
  Badge, Banner, Card, Fact, Icon, Page, PageHead, PageState, TextField,
} from './ui'

type SettingsPageProps = { locale: Locale }
type SaveState = 'idle' | 'saving' | 'saved'

export function SettingsPage({ locale }: SettingsPageProps) {
  const content = copy[locale]
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceState, setWorkspaceState] = useState<SaveState>('idle')
  const [problem, setProblem] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [cleared, setCleared] = useState<number | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)


  const load = useCallback(async () => {
    try {
      const found = await getSettings()
      setSettings(found)
      setWorkspaceName(found.workspace_name)
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
  // Gated on samples actually being stored rather than on the sandbox flag: a
  // workspace whose flag had been cleared kept its samples with no way to
  // remove them. `cleared` keeps the section mounted after the removal so the
  // outcome is actually read.
  const showSamples = isOwner && (settings.sample_comments > 0 || cleared !== null)

  async function clearSamples() {
    setClearing(true)
    try {
      const result = await removeSampleComments()
      setCleared(result.removed)
      setConfirmClear(false)
      setSettings((current) => current && { ...current, is_sandbox: false })
    } catch {
      setProblem(content.setSamplesError)
    } finally {
      setClearing(false)
    }
  }

  async function saveWorkspace(event: React.FormEvent) {
    event.preventDefault()
    if (!workspaceName.trim()) return
    setWorkspaceState('saving')
    setProblem(null)
    try {
      setSettings(await renameWorkspace(workspaceName.trim()))
      setWorkspaceState('saved')
    } catch (caught) {
      setWorkspaceState('idle')
      setProblem(
        caught instanceof ApiError && caught.status === 403
          ? content.setWorkspaceOwnerOnly
          : content.authUnreachable,
      )
    }
  }

  // Anchors, not a switcher: settings is short enough that hiding a section
  // behind a tab only makes it harder to find.
  const sections: Array<{ id: string; label: string; icon: 'building' | 'trash' }> = [
    { id: 'settings-general', label: content.setNavGeneral, icon: 'building' },
    ...(showSamples ? [{ id: 'settings-data', label: content.setNavData, icon: 'trash' as const }] : []),
  ]

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
          {sections.map((item) => (
            <a className="ws-sidenav-link" href={`#${item.id}`} key={item.id}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
          <Link className="ws-sidenav-link" to="/app/profile">
            <Icon name="user" />
            <span>{content.setNavProfile}</span>
          </Link>
        </nav>

        <div className="ws-stack">
          <div className="ws-stack" id="settings-general">
            <Card description={content.setGeneralLead} title={content.setWorkspace}>
                <form className="ws-form" noValidate onSubmit={saveWorkspace}>
                  <TextField
                    disabled={!isOwner}
                    error={workspaceName.trim() ? null : content.errNameRequired}
                    hint={isOwner ? undefined : content.setWorkspaceOwnerOnly}
                    id="set-workspace"
                    label={content.setWorkspaceName}
                    onChange={(e) => { setWorkspaceName(e.target.value); setWorkspaceState('idle') }}
                    value={workspaceName}
                  />
                  {isOwner && (
                    <div className="ws-form-actions">
                      <button className="ws-btn" disabled={workspaceState === 'saving'} type="submit">
                        {workspaceState === 'saving' ? content.setSaving : content.setSave}
                      </button>
                      {workspaceState === 'saved' && (
                        <span className="ws-save-state" role="status">{content.setSaved}</span>
                      )}
                    </div>
                  )}
                </form>
              </Card>

              <Card title={content.proDetails}>
                <dl className="ws-facts">
                  <Fact term={content.setPlan}>
                    {settings.is_sandbox ? content.setSandbox : content.setConnected}
                  </Fact>
                  <Fact term={content.proRole}>
                    {settings.your_role === 'owner' ? content.teamOwner : content.teamMember}
                  </Fact>
                  <Fact term={content.setWorkspaceId}>{settings.workspace_id}</Fact>
                </dl>
              </Card>

              <Card
                actions={
                  <Link className="ws-btn" data-variant="secondary" to="/app/profile">
                    <span>{content.setOpenProfile}</span>
                    <Icon className="ws-btn-icon" name="arrowRight" />
                  </Link>
                }
                description={content.setYouLead}
                title={content.setYou}
              />
          </div>

          {showSamples && (
            <div id="settings-data">
            <Card description={content.setSamplesLead} title={content.setSamples} tone="danger">
              <div className="ws-stack-tight">
                {cleared === null ? (
                  <>
                    <Banner icon="info" tone="amber">
                      {content.setSamplesCount(settings.sample_comments)}
                    </Banner>
                    {confirmClear ? (
                      <>
                        <Banner role="status" title={content.setSamplesConfirm} tone="danger" />
                        <div className="ws-form-actions">
                          <button
                            className="ws-btn"
                            data-variant="danger-solid"
                            disabled={clearing}
                            onClick={() => void clearSamples()}
                            type="button"
                          >
                            {clearing ? content.setSamplesClearing : content.setSamplesYes}
                          </button>
                          <button
                            className="ws-btn"
                            data-variant="secondary"
                            disabled={clearing}
                            onClick={() => setConfirmClear(false)}
                            type="button"
                          >
                            {content.setSamplesCancel}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="ws-form-actions">
                        <button
                          className="ws-btn"
                          data-variant="danger"
                          onClick={() => setConfirmClear(true)}
                          type="button"
                        >
                          <Icon className="ws-btn-icon" name="trash" />
                          <span>{content.setSamplesRemove}</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Banner icon="check" role="status" tone="accent">
                    {content.setSamplesDone(cleared)}
                  </Banner>
                )}
              </div>
            </Card>
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}
