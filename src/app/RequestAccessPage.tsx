import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ApiError, createPilotRequest } from '../api/client'
import { AuthField } from './AuthField'
import type { Locale } from './copy'

type Props = { locale: Locale; setLocale: (locale: Locale) => void }

const words = {
  en: {
    title: 'Request pilot access',
    lead: 'Tell us about your organization and Facebook Page. We review every request before creating client access.',
    name: 'Your name', org: 'Organization', email: 'Work email', page: 'Facebook Page',
    note: 'What should we know? (optional)', noteHint: 'For example: scam replies, abuse, or the Page you want to protect.',
    send: 'Send request', sending: 'Sending…', back: 'Back to home', language: 'ភាសាខ្មែរ',
    received: 'Request received', receivedBody: 'Our team will review it and contact you before creating access. We never send a password by email.',
    signIn: 'Already have an account? Sign in',
    error: 'We could not send your request. Your details are still here—please try again.',
  },
  km: {
    title: 'ស្នើសុំចូលប្រើសាកល្បង',
    lead: 'ប្រាប់យើងអំពីអង្គភាព និងទំព័រ Facebook របស់អ្នក។ យើងពិនិត្យសំណើនីមួយៗ មុនបង្កើតសិទ្ធិចូលប្រើ។',
    name: 'ឈ្មោះរបស់អ្នក', org: 'អង្គភាព', email: 'អ៊ីមែលការងារ', page: 'ទំព័រ Facebook',
    note: 'អ្វីដែលយើងគួរដឹង? (មិនចាំបាច់)', noteHint: 'ឧទាហរណ៍៖ មតិបោកប្រាស់ ការបំពាន ឬទំព័រដែលអ្នកចង់ការពារ។',
    send: 'ផ្ញើសំណើ', sending: 'កំពុងផ្ញើ…', back: 'ត្រឡប់ទៅទំព័រដើម', language: 'English',
    received: 'យើងបានទទួលសំណើ', receivedBody: 'ក្រុមរបស់យើងនឹងពិនិត្យ និងទាក់ទងអ្នក មុនបង្កើតសិទ្ធិចូលប្រើ។ យើងមិនផ្ញើពាក្យសម្ងាត់តាមអ៊ីមែលទេ។',
    signIn: 'មានគណនីរួចហើយ? ចូលប្រើ',
    error: 'យើងមិនអាចផ្ញើសំណើបានទេ។ ព័ត៌មានរបស់អ្នកនៅតែមាន សូមព្យាយាមម្តងទៀត។',
  },
} as const

export function RequestAccessPage({ locale, setLocale }: Props) {
  const text = words[locale]
  const [values, setValues] = useState({ name: '', organization: '', email: '', facebook_page: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)

  const set = (field: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(false)
    try {
      await createPilotRequest({
        name: values.name.trim(), organization: values.organization.trim(),
        email: values.email.trim(), facebook_page: values.facebook_page.trim(),
        note: values.note.trim() || null,
      })
      setDone(true)
    } catch (caught) {
      void (caught instanceof ApiError)
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="site notice-shell onboarding-shell" lang={locale === 'km' ? 'km' : 'en'}>
      <header className="app-header">
        <Link aria-label="KCMS home" className="brand" to="/">
          <span aria-hidden="true" className="brand-mark"><span /><span /></span><span>KCMS</span>
        </Link>
        <button className="language-toggle" onClick={() => setLocale(locale === 'en' ? 'km' : 'en')} type="button">
          <img alt="" aria-hidden="true" className="language-flag" src={locale === 'en' ? '/flags/kh.svg' : '/flags/gb.svg'} />
          {text.language}
        </button>
      </header>
      <main className="onboarding-card">
        {done ? (
          <div className="onboarding-result" role="status">
            <span aria-hidden="true" className="result-mark">✓</span>
            <h1>{text.received}</h1><p>{text.receivedBody}</p>
            <div className="notice-actions"><Link className="button" to="/">{text.back}</Link></div>
          </div>
        ) : (
          <>
            <div className="onboarding-heading"><p className="eyebrow">KCMS pilot</p><h1>{text.title}</h1><p>{text.lead}</p></div>
            <form className="onboarding-form" onSubmit={submit}>
              <div className="form-pair">
                <AuthField id="pilot-name" label={text.name} onChange={set('name')} required value={values.name} />
                <AuthField id="pilot-org" label={text.org} onChange={set('organization')} required value={values.organization} />
              </div>
              <AuthField id="pilot-email" label={text.email} onChange={set('email')} required type="email" value={values.email} />
              <AuthField id="pilot-page" label={text.page} onChange={set('facebook_page')} placeholder="facebook.com/yourpage" required value={values.facebook_page} />
              <div className="auth-field">
                <label htmlFor="pilot-note">{text.note}</label>
                <textarea id="pilot-note" onChange={set('note')} rows={4} value={values.note} />
                <p className="auth-field-hint">{text.noteHint}</p>
              </div>
              {error && <p className="auth-error" role="alert">{text.error}</p>}
              <button className="button button-block" disabled={busy} type="submit">{busy ? text.sending : text.send}</button>
            </form>
            <div className="onboarding-links"><Link className="text-link" to="/sign-in">{text.signIn}</Link><Link className="text-link" to="/">{text.back}</Link></div>
          </>
        )}
      </main>
    </div>
  )
}
