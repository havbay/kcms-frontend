import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import {
  ApiError, listAuthProviders, type Providers, signIn, signInWithTelegram,
} from '../api/client'
import { AuthField } from './AuthField'
import { copy, type Locale } from './copy'
import { useSession } from './session'

type SignInPageProps = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export function SignInPage({ locale, setLocale }: SignInPageProps) {
  const content = copy[locale]
  const session = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [providers, setProviders] = useState<Providers | null>(null)
  const telegramSlot = useRef<HTMLDivElement>(null)

  const loadProviders = useCallback(async () => {
    try {
      setProviders(await listAuthProviders())
    } catch {
      setProviders({ email: true, telegram: false, telegram_bot_username: null })
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProviders()
  }, [loadProviders])

  // The Telegram widget is injected only when a bot is actually configured,
  // so an unconfigured provider shows nothing rather than a dead button.
  useEffect(() => {
    if (!providers?.telegram || !providers.telegram_bot_username || !telegramSlot.current) return
    const globalWindow = window as unknown as Record<string, unknown>
    globalWindow.onTelegramAuth = async (payload: Record<string, string>) => {
      setBusy(true)
      try {
        const created = await signInWithTelegram(payload)
        session.signIn(created.token, created.user)
      } catch {
        setError(content.authUnreachable)
      } finally {
        setBusy(false)
      }
    }
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', providers.telegram_bot_username)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    telegramSlot.current.append(script)
    return () => script.remove()
  }, [providers, session, content.authUnreachable])

  if (session.status === 'signed-in') return <Navigate replace to="/app" />

  // Validation lives here so the same rules drive blur, change and submit.
  const problems: Record<string, string | null> = {
    email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ? null : content.errEmail,
    password: !password ? content.errPasswordRequired : null,
  }
  const shownProblem = (field: string) => (touched[field] ? problems[field] : null)
  const invalidFields = Object.entries(problems).filter(([, message]) => message)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (invalidFields.length > 0) {
      // Reveal every problem at once rather than one per attempt.
      setTouched({ email: true, password: true })
      return
    }
    setBusy(true)
    setError(null)
    try {
      const created = await signIn(email.trim(), password)
      session.signIn(created.token, created.user)
    } catch (caught) {
      const status = caught instanceof ApiError ? caught.status : 0
      setError(
        status === 401 || status === 422 ? content.authFailed
          : content.authUnreachable,
      )
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

      <main className="auth">
        <h1>{content.authSignInTitle}</h1>

        <p className="auth-lead">{content.authSignInLead}</p>

        <form className="auth-form" noValidate onSubmit={submit}>
          <AuthField
            autoComplete="email"
            error={shownProblem('email')}
            id="auth-email"
            inputMode="email"
            label={content.authEmail}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            value={email}
          />

          <AuthField
            autoComplete="current-password"
            error={shownProblem('password')}
            id="auth-password"
            label={content.authPassword}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            value={password}
          />

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="button button-block" disabled={busy} type="submit">
            {busy ? content.authWorking : content.authSignIn}
          </button>
        </form>

        {providers?.telegram && (
          <>
            <p className="auth-divider"><span>{content.authOr}</span></p>
            <div className="auth-telegram" ref={telegramSlot} />
          </>
        )}

        <p className="auth-switch">
          {content.authAccessPrompt} <Link className="text-link" to="/request-access">{content.requestAccess}</Link>
        </p>
      </main>
    </div>
  )
}
