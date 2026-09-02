import { useCallback, useEffect, useState } from 'react'

import {
  ApiError, type CreatedInvitation, createInvitation, getTeam,
  removeMember, revokeInvitation, type Team,
} from '../api/client'
import { copy, type Locale } from './copy'
import { useSession } from './session'

type TeamPageProps = { locale: Locale }

export function TeamPage({ locale }: TeamPageProps) {
  const content = copy[locale]
  const session = useSession()
  const [team, setTeam] = useState<Team | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [role, setRole] = useState<'owner' | 'member'>('member')
  const [fresh, setFresh] = useState<CreatedInvitation | null>(null)
  const [copied, setCopied] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setTeam(await getTeam())
    } catch {
      setTeam(null)
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
  if (!team) {
    return <main className="dash-body"><p className="work-status">{content.modErrorTitle}</p></main>
  }

  const isOwner = team.your_role === 'owner'
  const inviteUrl = fresh ? `${window.location.origin}/join/${fresh.token}` : ''

  async function invite() {
    setBusy(true)
    setProblem(null)
    try {
      setFresh(await createInvitation(role))
      setCopied(false)
      await load()
    } catch {
      setProblem(content.authUnreachable)
    } finally {
      setBusy(false)
    }
  }

  async function remove(userId: string) {
    setProblem(null)
    try {
      await removeMember(userId)
      await load()
    } catch (caught) {
      // The backend refuses to leave a workspace without an owner; say why.
      setProblem(
        caught instanceof ApiError && caught.status === 409
          ? content.teamLastOwner
          : content.authUnreachable,
      )
    }
  }

  return (
    <main className="dash-body">
      <header className="dash-head">
        <div className="dash-head-text">
          <h1>{content.teamTitle}</h1>
          <p>{content.teamLead}</p>
        </div>
      </header>

      {problem && <p className="auth-error" role="alert">{problem}</p>}

      <ul className="team-list">
        {team.members.map((member) => {
          const you = member.user_id === session.user?.id
          const initials = member.display_name ? member.display_name.slice(0, 2).toUpperCase() : 'U'
          return (
            <li className="team-member" key={member.user_id}>
              <div className="team-member-main">
                <div className="team-avatar" aria-hidden="true">{initials}</div>
                <div className="team-info">
                  <p className="team-name">
                    {member.display_name}
                    {you && <span className="team-you">{content.teamYou}</span>}
                  </p>
                  {member.email && <p className="team-email">{member.email}</p>}
                </div>
              </div>
              <div className="team-member-meta">
                <span className={`work-chip role-${member.role}`}>
                  {member.role === 'owner' ? content.teamOwner : content.teamMember}
                </span>
                {isOwner && (
                  <button className="text-link team-remove"
                          onClick={() => void remove(member.user_id)} type="button">
                    {content.teamRemove}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {!isOwner && <p className="team-note">{content.teamOwnerOnly}</p>}

      {isOwner && (
        <section className="team-invite">
          <div className="team-invite-row">
            <div className="auth-field">
              <label htmlFor="invite-role">{content.teamInviteRole}</label>
              <select id="invite-role" onChange={(e) => setRole(e.target.value as 'owner' | 'member')}
                      value={role}>
                <option value="member">{content.teamMember}</option>
                <option value="owner">{content.teamOwner}</option>
              </select>
            </div>
            <button className="button" disabled={busy} onClick={() => void invite()} type="button">
              {content.teamInvite}
            </button>
          </div>

          {fresh && (
            <div className="team-link" role="status">
              <strong>{content.teamLinkTitle}</strong>
              <p>{content.teamLinkBody}</p>
              <div className="team-link-row">
                <input readOnly value={inviteUrl} />
                <button className="button button-small" type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText(inviteUrl)
                          setCopied(true)
                        }}>
                  {copied ? content.teamCopied : content.teamCopy}
                </button>
              </div>
            </div>
          )}

          {team.invitations.length > 0 && (
            <>
              <h2 className="team-subhead">{content.teamOpenInvites}</h2>
              <ul className="team-invites">
                {team.invitations.map((invitation) => (
                  <li key={invitation.token_hash}>
                    <span className={`work-chip role-${invitation.role}`}>
                      {invitation.role === 'owner' ? content.teamOwner : content.teamMember}
                    </span>
                    <span className="team-expiry">
                      {content.teamExpires} {new Date(invitation.expires_at).toLocaleDateString()}
                    </span>
                    <button className="text-link" type="button"
                            onClick={async () => {
                              await revokeInvitation(invitation.token_hash)
                              await load()
                            }}>
                      {content.teamRevoke}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </main>
  )
}
