import { useCallback, useEffect, useState } from 'react'

import {
  type AccessRequest, createAccessRequest, getMyAccessRequest,
  type MonthlyComments, type TeamSize,
} from '../api/client'
import { AuthField } from './AuthField'
import { copy, type Locale } from './copy'

type ConnectPageProps = { locale: Locale }

const VOLUMES: MonthlyComments[] = ['UNDER_1K', '1K_TO_10K', '10K_TO_50K', 'OVER_50K']
const TEAMS: TeamSize[] = ['JUST_ME', '2_TO_5', '6_TO_20', 'OVER_20']

export function ConnectPage({ locale }: ConnectPageProps) {
  const content = copy[locale]
  const [existing, setExisting] = useState<AccessRequest | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [pageName, setPageName] = useState('')
  const [volume, setVolume] = useState<MonthlyComments>('1K_TO_10K')
  const [team, setTeam] = useState<TeamSize>('2_TO_5')
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    try {
      setExisting(await getMyAccessRequest())
    } catch {
      setExisting(null)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const pageProblem = !pageName.trim() ? content.errPageName : null

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (pageProblem) {
      setTouched(true)
      return
    }
    setBusy(true)
    setFailed(false)
    try {
      setExisting(
        await createAccessRequest({
          page_name: pageName.trim(),
          monthly_comments: volume,
          team_size: team,
          note: note.trim() || null,
        }),
      )
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  if (!loaded) {
    return <main className="dash-body"><p className="work-status" role="status">{content.modLoading}</p></main>
  }

  // A pending or approved request replaces the form: resubmitting would only
  // overwrite a request already waiting on someone.
  if (existing && existing.status !== 'DECLINED') {
    const approved = existing.status === 'APPROVED'
    return (
      <main className="dash-body">
        <div className={`conn-outcome ${approved ? 'is-approved' : 'is-pending'}`} role="status">
          <h1>{approved ? content.connApprovedTitle : content.connPendingTitle}</h1>
          <p>{approved ? content.connApprovedBody : content.connPendingBody}</p>
          <dl className="conn-summary">
            <div><dt>{content.connPage}</dt><dd>{existing.page_name}</dd></div>
            <div>
              <dt>{content.connVolume}</dt>
              <dd>{content[`vol${existing.monthly_comments}` as keyof typeof content] as string}</dd>
            </div>
            <div>
              <dt>{content.connTeam}</dt>
              <dd>{content[`team${existing.team_size}` as keyof typeof content] as string}</dd>
            </div>
          </dl>
        </div>
      </main>
    )
  }

  return (
    <main className="dash-body">
      <header className="dash-head">
        <h1>{content.connTitle}</h1>
        <p>{content.connLead}</p>
      </header>

      {existing?.status === 'DECLINED' && (
        <div className="conn-outcome is-declined" role="alert">
          <h2>{content.connDeclinedTitle}</h2>
          <p>{existing.decision_reason}</p>
        </div>
      )}

      <form className="conn-form" noValidate onSubmit={submit}>
        <AuthField
          error={touched ? pageProblem : null}
          id="conn-page"
          label={content.connPage}
          onBlur={() => setTouched(true)}
          onChange={(e) => setPageName(e.target.value)}
          placeholder="facebook.com/yourpage"
          value={pageName}
        />

        <div className="auth-field">
          <label htmlFor="conn-volume">{content.connVolume}</label>
          <select id="conn-volume" onChange={(e) => setVolume(e.target.value as MonthlyComments)} value={volume}>
            {VOLUMES.map((v) => (
              <option key={v} value={v}>{content[`vol${v}` as keyof typeof content] as string}</option>
            ))}
          </select>
        </div>

        <div className="auth-field">
          <label htmlFor="conn-team">{content.connTeam}</label>
          <select id="conn-team" onChange={(e) => setTeam(e.target.value as TeamSize)} value={team}>
            {TEAMS.map((t) => (
              <option key={t} value={t}>{content[`team${t}` as keyof typeof content] as string}</option>
            ))}
          </select>
        </div>

        <div className="auth-field">
          <label htmlFor="conn-note">{content.connNote}</label>
          <textarea id="conn-note" onChange={(e) => setNote(e.target.value)} rows={3} value={note} />
          <p className="auth-field-hint">{content.connNoteHint}</p>
        </div>

        {failed && <p className="auth-error" role="alert">{content.authUnreachable}</p>}

        <button className="button" disabled={busy} type="submit">
          {busy ? content.connSending : existing ? content.connResubmit : content.connSubmit}
        </button>
      </form>
    </main>
  )
}
