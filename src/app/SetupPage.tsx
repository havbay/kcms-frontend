import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { acceptSetupInvitation, previewSetupInvitation, type SetupInvitationPreview } from '../api/client'
import { AuthField } from './AuthField'
import type { Locale } from './copy'
import { useSession } from './session'

type Props = { locale: Locale; setLocale: (locale: Locale) => void }

const words = {
  en: {
    language: 'ភាសាខ្មែរ', checking: 'Checking invitation…', invalid: 'This invitation is no longer valid',
    invalidBody: 'It may have expired, been used, or been revoked. Ask the KCMS team for a fresh invitation.',
    requestAgain: 'Request a new invitation', ready: 'Your workspace is ready',
    readyBody: 'Your password was created securely. KCMS did not send or store it in an email.',
    open: 'Open workspace', invitation: 'One-time invitation', setup: 'Set up',
    forEmail: 'This invitation is for', owner: 'Choose your own password to become the workspace owner.',
    name: 'Your name', password: 'Create password', passwordHint: 'At least 8 characters. KCMS never emails this password.',
    failed: 'We could not complete setup. The invitation may have just expired or already been used.',
    creating: 'Creating account…', create: 'Create account',
  },
  km: {
    language: 'English', checking: 'កំពុងពិនិត្យការអញ្ជើញ…', invalid: 'ការអញ្ជើញនេះលែងមានសុពលភាពហើយ',
    invalidBody: 'វាអាចផុតកំណត់ ត្រូវបានប្រើ ឬដកហូត។ សូមស្នើសុំការអញ្ជើញថ្មីពីក្រុម KCMS។',
    requestAgain: 'ស្នើសុំការអញ្ជើញថ្មី', ready: 'កន្លែងការងាររបស់អ្នករួចរាល់ហើយ',
    readyBody: 'ពាក្យសម្ងាត់របស់អ្នកត្រូវបានបង្កើតដោយសុវត្ថិភាព។ KCMS មិនផ្ញើ ឬរក្សាទុកវាក្នុងអ៊ីមែលទេ។',
    open: 'បើកកន្លែងការងារ', invitation: 'ការអញ្ជើញប្រើបានម្តង', setup: 'រៀបចំ',
    forEmail: 'ការអញ្ជើញនេះសម្រាប់', owner: 'សូមបង្កើតពាក្យសម្ងាត់ផ្ទាល់ខ្លួន ដើម្បីក្លាយជាម្ចាស់កន្លែងការងារ។',
    name: 'ឈ្មោះរបស់អ្នក', password: 'បង្កើតពាក្យសម្ងាត់', passwordHint: 'យ៉ាងហោចណាស់ 8 តួអក្សរ។ KCMS មិនផ្ញើពាក្យសម្ងាត់នេះតាមអ៊ីមែលទេ។',
    failed: 'យើងមិនអាចបញ្ចប់ការរៀបចំបានទេ។ ការអញ្ជើញអាចទើបផុតកំណត់ ឬត្រូវបានប្រើរួច។',
    creating: 'កំពុងបង្កើតគណនី…', create: 'បង្កើតគណនី',
  },
} as const

export function SetupPage({ locale, setLocale }: Props) {
  const text = words[locale]
  const { token = '' } = useParams()
  const session = useSession()
  const [preview, setPreview] = useState<SetupInvitationPreview | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'invalid' | 'done'>('loading')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    try {
      setPreview(await previewSetupInvitation(token)); setState('ready')
    } catch { setState('invalid') }
  }, [token])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setFailed(false)
    try {
      const created = await acceptSetupInvitation(token, name.trim(), password)
      session.signIn(created.token, created.user); setState('done')
    } catch { setFailed(true) } finally { setBusy(false) }
  }

  return (
    <div className="site notice-shell onboarding-shell" lang={locale === 'km' ? 'km' : 'en'}>
      <header className="app-header">
        <Link aria-label="KCMS home" className="brand" to="/"><span aria-hidden="true" className="brand-mark"><span /><span /></span><span>KCMS</span></Link>
        <button className="language-toggle" onClick={() => setLocale(locale === 'en' ? 'km' : 'en')} type="button">
          <img alt="" aria-hidden="true" className="language-flag" src={locale === 'en' ? '/flags/kh.svg' : '/flags/gb.svg'} />
          {text.language}
        </button>
      </header>
      <main className="onboarding-card setup-card">
        {state === 'loading' && <p className="work-status" role="status">{text.checking}</p>}
        {state === 'invalid' && <div className="onboarding-result"><h1>{text.invalid}</h1><p>{text.invalidBody}</p><Link className="button" to="/request-access">{text.requestAgain}</Link></div>}
        {state === 'done' && <div className="onboarding-result"><span aria-hidden="true" className="result-mark">✓</span><h1>{text.ready}</h1><p>{text.readyBody}</p><Link className="button" to="/app">{text.open}</Link></div>}
        {state === 'ready' && preview && <>
          <div className="onboarding-heading"><p className="eyebrow">{text.invitation}</p><h1>{text.setup} {preview.organization}</h1><p>{text.forEmail} <strong>{preview.email}</strong>. {text.owner}</p></div>
          <form className="onboarding-form" onSubmit={submit}>
            <AuthField autoComplete="name" id="setup-name" label={text.name} onChange={(e) => setName(e.target.value)} required value={name} />
            <AuthField autoComplete="new-password" hint={text.passwordHint} id="setup-password" label={text.password} minLength={8} onChange={(e) => setPassword(e.target.value)} required type="password" value={password} />
            {failed && <p className="auth-error" role="alert">{text.failed}</p>}
            <button className="button button-block" disabled={busy} type="submit">{busy ? text.creating : text.create}</button>
          </form>
        </>}
      </main>
    </div>
  )
}
