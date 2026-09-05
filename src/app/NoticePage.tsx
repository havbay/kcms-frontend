import { Link } from 'react-router-dom'

import { copy, type Locale } from './copy'

type NoticeKind = 'request-access' | 'sign-in' | 'not-found'

type NoticePageProps = {
  kind: NoticeKind
  locale: Locale
  setLocale: (locale: Locale) => void
}

/** Routes that are navigation targets for later slices. They must say what is
 *  and is not built — a blank screen reads as a broken product. */
export function NoticePage({ kind, locale, setLocale }: NoticePageProps) {
  const content = copy[locale]

  const { title, body, hint } = {
    'request-access': {
      title: content.requestTitle,
      body: content.requestBody,
      hint: content.requestDemoHint,
    },
    'sign-in': { title: content.signInTitle, body: content.signInBody, hint: null },
    'not-found': { title: content.notFoundTitle, body: content.notFoundBody, hint: null },
  }[kind]

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
        <h1>{title}</h1>
        <p>{body}</p>
        {hint && <p className="notice-hint">{hint}</p>}
        <div className="notice-actions">
          <Link className="button" to="/sign-up">{content.startTrial}<span aria-hidden="true">↗</span></Link>
          <Link className="text-link" to="/">{content.backHome}</Link>
        </div>
      </main>
    </div>
  )
}
