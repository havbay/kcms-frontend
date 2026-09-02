import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getSettings, renameSelf, type WorkspaceSettings } from '../api/client'
import { copy, type Locale } from './copy'
import { useSession } from './session'
import {
  Avatar, Badge, Banner, Card, Fact, Icon, Page, PageHead, PageState, TextField,
} from './ui'

type ProfilePageProps = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

type SaveState = 'idle' | 'saving' | 'saved'

export function ProfilePage({ locale, setLocale }: ProfilePageProps) {
  const content = copy[locale]
  const session = useSession()
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [nameState, setNameState] = useState<SaveState>('idle')
  const [problem, setProblem] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const found = await getSettings()
      setSettings(found)
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
    return <PageState kind="loading" message={content.modLoading} />
  }
  if (!settings) {
    return <PageState kind="error" message={content.modErrorTitle} />
  }

  async function saveName(event: React.FormEvent) {
    event.preventDefault()
    if (!displayName.trim()) return
    setNameState('saving')
    setProblem(null)
    try {
      setSettings(await renameSelf(displayName.trim()))
      setNameState('saved')
      // Keep the sidebar's signed-in name in step with the change.
      await session.refresh()
    } catch {
      setNameState('idle')
      setProblem(content.authUnreachable)
    }
  }

  const isOwner = settings.your_role === 'owner'
  const isAdmin = Boolean(session.user?.is_platform_admin)

  return (
    <Page>
      <PageHead lead={content.proLead} title={content.proTitle} />

      {problem && <Banner role="alert" tone="danger">{problem}</Banner>}

      <div className="ws-identity">
        <Avatar name={settings.display_name} size="xl" />
        <div className="ws-identity-text">
          <span className="ws-card-note">{content.proIdentity}</span>
          <h2 className="ws-identity-name">{settings.display_name}</h2>
          <div className="ws-identity-tags">
            <Badge tone={isOwner ? 'violet' : 'neutral'}>
              {isOwner ? content.teamOwner : content.teamMember}
            </Badge>
            <Badge tone="neutral">
              <Icon className="ws-btn-icon" name="building" />
              {settings.workspace_name}
            </Badge>
            {isAdmin && <Badge tone="amber">{content.proAdmin}</Badge>}
          </div>
        </div>
      </div>

      <div className="ws-grid-2">
        <Card description={content.proAccountLead} title={content.proAccount}>
          <form className="ws-form" noValidate onSubmit={saveName}>
            <TextField
              error={displayName.trim() ? null : content.errNameRequired}
              hint={content.setNameNote}
              id="profile-name"
              label={content.setYourName}
              onChange={(e) => { setDisplayName(e.target.value); setNameState('idle') }}
              value={displayName}
            />
            <div className="ws-form-actions">
              <button className="ws-btn" disabled={nameState === 'saving'} type="submit">
                {nameState === 'saving' ? content.setSaving : content.setSave}
              </button>
              {nameState === 'saved' && (
                <span className="ws-save-state" role="status">{content.setSaved}</span>
              )}
            </div>
          </form>
        </Card>

        <Card description={content.proPreferencesLead} title={content.proPreferences}>
          <div className="ws-stack-tight">
            <span className="ws-field-label">{content.proLanguage}</span>
            <div className="ws-form-actions">
              <button
                aria-pressed={locale === 'en'}
                className="ws-btn"
                data-variant={locale === 'en' ? undefined : 'secondary'}
                onClick={() => setLocale('en')}
                type="button"
              >
                <img alt="" aria-hidden="true" className="ws-flag" src="/flags/gb.svg" />
                <span>English</span>
              </button>
              <button
                aria-pressed={locale === 'km'}
                className="ws-btn"
                data-variant={locale === 'km' ? undefined : 'secondary'}
                onClick={() => setLocale('km')}
                type="button"
              >
                <img alt="" aria-hidden="true" className="ws-flag" src="/flags/kh.svg" />
                <span>ភាសាខ្មែរ</span>
              </button>
            </div>
            <p className="ws-field-hint">{content.proLanguageHint}</p>
          </div>
        </Card>
      </div>

      <Card description={content.proDetailsLead} title={content.proDetails}>
        <dl className="ws-facts">
          <Fact term={content.proWorkspace}>{settings.workspace_name}</Fact>
          <Fact term={content.proRole}>{isOwner ? content.teamOwner : content.teamMember}</Fact>
          <Fact term={content.proAccess}>{isAdmin ? content.proAdmin : content.proStandard}</Fact>
          <Fact term={content.proUserId}>{session.user?.id ?? '—'}</Fact>
        </dl>
      </Card>

      <div className="ws-grid-2">
        <Card description={content.proWorkspaceLinkLead} title={content.proWorkspaceLink}>
          <div className="ws-form-actions ws-actions-end">
            <Link className="ws-btn" data-variant="secondary" to="/app/settings">
              <span>{content.proOpenSettings}</span>
              <Icon className="ws-btn-icon" name="arrowRight" />
            </Link>
          </div>
        </Card>

        <Card description={content.proSessionLead} title={content.proSession} tone="danger">
          <div className="ws-form-actions ws-actions-end">
            <button
              className="ws-btn"
              data-variant="danger"
              onClick={() => void session.signOut()}
              type="button"
            >
              <Icon className="ws-btn-icon" name="logout" />
              <span>{content.setSignOut}</span>
            </button>
          </div>
        </Card>
      </div>
    </Page>
  )
}
