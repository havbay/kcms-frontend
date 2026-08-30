import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import {
  ApiError, listAuthProviders, type Providers, signIn, signInWithTelegram, signUp,
} from '../api/client'
import { copy, type Locale } from './copy'
import { useSession } from './session'

type SignInPageProps = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export function SignInPage({ locale, setLocale }: SignInPageProps) {
  const content = copy[locale]
  const session = useSession()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
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

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created =
        mode === 'signin' ? await signIn(email, password) : await signUp(email, password, name)
      session.signIn(created.token, created.user)
    } catch (caught) {
      const status = caught instanceof ApiError ? caught.status : 0
      setError(
        status === 409 ? content.authTaken
          : status === 401 || status === 422 ? content.authFailed
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
        <h1>{mode === 'signin' ? content.authSignInTitle : content.authSignUpTitle}</h1>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && (
            <label className="auth-field">
              <span>{content.authName}</span>
              <input autoComplete="name" onChange={(e) => setName(e.target.value)} value={name} />
            </label>
          )}

          <label className="auth-field">
            <span>{content.authEmail}</span>
            <input autoComplete="email" onChange={(e) => setEmail(e.target.value)}
                   required type="email" value={email} />
          </label>

          <label className="auth-field">
            <span>{content.authPassword}</span>
            <input
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={mode === 'signup' ? 8 : undefined}
              onChange={(e) => setPassword(e.target.value)}
              required type="password" value={password}
            />
            {mode === 'signup' && <small>{content.authPasswordHint}</small>}
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="button button-block" disabled={busy} type="submit">
            {busy ? content.authWorking : mode === 'signin' ? content.authSignIn : content.authSignUp}
          </button>
        </form>

        {providers?.telegram && (
          <>
            <p className="auth-divider"><span>{content.authOr}</span></p>
            <div className="auth-telegram" ref={telegramSlot} />
          </>
        )}

        <button
          className="text-link auth-switch"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
          type="button"
        >
          {mode === 'signin' ? content.authSwitchToSignUp : content.authSwitchToSignIn}
        </button>
      </main>
    </div>
  )
}
