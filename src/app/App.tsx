import { useState } from 'react'

const copy = {
  en: {
    howItWorks: 'How KCMS works', signIn: 'Sign in', language: 'ភាសាខ្មែរ',
    eyebrow: 'Khmer-first comment moderation',
    heading: 'Moderate Khmer comments with context—not guesswork.',
    description: 'Find harmful comments and scams faster. KCMS helps your team prioritize what needs attention, while humans decide every moderation action.',
    requestAccess: 'Request access', seeHow: 'See how it works',
    pathwayLabel: 'How a comment reaches human review', incoming: 'Facebook Page comment',
    sampleComment: 'គណនីនេះស្នើសុំលេខកូដ សូមប្រយ័ត្ន។', pattern: 'Pattern matching',
    patternDetail: 'Disclosed rules · v0.1', review: 'Needs human review',
    reviewDetail: 'Possible scam signal', human: 'Your team decides',
    humanDetail: 'Leave · Hide · Correct label', noAutomatic: 'No automatic moderation actions',
    facebook: 'Facebook comments', languageSupport: 'Khmer + Khmerlish', humanControlled: 'Human controlled',
  },
  km: {
    howItWorks: 'របៀបដំណើរការ', signIn: 'ចូលប្រើ', language: 'English',
    eyebrow: 'ការគ្រប់គ្រងមតិយោបល់ខ្មែរជាចម្បង',
    heading: 'គ្រប់គ្រងមតិយោបល់ខ្មែរ ដោយយល់ពីបរិបទ មិនមែនការស្មាន។',
    description: 'ស្វែងរកមតិយោបល់បង្កគ្រោះថ្នាក់ និងការបោកប្រាស់បានលឿនជាងមុន។ KCMS ជួយក្រុមរបស់អ្នកកំណត់អាទិភាព ខណៈមនុស្សជាអ្នកសម្រេចចិត្តលើសកម្មភាពគ្រប់យ៉ាង។',
    requestAccess: 'ស្នើសុំប្រើប្រាស់', seeHow: 'មើលរបៀបដំណើរការ',
    pathwayLabel: 'របៀបដែលមតិយោបល់ទៅដល់ការពិនិត្យដោយមនុស្ស', incoming: 'មតិយោបល់លើទំព័រ Facebook',
    sampleComment: 'គណនីនេះស្នើសុំលេខកូដ សូមប្រយ័ត្ន។', pattern: 'ការផ្គូផ្គងលំនាំ',
    patternDetail: 'ច្បាប់បង្ហាញច្បាស់ · v0.1', review: 'ត្រូវការមនុស្សពិនិត្យ',
    reviewDetail: 'អាចជាសញ្ញាបោកប្រាស់', human: 'ក្រុមរបស់អ្នកជាអ្នកសម្រេច',
    humanDetail: 'ទុក · លាក់ · កែស្លាក', noAutomatic: 'គ្មានសកម្មភាពគ្រប់គ្រងដោយស្វ័យប្រវត្តិ',
    facebook: 'មតិយោបល់ Facebook', languageSupport: 'ខ្មែរ + Khmerlish', humanControlled: 'គ្រប់គ្រងដោយមនុស្ស',
  },
} as const

type Locale = keyof typeof copy

function Brand() {
  return (
    <a aria-label="KCMS home" className="brand" href="/">
      <span aria-hidden="true" className="brand-mark"><span /><span /></span>
      <span>KCMS</span>
    </a>
  )
}

export function App() {
  const [locale, setLocale] = useState<Locale>('en')
  const [menuOpen, setMenuOpen] = useState(false)
  const content = copy[locale]

  return (
    <div className="site" lang={locale === 'km' ? 'km' : 'en'}>
      <header className="site-header">
        <Brand />
        <button aria-controls="primary-navigation" aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'} className="menu-toggle" onClick={() => setMenuOpen((isOpen) => !isOpen)} type="button">
          <span aria-hidden="true" className="menu-icon"><span /><span /></span>
        </button>
        <nav aria-label="Primary navigation" className="primary-navigation" data-open={menuOpen} id="primary-navigation">
          <a className="nav-link" href="#how-it-works">{content.howItWorks}</a>
          <button aria-pressed={locale === 'km'} className="language-toggle" onClick={() => setLocale(locale === 'en' ? 'km' : 'en')} type="button">
            <img
              alt=""
              aria-hidden="true"
              className="language-flag"
              src={locale === 'en' ? '/flags/kh.svg' : '/flags/gb.svg'}
            />
            {content.language}
          </button>
          <a className="nav-link" href="/sign-in">{content.signIn}</a>
          <a className="button button-small" href="/request-access">{content.requestAccess}</a>
        </nav>
      </header>

      <main>
        <section aria-labelledby="landing-heading" className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span aria-hidden="true" />{content.eyebrow}</p>
            <h1 id="landing-heading">{content.heading}</h1>
            <p className="hero-description">{content.description}</p>
            <div className="hero-actions">
              <a className="button" href="/request-access">{content.requestAccess}<span aria-hidden="true">↗</span></a>
              <a className="text-link" href="#how-it-works">{content.seeHow}<span aria-hidden="true">↓</span></a>
            </div>
            <ul aria-label="KCMS scope" className="scope-list">
              <li>{content.facebook}</li><li>{content.languageSupport}</li><li>{content.humanControlled}</li>
            </ul>
          </div>

          <figure aria-label={content.pathwayLabel} className="comment-pathway" id="how-it-works">
            <div aria-hidden="true" className="krama-rail krama-rail-left" />
            <div aria-hidden="true" className="krama-rail krama-rail-right" />
            <div className="comment-card pathway-card">
              <div className="comment-meta"><span aria-hidden="true" className="comment-avatar">ក</span><span>{content.incoming}</span><span aria-hidden="true" className="live-dot" /></div>
              <blockquote>{content.sampleComment}</blockquote>
            </div>
            <div aria-hidden="true" className="path-connector"><span /></div>
            <div className="pathway-step pathway-step-pattern">
              <span aria-hidden="true" className="step-number">01</span>
              <div><strong>{content.pattern}</strong><small>{content.patternDetail}</small></div>
              <span aria-hidden="true" className="rule-mark"><span /><span /><span /></span>
            </div>
            <div aria-hidden="true" className="path-connector"><span /></div>
            <div className="pathway-step pathway-step-review">
              <span aria-hidden="true" className="step-number">02</span>
              <div><strong>{content.review}</strong><small>{content.reviewDetail}</small></div>
              <span aria-hidden="true" className="review-mark">!</span>
            </div>
            <div aria-hidden="true" className="path-connector"><span /></div>
            <div className="pathway-step pathway-step-human">
              <span aria-hidden="true" className="step-number">03</span>
              <div><strong>{content.human}</strong><small>{content.humanDetail}</small></div>
              <span aria-hidden="true" className="human-mark">✓</span>
            </div>
            <figcaption><span aria-hidden="true" />{content.noAutomatic}</figcaption>
          </figure>
        </section>
      </main>
    </div>
  )
}
