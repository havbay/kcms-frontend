import { useState } from 'react'

import { copy, type Locale } from './copy'

type LandingPageProps = {
  locale: Locale
  setLocale: (locale: Locale) => void
}



function BrandMark() {
  return <span aria-hidden="true" className="brand-mark"><span /><span /></span>
}

function Brand() {
  return (
    <a aria-label="KCMS home" className="brand" href="/">
      <BrandMark />
      <span>KCMS</span>
    </a>
  )
}

export function LandingPage({ locale, setLocale }: LandingPageProps) {
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
          <a className="nav-link" href="#human-control">{content.navHumanControl}</a>
          <a className="nav-link" href="#early-access">{content.accessEyebrow}</a>
          <a className="nav-link nav-link-demo" href="/app">{content.openDemo}</a>
          <button
            aria-pressed={locale === 'km'}
            className="language-toggle"
            onClick={() => {
              setLocale(locale === 'en' ? 'km' : 'en')
              setMenuOpen(false)
            }}
            type="button"
          >
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

          <figure aria-label={content.pathwayLabel} className="comment-pathway">
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

        <section aria-labelledby="workflow-heading" className="workflow-section" id="how-it-works">
          <div className="workflow-intro">
            <p className="eyebrow"><span aria-hidden="true" />{content.workflowEyebrow}</p>
            <h2 id="workflow-heading">{content.workflowHeading}</h2>
            <p>{content.workflowDescription}</p>
          </div>

          <div aria-label={content.workflowHeading} className="workflow-steps">
            {content.workflowSteps.map((step, index) => (
              <article className="workflow-step" key={step.title}>
                <div aria-hidden="true" className="workflow-step-index">{String(index + 1).padStart(2, '0')}</div>
                <div>
                  <p className="workflow-step-meta">{step.meta}</p>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="khmer-heading" className="khmer-section" id="khmer-context">
          <div className="khmer-intro">
            <p className="eyebrow"><span aria-hidden="true" />{content.khmerEyebrow}</p>
            <h2 id="khmer-heading">{content.khmerHeading}</h2>
            <p className="khmer-description">{content.khmerDescription}</p>
            <h3 className="khmer-coverage-label" id="khmer-coverage">{content.khmerCoverageLabel}</h3>
            <ul aria-labelledby="khmer-coverage" className="khmer-coverage">
              {content.khmerCoverage.map((item) => (<li key={item}>{item}</li>))}
            </ul>
          </div>

          <h3 className="khmer-examples-label" id="khmer-examples">{content.khmerExamplesLabel}</h3>
          <ul aria-labelledby="khmer-examples" className="khmer-examples">
            {content.khmerExamples.map((example) => (
              <li className="khmer-example" data-tone={example.tone} key={example.target}>
                <blockquote lang="km">{example.comment}</blockquote>
                <p className="khmer-gloss">{example.gloss}</p>
                <p className="khmer-tags">
                  <span className="khmer-target">{example.target}</span>
                  <span className="khmer-outcome">{example.outcome}</span>
                </p>
                <p className="khmer-note">{example.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="control-heading" className="control-section" id="human-control">
          <div className="control-inner">
            <div className="control-intro">
              <p className="eyebrow"><span aria-hidden="true" />{content.controlEyebrow}</p>
              <h2 id="control-heading">{content.controlHeading}</h2>
              <p className="control-description">{content.controlDescription}</p>
            </div>

            <ul aria-labelledby="control-heading" className="control-guarantees">
              {content.controlGuarantees.map((guarantee) => (
                <li key={guarantee}><span aria-hidden="true" className="control-shield">✓</span>{guarantee}</li>
              ))}
            </ul>

            <p className="control-scope">
              <span aria-hidden="true" />
              <strong>{content.controlScopeLabel}:</strong> {content.controlScope}
            </p>
          </div>
        </section>

        <section aria-labelledby="access-heading" className="access-section" id="early-access">
          <div className="access-intro">
            <p className="eyebrow"><span aria-hidden="true" />{content.accessEyebrow}</p>
            <h2 id="access-heading">{content.accessHeading}</h2>
            <p className="access-description">{content.accessDescription}</p>
          </div>

          <article className="access-card">
            <div aria-hidden="true" className="access-card-rail" />
            <header className="access-card-header">
              <h3>{content.planName}</h3>
              <p className="access-badge">{content.planBadge}</p>
            </header>
            <p className="access-price">{content.planPrice}</p>

            <h4 className="access-features-label" id="access-features">{content.planFeaturesLabel}</h4>
            <ul aria-labelledby="access-features" className="access-features">
              {content.planFeatures.map((feature) => (
                <li key={feature}><span aria-hidden="true" className="access-check">✓</span>{feature}</li>
              ))}
            </ul>

            <a className="button button-block" href="/request-access">{content.planCta}<span aria-hidden="true">↗</span></a>
            <p className="access-note">{content.planNote}</p>
          </article>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand"><BrandMark /><span>KCMS</span></div>
            <p>{content.footerTagline}</p>
          </div>

          <nav aria-label={content.footerNavLabel} className="footer-nav">
            <div className="footer-column">
              <h2>{content.footerProduct}</h2>
              <ul>
                <li><a href="#how-it-works">{content.howItWorks}</a></li>
                <li><a href="#early-access">{content.accessEyebrow}</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h2>{content.footerAccess}</h2>
              <ul>
                <li><a href="/request-access">{content.requestAccess}</a></li>
                <li><a href="/sign-in">{content.signIn}</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h2>{content.footerInformation}</h2>
              <ul>
                <li><a href="/contact">{content.footerContact}</a></li>
                <li><a href="/privacy">{content.footerPrivacy}</a></li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="footer-meta">
          <p className="footer-status"><span aria-hidden="true" /><strong>{content.footerStatusLabel}:</strong> {content.footerStatus}</p>
          <p className="footer-rights">{content.footerRights}</p>
        </div>
      </footer>
    </div>
  )
}
