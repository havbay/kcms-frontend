import { useEffect, useState } from 'react'

import { copy, type Locale } from './copy'
import { useSession } from './session'

/* Each locale's `as const` copy is its own literal type, so anything that
   receives the block has to accept either one. */
type V2Copy = (typeof copy)[Locale]['v2']

type LandingPageProps = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

/* Real Khmer comments, not translated for the English page: a Khmer comment
   on a Cambodian Page stays Khmer whichever language the interface is in. */
const SAMPLE_SCAM = 'ចុចតំណនេះទទួលលុយ $500 ថ្ងៃនេះ!'
const SAMPLE_ABUSE = 'អ្នកនេះល្ងង់ណាស់ កុំឱ្យវានិយាយ។'
const SAMPLE_SLOW = 'សេវាកម្មក្រុមហ៊ុននេះយឺតណាស់'

/* Fixed positions, not random: the same page must render identically on every
   load and in tests. */
const SWARM_BAD = new Set([3, 29, 50])
const SWARM_WARN = new Set([10, 24, 41, 62])

function BrandMark() {
  return (
    <span aria-hidden="true" className="brandmark">
      <span />
      <span />
    </span>
  )
}

function Tick({ size = 16, colour = 'var(--teal)' }: { size?: number; colour?: string }) {
  return (
    <svg aria-hidden="true" fill="none" height={size} stroke={colour} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24" width={size}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function Arrow() {
  return (
    <svg aria-hidden="true" className="lp-arrow" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 46 16" width="46">
      <path d="M6 8h32" />
      <path d="m33 3 5 5-5 5" />
    </svg>
  )
}

function Spark({ points, colour }: { points: string; colour: string }) {
  return (
    <svg aria-hidden="true" height="20" preserveAspectRatio="none" viewBox="0 0 90 20" width="100%">
      <polyline fill="none" points={points} stroke={colour} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

const FEATURE_ICONS = [
  null,
  <svg aria-hidden="true" fill="none" height="22" key="shield" stroke="var(--teal-deep)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="22">
    <path d="M12 3l7.5 3v5.5c0 4.2-3 7.6-7.5 9-4.5-1.4-7.5-4.8-7.5-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>,
  <svg aria-hidden="true" fill="none" height="22" key="sort" stroke="var(--teal-deep)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="22">
    <path d="M3 5h18" /><path d="M3 12h12" /><path d="M3 19h7" />
    <circle cx="19" cy="12" r="2" /><circle cx="14" cy="19" r="2" />
  </svg>,
  <svg aria-hidden="true" fill="none" height="22" key="pulse" stroke="var(--teal-deep)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="22">
    <path d="M3 12h4l2.5 7 5-14L17 12h4" />
  </svg>,
  <svg aria-hidden="true" fill="none" height="22" key="bars" stroke="var(--teal-deep)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="22">
    <path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" />
  </svg>,
]

function DashboardShot({ t }: { t: V2Copy }) {
  return (
    <div className="lp-shot">
      <div className="lp-shot-inner" style={{ display: 'flex', height: 520 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 184, flex: 'none', padding: '16px 12px', background: 'var(--mist)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 14px' }}>
            <span aria-hidden="true" className="brandmark" style={{ width: 22, height: 22, padding: 4, borderRadius: 7 }}><span /><span /></span>
            <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.1em' }}>KCMS</span>
          </div>
          {[t.navProduct, t.navHow, t.navFeatures, t.navPricing, t.navAbout].map((label, i) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', height: 32, padding: '0 10px', borderRadius: 8,
              background: i === 0 ? 'var(--teal-wash)' : 'transparent',
              color: i === 0 ? 'var(--teal-deep)' : 'var(--slate)',
              fontSize: 12, fontWeight: i === 0 ? 700 : 400,
            }}>{label}</div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 54, padding: '0 20px', borderBottom: '1px solid var(--hair)' }}>
            <span style={{ display: 'flex', alignItems: 'center', width: 250, height: 31, padding: '0 13px', borderRadius: 999, background: 'var(--mist)', color: 'var(--slate-2)', fontSize: 11.5 }}>
              {t.dashEyebrow}
            </span>
            <span style={{ marginLeft: 'auto', display: 'grid', placeItems: 'center', width: 29, height: 29, borderRadius: '50%', background: 'var(--mist-2)', fontSize: 10.5, fontWeight: 700 }}>SC</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 13, padding: '18px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              {[
                { n: '4,182', c: 'var(--ink)', p: '0,16 15,12 30,14 45,8 60,10 75,4 90,2', s: 'var(--teal)' },
                { n: '12', c: 'var(--warn-i)', p: '0,15 15,11 30,16 45,9 60,11 75,5 90,3', s: 'var(--warn)' },
                { n: '386', c: 'var(--ink)', p: '0,14 15,15 30,10 45,12 60,7 75,8 90,4', s: 'var(--teal)' },
              ].map((k) => (
                <div className="card" key={k.n} style={{ padding: 14, borderRadius: 13, boxShadow: 'var(--sh1)' }}>
                  <p className="num" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.035em', color: k.c }}>{k.n}</p>
                  <div style={{ marginTop: 5 }}><Spark colour={k.s} points={k.p} /></div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: '16px 18px', borderRadius: 13, boxShadow: 'var(--sh1)' }}>
              <svg aria-hidden="true" height="140" viewBox="0 0 560 140" width="100%">
                <defs>
                  <linearGradient id="lpShotFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#00A99D" stopOpacity=".22" />
                    <stop offset="100%" stopColor="#00A99D" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line stroke="#E6E9EE" x1="26" x2="548" y1="114" y2="114" />
                <line stroke="#F1F3F7" x1="26" x2="548" y1="76" y2="76" />
                <line stroke="#F1F3F7" x1="26" x2="548" y1="38" y2="38" />
                <polygon fill="url(#lpShotFill)" points="26,84 91,64 156,70 221,48 286,26 351,34 416,56 481,38 548,20 548,114 26,114" />
                <polyline fill="none" points="26,84 91,64 156,70 221,48 286,26 351,34 416,56 481,38 548,20" stroke="#00A99D" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
                <polyline fill="none" points="26,108 91,105 156,106 221,101 286,97 351,99 416,103 481,98 548,94" stroke="#B96E09" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
                <circle cx="548" cy="20" fill="#00A99D" opacity=".16" r="7" />
                <circle cx="548" cy="20" fill="#00A99D" r="3.6" stroke="#fff" strokeWidth="1.8" />
              </svg>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'var(--bad-w)' }}>
                <span className="km" lang="km" style={{ flex: 1, minWidth: 0, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{SAMPLE_SCAM}</span>
                <span className="chip" style={{ background: '#fff', color: 'var(--bad-i)', height: 21, fontSize: 10 }}>{t.howHarmful}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'var(--warn-w)' }}>
                <span className="km" lang="km" style={{ flex: 1, minWidth: 0, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{SAMPLE_ABUSE}</span>
                <span className="chip" style={{ background: '#fff', color: 'var(--warn-i)', height: 21, fontSize: 10 }}>{t.howOffensive}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandingPage({ locale, setLocale }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const content = copy[locale]
  const t = content.v2
  const session = useSession()
  const signedIn = session.status === 'signed-in'
  const km = locale === 'km'

  // A drawer that cannot be dismissed with Escape traps keyboard users, and a
  // scrolling page behind an open drawer is disorienting on touch.
  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const navLinks = [
    { href: '#solution', label: t.navProduct, current: true },
    { href: '#how', label: t.navHow, current: false },
    { href: '#features', label: t.navFeatures, current: false },
    { href: '#pricing', label: t.navPricing, current: false },
    { href: '#why', label: t.navAbout, current: false },
  ]

  return (
    <div className="v2 lp" lang={km ? 'km' : 'en'}>
      <header className="wrap lp-nav">
        <a aria-label="KCMS home" className="lp-brand" href="/">
          <BrandMark />
          <b>KCMS</b>
        </a>

        <nav aria-label="Primary navigation" className="lp-links">
          {navLinks.map((link) => (
            <a aria-current={link.current || undefined} href={link.href} key={link.href}>{link.label}</a>
          ))}
        </nav>

        <div className="lp-actions">
          <button
            className="lang"
            onClick={() => setLocale(km ? 'en' : 'km')}
            type="button"
          >
            <img alt="" aria-hidden="true" src={t.switchToFlag} />
            <span lang={km ? 'en' : 'km'}>{t.switchTo}</span>
          </button>
          <a className="btn btn-2 btn-sm" href={signedIn ? '/app' : '/sign-in'}>
            {signedIn ? content.openDashboard : t.signIn}
          </a>
          <a className="btn btn-sm" href="/sign-up">{t.tryKcms}</a>
        </div>
      </header>

      {/* 01 — Hero */}
      <section aria-labelledby="lp-hero-heading">
        <span aria-hidden="true" className="lp-glow" />

        <div className="wrap lp-hero">
          <p className="eyebrow">{t.heroEyebrow}</p>
          <h1 id="lp-hero-heading">{t.heroHeading}</h1>
          <p className="lede">{t.heroLede}</p>
          <div className="cta">
            <a className="btn" href="/sign-up">{t.heroPrimary}</a>
            <a className="btn btn-2" href="#how">{t.heroSecondary}</a>
          </div>
        </div>

        <div className="wrap lp-preview">
          <div className="card lp-preview-card">
            <div className="lp-preview-head">
              <span aria-hidden="true" className="dots"><i /><i /><i /></span>
              <b>{t.previewTitle}</b>
              <span className="chip chip-warn">{t.previewCount}</span>
            </div>
            {[
              { text: SAMPLE_SCAM, tone: 'bad', verdict: t.howHarmful, who: 'វ' },
              { text: SAMPLE_ABUSE, tone: 'warn', verdict: t.howOffensive, who: 'រ' },
              { text: SAMPLE_SLOW, tone: 'ok', verdict: t.howSafe, who: 'ស' },
            ].map((row) => (
              <div className="lp-preview-row" data-t={row.tone} key={row.text}>
                <span aria-hidden="true" className="who">{row.who}</span>
                <p lang="km">{row.text}</p>
                <span className={`chip chip-${row.tone}`}>{row.verdict}</span>
              </div>
            ))}
          </div>
        </div>

        <ul className="wrap card lp-facts">
          {t.facts.map((fact) => <li key={fact}>{fact}</li>)}
        </ul>
      </section>

      {/* 02 — Problem */}
      <section aria-labelledby="lp-problem-heading" className="band pad" style={{ marginTop: 96 }}>
        <div className="wrap lp-split">
          <div className="heads">
            <p className="eyebrow">{t.problemEyebrow}</p>
            <h2 id="lp-problem-heading">{t.problemHeading}</h2>
            <p className="lede">{t.problemLede}</p>
          </div>

          <figure aria-label={t.problemSwarmLabel} className="card lp-swarm">
            <span className="lp-label">{t.problemSwarmLabel}</span>
            <div aria-hidden="true" className="lp-swarm-grid">
              {Array.from({ length: 72 }, (_, i) => (
                <i data-t={SWARM_BAD.has(i) ? 'bad' : SWARM_WARN.has(i) ? 'warn' : undefined} key={i} />
              ))}
            </div>
            <figcaption className="lp-swarm-key">
              <span><i />{t.problemKeyPlain}</span>
              <span data-t="warn"><i />{t.problemKeyAbuse}</span>
              <span data-t="bad"><i />{t.problemKeyScam}</span>
              <b>{t.problemAsk}</b>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 03 — Solution */}
      <section aria-labelledby="lp-solution-heading" className="wrap pad" id="solution">
        <div className="heads mid">
          <p className="eyebrow">{t.solutionEyebrow}</p>
          <h2 id="lp-solution-heading">{t.solutionHeading}</h2>
        </div>
        <ol className="lp-flow">
          {t.solutionSteps.map((step, i) => (
            <li key={step.title} style={{ display: 'contents' }}>
              {i > 0 && <Arrow />}
              <div className="card">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 04 — How it works */}
      <section aria-labelledby="lp-how-heading" className="wrap pad" id="how">
        <div className="heads mid">
          <p className="eyebrow">{t.howEyebrow}</p>
          <h2 id="lp-how-heading">{t.howHeading}</h2>
        </div>

        <div className="lp-player" data-paused={paused}>
          <div className="lp-stagewrap">
            <span aria-hidden="true" className="lp-dots"><i /><i /><i /></span>
            <span className="lp-live">{t.howLoop}</span>
            <span aria-hidden="true" className="lp-scan" />

            <div className="lp-subject">
              <div>
                <div className="lp-subject-head">
                  <span className="km">ស</span>
                  <time>{t.howSubjectMeta}</time>
                </div>
                <p lang="km">{SAMPLE_SCAM}</p>
              </div>
            </div>

            <div aria-hidden="true" className="lp-verdicts">
              <div className="row">
                <span className="dchip dchip-ok">{t.howSafe}</span>
                <span className="dchip dchip-warn">{t.howOffensive}</span>
                <span className="dchip dchip-bad">{t.howHarmful}</span>
              </div>
              <span className="dchip dchip-warn v2s">{t.howReviewing}</span>
              <span className="dchip dchip-bad v3s">{t.howHidden}</span>
              <span className="dchip dchip-ok v4s">{t.howRestored}</span>
            </div>

            <button
              aria-label={paused ? t.howPlay : t.howPause}
              className="lp-pause"
              onClick={() => setPaused((was) => !was)}
              type="button"
            >
              {paused ? (
                <svg aria-hidden="true" fill="currentColor" height="15" viewBox="0 0 24 24" width="15"><path d="M7 4.5v15l13-7.5z" /></svg>
              ) : (
                <svg aria-hidden="true" fill="currentColor" height="15" viewBox="0 0 24 24" width="15"><path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" /></svg>
              )}
            </button>
          </div>

          <ol className="lp-chapters">
            <span className="lp-label">{t.howChaptersLabel}</span>
            {t.howChapters.map((chapter, i) => (
              <li className="lp-step" key={chapter} style={{ animationDelay: `${i * 2}s` }}>
                <b style={{ animationDelay: `${i * 2}s` }}>{km ? ['០១', '០២', '០៣', '០៤', '០៥'][i] : `0${i + 1}`}</b>
                <span style={{ animationDelay: `${i * 2}s` }}>{chapter}</span>
              </li>
            ))}
            <p>{t.howNote}</p>
          </ol>

          <div aria-hidden="true" className="lp-progress"><i /></div>
        </div>
      </section>

      {/* 05 — Dashboard */}
      <section aria-labelledby="lp-dash-heading" className="band pad" id="dashboard">
        <div className="wrap heads mid">
          <p className="eyebrow">{t.dashEyebrow}</p>
          <h2 id="lp-dash-heading">{t.dashHeading}</h2>
        </div>
        <div aria-hidden="true" className="wrap"><DashboardShot t={t} /></div>
      </section>

      {/* 06 — Pricing */}
      <section aria-labelledby="lp-price-heading" className="wrap pad" id="pricing">
        <div className="heads mid">
          <p className="eyebrow">{t.priceEyebrow}</p>
          <h2 id="lp-price-heading">{t.priceHeading}</h2>
          <p className="chip chip-warn" style={{ height: 'auto', padding: '7px 14px', whiteSpace: 'normal' }}>{t.priceNotFinal}</p>
        </div>

        <div className="lp-plans">
          {t.plans.map((plan, i) => {
            const featured = i === 1
            return (
              <article className="card lp-plan" data-featured={featured || undefined} key={plan.name}>
                <div className="lp-plan-top">
                  <div>
                    <h3>{plan.name}</h3>
                    <p>{plan.blurb}</p>
                  </div>
                  {featured && <span className="chip" style={{ background: 'var(--teal)', color: '#fff' }}>{t.priceRecommended}</span>}
                </div>
                <div>
                  <p className="lp-price">
                    {plan.price}
                    {i < 2 && <small> {t.priceMonth}</small>}
                  </p>
                  {featured && <p className="lp-soon">{t.priceSoon}</p>}
                </div>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}><Tick />{feature}</li>
                  ))}
                </ul>
                <a className={featured ? 'btn' : 'btn btn-2'} href={i === 2 ? '/request-access' : '/sign-up'}>{plan.cta}</a>
              </article>
            )
          })}
        </div>
      </section>

      {/* 07 — Features */}
      <section aria-labelledby="lp-features-heading" className="wrap pad" id="features">
        <div className="heads mid">
          <p className="eyebrow">{t.featuresEyebrow}</p>
          <h2 id="lp-features-heading">{t.featuresHeading}</h2>
        </div>
        <div className="lp-features">
          {t.features.map((feature, i) => (
            <article className="lp-feature" key={feature.title}>
              <span className="lp-feature-icon">
                {i === 0 ? <img alt="" aria-hidden="true" src="/flags/kh.svg" /> : FEATURE_ICONS[i]}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 08 — Why KCMS */}
      <section aria-labelledby="lp-why-heading" className="band pad" id="why">
        <div className="wrap lp-split">
          <div className="heads">
            <p className="eyebrow">{t.whyEyebrow}</p>
            <h2 id="lp-why-heading">{t.whyHeading}</h2>
            <p className="lede">{t.whyLede}</p>
            <p className="lede">{t.whyLede2}</p>
          </div>
          <ul className="lp-proof">
            {t.whyProof.map((line) => (
              <li key={line}>
                <span className="lp-proof-tick"><Tick colour="var(--teal-deep)" size={18} /></span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 09 — Final CTA */}
      <section aria-labelledby="lp-cta-heading" className="wrap pad">
        <div className="card lp-cta">
          <span aria-hidden="true" className="lp-glow" />
          <h2 id="lp-cta-heading">{t.ctaHeading}</h2>
          <a className="btn" href="/sign-up">{t.ctaButton}</a>
        </div>
      </section>

      <footer className="wrap lp-foot">
        <div className="lp-foot-about">
          {/* The header already offers home; a second link with the same
              accessible name just gives screen-reader users two of everything. */}
          <div className="lp-brand">
            <BrandMark />
            <b>KCMS</b>
          </div>
          <p>{t.footAbout}</p>
        </div>
        <nav aria-label="Footer navigation">
          <div>
            <span className="lp-label">{t.footProduct}</span>
            <a href="#how">{t.navHow}</a>
            <a href="#features">{t.navFeatures}</a>
            <a href="#pricing">{t.navPricing}</a>
          </div>
          <div>
            <span className="lp-label">{t.footCompany}</span>
            <a href="#why">{t.navAbout}</a>
            <a href="/request-access">{t.footContact}</a>
            <a href="/">{t.footLegal}</a>
          </div>
        </nav>
      </footer>
    </div>
  )
}
