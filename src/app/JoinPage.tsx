import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { acceptInvitation, type InvitationPreview, previewInvitation } from '../api/client'
import { copy, type Locale } from './copy'
import { useSession } from './session'

type JoinPageProps = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

/** Public. Someone following an invitation link needs to see what they are
 *  joining before signing in — otherwise the only way to find out is to hand
 *  over credentials first. */
export function JoinPage({ locale, setLocale }: JoinPageProps) {
  const content = copy[locale]
  const { token = '' } = useParams()
  const session = useSession()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<InvitationPreview | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    try {
      setPreview(await previewInvitation(token))
    } catch {
      setPreview(null)
    } finally {
      setLoaded(true)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function accept() {
    setBusy(true)
    setFailed(false)
    try {
      await acceptInvitation(token)
      navigate('/app/team', { replace: true })
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="site notice-shell" lang={locale === 'km' ? 'km' : 'en'}>
      <header className="app-header">
        <Link aria-label="KCMS home" className="brand" to="/">
          <span aria-hidden="true" className="brand-mark"><span /><span /></span>
          <span>KCMS</span>
        </Link>
        <button
          aria-pressed={locale === 'km'}
          className="language-toggle"
          onClick={() => setLocale(locale === 'en' ? 'km' : 'en')}
          type="button"
        >
          <img alt="" aria-hidden="true" className="language-flag"
               src={locale === 'en' ? '/flags/kh.svg' : '/flags/gb.svg'} />
          {content.language}
        </button>
      </header>

      <main className="notice">
        {!loaded && <p className="work-status" role="status">{content.modLoading}</p>}

        {loaded && (!preview || failed) && (
          <>
            <h1>{content.joinInvalid}</h1>
            <div className="notice-actions">
              <Link className="button" to="/">{content.backHome}</Link>
            </div>
          </>
        )}

        {loaded && preview && !failed && (
          <>
            <h1>{content.joinTitle} {preview.workspace_name}</h1>
            <p>
              {content.joinRole}{' '}
              <strong>
                {preview.role === 'owner' ? content.teamOwner : content.teamMember}
              </strong>
            </p>
            <div className="notice-actions">
              {session.status === 'signed-in' ? (
                <button className="button" disabled={busy} onClick={() => void accept()} type="button">
                  {busy ? content.authWorking : content.joinAccept}
                </button>
              ) : (
                <Link className="button" to="/sign-in">{content.joinSignInFirst}</Link>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
