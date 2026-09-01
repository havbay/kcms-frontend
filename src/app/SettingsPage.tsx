import { useCallback, useEffect, useState } from 'react'

import {
  ApiError, getSettings, removeSampleComments, renameSelf, renameWorkspace,
  type WorkspaceSettings,
} from '../api/client'
import { AuthField } from './AuthField'
import { copy, type Locale } from './copy'
import { useSession } from './session'

type SettingsPageProps = { locale: Locale }
type SaveState = 'idle' | 'saving' | 'saved'

export function SettingsPage({ locale }: SettingsPageProps) {
  const content = copy[locale]
  const session = useSession()
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [workspaceState, setWorkspaceState] = useState<SaveState>('idle')
  const [nameState, setNameState] = useState<SaveState>('idle')
  const [problem, setProblem] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [cleared, setCleared] = useState<number | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const load = useCallback(async () => {
    try {
      const found = await getSettings()
      setSettings(found)
      setWorkspaceName(found.workspace_name)
      setDisplayName(found.display_name)
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
    return <main className="dash-body"><p className="work-status" role="status">{content.modLoading}</p></main>
  }
  if (!settings) {
    return <main className="dash-body"><p className="work-status">{content.modErrorTitle}</p></main>
  }

  const isOwner = settings.your_role === 'owner'

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

  async function saveName(event: React.FormEvent) {
    event.preventDefault()
    if (!displayName.trim()) return
    setNameState('saving')
    setProblem(null)
    try {
      const updated = await renameSelf(displayName.trim())
      setSettings(updated)
      setNameState('saved')
      // Keep the sidebar's "Signed in as" in step with the change.
      await session.refresh()
    } catch {
      setNameState('idle')
      setProblem(content.authUnreachable)
    }
  }

  return (
    <main className="dash-body">
      <header className="dash-head">
        <h1>{content.setTitle}</h1>
        <p>{content.setLead}</p>
      </header>

      {problem && <p className="auth-error" role="alert">{problem}</p>}

      <section className="settings-card">
        <h2>{content.setWorkspace}</h2>
        <form className="settings-form" noValidate onSubmit={saveWorkspace}>
          <AuthField
            disabled={!isOwner}
            error={workspaceName.trim() ? null : content.errNameRequired}
            hint={isOwner ? undefined : content.setWorkspaceOwnerOnly}
            id="set-workspace"
            label={content.setWorkspaceName}
            onChange={(e) => { setWorkspaceName(e.target.value); setWorkspaceState('idle') }}
            value={workspaceName}
          />
          {isOwner && (
            <button className="button button-small" disabled={workspaceState === 'saving'} type="submit">
              {workspaceState === 'saving' ? content.setSaving
                : workspaceState === 'saved' ? content.setSaved : content.setSave}
            </button>
          )}
        </form>

        <dl className="settings-facts">
          <div>
            <dt>{content.setPlan}</dt>
            <dd>{settings.is_sandbox ? content.setSandbox : content.setConnected}</dd>
          </div>
          <div>
            <dt>{content.teamYou}</dt>
            <dd>{settings.your_role === 'owner' ? content.teamOwner : content.teamMember}</dd>
          </div>
        </dl>
      </section>

      {/* Kept mounted after the removal so the outcome is actually read:
          clearing the samples turns is_sandbox off, which would otherwise
          unmount this section the instant it has something to report. */}
      {isOwner && (settings.is_sandbox || cleared !== null) && (
        <section className="settings-card">
          <h2>{content.setSamples}</h2>
          <p className="settings-note">{content.setSamplesLead}</p>
          {cleared === null ? confirmClear ? (
            <div className="settings-confirm">
              <p><strong>{content.setSamplesConfirm}</strong></p>
              <div className="settings-confirm-actions">
                <button className="button button-small button-danger" disabled={clearing} onClick={() => void clearSamples()} type="button">
                  {clearing ? content.setSamplesClearing : content.setSamplesYes}
                </button>
                <button className="button button-small button-quiet" disabled={clearing} onClick={() => setConfirmClear(false)} type="button">
                  {content.setSamplesCancel}
                </button>
              </div>
            </div>
          ) : (
            <button className="button button-small" onClick={() => setConfirmClear(true)} type="button">
              {content.setSamplesRemove}
            </button>
          ) : (
            <p className="settings-note" role="status">{content.setSamplesDone(cleared)}</p>
          )}
        </section>
      )}

      <section className="settings-card">
        <h2>{content.setYou}</h2>
        <form className="settings-form" noValidate onSubmit={saveName}>
          <AuthField
            error={displayName.trim() ? null : content.errNameRequired}
            hint={content.setNameNote}
            id="set-name"
            label={content.setYourName}
            onChange={(e) => { setDisplayName(e.target.value); setNameState('idle') }}
            value={displayName}
          />
          <button className="button button-small" disabled={nameState === 'saving'} type="submit">
            {nameState === 'saving' ? content.setSaving
              : nameState === 'saved' ? content.setSaved : content.setSave}
          </button>
        </form>

        <button className="text-link settings-signout"
                onClick={() => void session.signOut()} type="button">
          {content.setSignOut}
        </button>
      </section>
    </main>
  )
}
