import { useState } from 'react'

const copy = {
  en: {
    howItWorks: 'How KCMS works', signIn: 'Sign in', language: 'ភាសាខ្មែរ',
    eyebrow: 'Khmer-first comment moderation',
    heading: 'Moderate Khmer comments with context—not guesswork.',
    description: 'Find harmful comments and scams faster. KCMS helps your team prioritize what needs attention, while humans decide every moderation action.',
    requestAccess: 'Request access', seeHow: 'See how it works',
    pathwayLabel: 'How a comment reaches human review', incoming: 'Facebook Page comment',
    sampleComment: 'គណនីនេះស្នើសុំលេខកូដ សូមប្រយ័ត្ន។', pattern: 'Automatic detection',
    patternDetail: 'Pattern matching · v0.1', review: 'Needs human review',
    reviewDetail: 'Possible scam signal', human: 'Your team decides',
    humanDetail: 'Leave · Hide · Correct label', noAutomatic: 'No automatic moderation actions',
    facebook: 'Facebook comments', languageSupport: 'Khmer + Khmerlish', humanControlled: 'Human controlled',
    workflowEyebrow: 'Three clear handoffs',
    workflowHeading: 'From Facebook comment to human decision.',
    workflowDescription: 'KCMS keeps the first version simple: connect a Page, surface comments that need attention, and let your team decide the action. No Meta developer workflow for client staff.',
    workflowSteps: [
      {
        title: 'Connect the Page',
        body: 'A Client links the Facebook Page once. KCMS keeps connection health visible so the team knows whether comments are still arriving.',
        meta: 'Setup',
      },
      {
        title: 'Prioritize review',
        body: 'Versioned pattern matching flags Khmer, Khmer slang, Khmerlish, scams, and harmful phrases while preserving ordinary complaints.',
        meta: 'Pattern matching v0.1',
      },
      {
        title: 'Decide with context',
        body: 'A trusted Client leaves, hides, unhides, or corrects the label. The action and the label stay separate for later learning.',
        meta: 'Human controlled',
      },
    ],
    navHumanControl: 'Human control',
    khmerEyebrow: 'Built for Khmer',
    khmerHeading: 'Khmer, Khmerlish, and the slang in between.',
    khmerDescription: 'Most moderation tools read Khmer as noise. KCMS matches Khmer script, romanized Khmerlish, everyday slang, misspellings, and deliberately obfuscated words — then separates who the comment is aimed at.',
    khmerCoverageLabel: 'Pattern matching covers',
    khmerCoverage: ['Khmer script', 'Khmerlish and code-switching', 'Everyday slang', 'Misspellings and obfuscated words'],
    khmerExamplesLabel: 'Same frustration, different target',
    khmerExamples: [
      {
        comment: 'សេវាកម្មក្រុមហ៊ុននេះយឺតណាស់ ខកចិត្តខ្លាំង។',
        gloss: '“This company’s service is so slow. Very disappointed.”',
        target: 'Institution',
        outcome: 'Stays visible',
        note: 'Criticism of an organization is protected. KCMS never removes it automatically.',
        tone: 'safe',
      },
      {
        comment: 'អ្នកនេះល្ងង់ណាស់ កុំឱ្យវានិយាយ។',
        gloss: '“This person is so stupid. Don’t let them speak.”',
        target: 'Person',
        outcome: 'Needs review',
        note: 'Person-directed abuse is surfaced so your team can decide what happens.',
        tone: 'review',
      },
    ],
    controlEyebrow: 'Human control',
    controlHeading: 'You decide what KCMS is allowed to do.',
    controlDescription: 'Detection runs automatically on every comment. What happens next is your team’s decision — and some limits stay in place no matter what you switch on.',
    controlGuarantees: [
      'Automatic hiding is off today. Every hide and unhide is performed by a person on your team.',
      'Actions are reversible, and the record shows who did what.',
      'Correcting a model label is separate from hiding a comment.',
      'Criticism aimed at an organization is never hidden automatically — at any confidence, under any setting.',
      'The model is frozen between releases. Your corrections feed the next training round, reviewed offline — never live.',
    ],
    controlScopeLabel: 'Current scope',
    controlScope: 'Facebook Page comments only. Messenger and Instagram are not connected yet.',
    accessEyebrow: 'Early access',
    accessHeading: 'Start a pilot with your Page and your team.',
    accessDescription: 'KCMS is onboarding a small number of Cambodian organizations. We size each pilot around your Page volume, team, and review workload before discussing cost.',
    planName: 'Pilot access',
    planBadge: 'Now onboarding',
    planPrice: 'Pricing discussed with your team',
    planFeaturesLabel: 'What a pilot includes',
    planFeatures: [
      'Facebook Page comment moderation',
      'Khmer and Khmerlish pattern matching',
      'Human review workflow',
      'Team access and roles',
      'Basic performance summary',
      'Setup and connection support',
    ],
    planCta: 'Request pilot access',
    planNote: 'Future pricing may depend on connected Pages, monthly comment volume, and team size.',
    footerNavLabel: 'Footer navigation',
    footerTagline: 'Khmer-first Facebook comment moderation, with humans in control of every action.',
    footerProduct: 'Product',
    footerAccess: 'Access',
    footerInformation: 'Information',
    footerContact: 'Contact',
    footerPrivacy: 'Privacy',
    footerStatusLabel: 'Prototype status',
    footerStatus: 'Versioned pattern matching · Human review required',
    footerRights: '© 2026 KCMS',
  },
  km: {
    howItWorks: 'របៀបដំណើរការ', signIn: 'ចូលប្រើ', language: 'English',
    eyebrow: 'ការគ្រប់គ្រងមតិយោបល់ខ្មែរជាចម្បង',
    heading: 'គ្រប់គ្រងមតិយោបល់ខ្មែរ ដោយយល់ពីបរិបទ មិនមែនការស្មាន។',
    description: 'ស្វែងរកមតិយោបល់បង្កគ្រោះថ្នាក់ និងការបោកប្រាស់បានលឿនជាងមុន។ KCMS ជួយក្រុមរបស់អ្នកកំណត់អាទិភាព ខណៈមនុស្សជាអ្នកសម្រេចចិត្តលើសកម្មភាពគ្រប់យ៉ាង។',
    requestAccess: 'ស្នើសុំប្រើប្រាស់', seeHow: 'មើលរបៀបដំណើរការ',
    pathwayLabel: 'របៀបដែលមតិយោបល់ទៅដល់ការពិនិត្យដោយមនុស្ស', incoming: 'មតិយោបល់លើទំព័រ Facebook',
    sampleComment: 'គណនីនេះស្នើសុំលេខកូដ សូមប្រយ័ត្ន។', pattern: 'ការរកឃើញស្វ័យប្រវត្តិ',
    patternDetail: 'ការផ្គូផ្គងលំនាំ · v0.1', review: 'ត្រូវការមនុស្សពិនិត្យ',
    reviewDetail: 'អាចជាសញ្ញាបោកប្រាស់', human: 'ក្រុមរបស់អ្នកជាអ្នកសម្រេច',
    humanDetail: 'ទុក · លាក់ · កែស្លាក', noAutomatic: 'គ្មានសកម្មភាពគ្រប់គ្រងដោយស្វ័យប្រវត្តិ',
    facebook: 'មតិយោបល់ Facebook', languageSupport: 'ខ្មែរ + Khmerlish', humanControlled: 'គ្រប់គ្រងដោយមនុស្ស',
    workflowEyebrow: 'ជំហានច្បាស់ ៣',
    workflowHeading: 'ពីមតិយោបល់ Facebook ទៅការសម្រេចដោយមនុស្ស។',
    workflowDescription: 'KCMS រក្សាជំនាន់ដំបូងឱ្យសាមញ្ញ៖ ភ្ជាប់ទំព័រ បង្ហាញមតិយោបល់ដែលត្រូវការយកចិត្តទុកដាក់ ហើយឱ្យក្រុមរបស់អ្នកសម្រេចសកម្មភាព។ បុគ្គលិកអតិថិជនមិនចាំបាច់ប្រើ Facebook Developer ដោយផ្ទាល់។',
    workflowSteps: [
      {
        title: 'ភ្ជាប់ទំព័រ',
        body: 'Client ភ្ជាប់ Facebook Page ម្តង។ KCMS បង្ហាញស្ថានភាពភ្ជាប់ ដើម្បីឱ្យក្រុមដឹងថាមតិយោបល់នៅតែចូលមកឬអត់។',
        meta: 'ការរៀបចំ',
      },
      {
        title: 'កំណត់អាទិភាពពិនិត្យ',
        body: 'ការផ្គូផ្គងលំនាំមានកំណែ ជួយចាប់សញ្ញាខ្មែរ ពាក្យស្លែង Khmerlish ការបោកប្រាស់ និងពាក្យបង្កគ្រោះថ្នាក់ ខណៈរក្សាការរិះគន់ធម្មតា។',
        meta: 'Pattern matching v0.1',
      },
      {
        title: 'សម្រេចដោយមានបរិបទ',
        body: 'Client ដែលទុកចិត្តអាចទុក លាក់ បើកលាក់វិញ ឬកែស្លាក។ សកម្មភាព និងស្លាកត្រូវបានរក្សាផ្សេងគ្នាសម្រាប់ការរៀនពេលក្រោយ។',
        meta: 'គ្រប់គ្រងដោយមនុស្ស',
      },
    ],
    navHumanControl: 'ការគ្រប់គ្រងដោយមនុស្ស',
    khmerEyebrow: 'សាងសម្រាប់ភាសាខ្មែរ',
    khmerHeading: 'ខ្មែរ Khmerlish និងពាក្យស្លែងនៅចន្លោះ។',
    khmerDescription: 'ឧបករណ៍គ្រប់គ្រងភាគច្រើនអានភាសាខ្មែរជាសំឡេងរំខាន។ KCMS ផ្គូផ្គងអក្សរខ្មែរ Khmerlish ពាក្យស្លែងប្រចាំថ្ងៃ ពាក្យសរសេរខុស និងពាក្យបំបាំង រួចបែងចែកថាមតិយោបល់នោះសំដៅលើនរណា។',
    khmerCoverageLabel: 'ការផ្គូផ្គងលំនាំគ្របដណ្តប់',
    khmerCoverage: ['អក្សរខ្មែរ', 'Khmerlish និងការលាយភាសា', 'ពាក្យស្លែងប្រចាំថ្ងៃ', 'ពាក្យសរសេរខុស និងពាក្យបំបាំង'],
    khmerExamplesLabel: 'ការខកចិត្តដូចគ្នា គោលដៅខុសគ្នា',
    khmerExamples: [
      {
        comment: 'សេវាកម្មក្រុមហ៊ុននេះយឺតណាស់ ខកចិត្តខ្លាំង។',
        gloss: '“សេវាកម្មរបស់ក្រុមហ៊ុននេះយឺតណាស់។ ខកចិត្តខ្លាំង។”',
        target: 'អង្គភាព',
        outcome: 'នៅតែបង្ហាញ',
        note: 'ការរិះគន់អង្គភាពត្រូវបានការពារ។ KCMS មិនលុបវាដោយស្វ័យប្រវត្តិឡើយ។',
        tone: 'safe',
      },
      {
        comment: 'អ្នកនេះល្ងង់ណាស់ កុំឱ្យវានិយាយ។',
        gloss: '“អ្នកនេះល្ងង់ណាស់។ កុំឱ្យគាត់និយាយ។”',
        target: 'បុគ្គល',
        outcome: 'ត្រូវការពិនិត្យ',
        note: 'ការវាយប្រហារសំដៅលើបុគ្គល ត្រូវបានបង្ហាញដល់ក្រុមរបស់អ្នកដើម្បីសម្រេច។',
        tone: 'review',
      },
    ],
    controlEyebrow: 'ការគ្រប់គ្រងដោយមនុស្ស',
    controlHeading: 'អ្នកជាអ្នកសម្រេចថា KCMS អាចធ្វើអ្វីបាន។',
    controlDescription: 'ការរកឃើញដំណើរការស្វ័យប្រវត្តិលើមតិយោបល់គ្រប់មួយ។ អ្វីដែលកើតឡើងបន្ទាប់ គឺជាការសម្រេចរបស់ក្រុមអ្នក ហើយដែនកំណត់មួយចំនួននៅតែមាន ទោះបីអ្នកបើកមុខងារណាក៏ដោយ។',
    controlGuarantees: [
      'ការលាក់ស្វ័យប្រវត្តិត្រូវបានបិទនៅពេលនេះ។ រាល់ការលាក់ និងការបើកលាក់វិញ ធ្វើឡើងដោយមនុស្សក្នុងក្រុមរបស់អ្នក។',
      'សកម្មភាពអាចត្រឡប់វិញបាន ហើយកំណត់ត្រាបង្ហាញថានរណាធ្វើអ្វី។',
      'ការកែស្លាកគំរូ ដាច់ដោយឡែកពីការលាក់មតិយោបល់។',
      'ការរិះគន់ដែលសំដៅលើអង្គភាព មិនត្រូវបានលាក់ដោយស្វ័យប្រវត្តិឡើយ ទោះកម្រិតជឿជាក់ណា ឬការកំណត់បែបណាក៏ដោយ។',
      'គំរូត្រូវបានបង្កកចន្លោះការចេញផ្សាយនីមួយៗ។ ការកែតម្រូវរបស់អ្នកចូលទៅក្នុងវគ្គហ្វឹកហាត់បន្ទាប់ ដែលពិនិត្យក្រៅប្រព័ន្ធ មិនមែនផ្ទាល់ឡើយ។',
    ],
    controlScopeLabel: 'វិសាលភាពបច្ចុប្បន្ន',
    controlScope: 'មតិយោបល់លើទំព័រ Facebook តែប៉ុណ្ណោះ។ Messenger និង Instagram មិនទាន់ភ្ជាប់នៅឡើយទេ។',
    accessEyebrow: 'ការចូលប្រើដំបូង',
    accessHeading: 'ចាប់ផ្តើមសាកល្បងជាមួយទំព័រ និងក្រុមរបស់អ្នក។',
    accessDescription: 'KCMS កំពុងទទួលអង្គភាពកម្ពុជាមួយចំនួនតូច។ យើងកំណត់ទំហំនៃការសាកល្បងតាមបរិមាណមតិយោបល់ ក្រុមការងារ និងបន្ទុកពិនិត្យរបស់អ្នក មុននឹងពិភាក្សាអំពីតម្លៃ។',
    planName: 'ការចូលប្រើសាកល្បង',
    planBadge: 'កំពុងទទួល',
    planPrice: 'តម្លៃពិភាក្សាជាមួយក្រុមរបស់អ្នក',
    planFeaturesLabel: 'អ្វីដែលមានក្នុងការសាកល្បង',
    planFeatures: [
      'ការគ្រប់គ្រងមតិយោបល់លើទំព័រ Facebook',
      'ការផ្គូផ្គងលំនាំខ្មែរ និង Khmerlish',
      'ដំណើរការពិនិត្យដោយមនុស្ស',
      'ការចូលប្រើ និងតួនាទីសម្រាប់ក្រុម',
      'សេចក្តីសង្ខេបការអនុវត្តជាមូលដ្ឋាន',
      'ជំនួយក្នុងការរៀបចំ និងការភ្ជាប់',
    ],
    planCta: 'ស្នើសុំការចូលប្រើសាកល្បង',
    planNote: 'តម្លៃនាពេលអនាគតអាចអាស្រ័យលើចំនួនទំព័រដែលបានភ្ជាប់ បរិមាណមតិយោបល់ប្រចាំខែ និងទំហំក្រុម។',
    footerNavLabel: 'ការរុករកផ្នែកខាងក្រោម',
    footerTagline: 'ការគ្រប់គ្រងមតិយោបល់ Facebook ជាភាសាខ្មែរ ដោយមនុស្សគ្រប់គ្រងគ្រប់សកម្មភាព។',
    footerProduct: 'ផលិតផល',
    footerAccess: 'ការចូលប្រើ',
    footerInformation: 'ព័ត៌មាន',
    footerContact: 'ទំនាក់ទំនង',
    footerPrivacy: 'ឯកជនភាព',
    footerStatusLabel: 'ស្ថានភាព Prototype',
    footerStatus: 'ការផ្គូផ្គងលំនាំមានកំណែ · ត្រូវការការពិនិត្យដោយមនុស្ស',
    footerRights: '© 2026 KCMS',
  },
} as const

type Locale = keyof typeof copy

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
          <a className="nav-link" href="#human-control">{content.navHumanControl}</a>
          <a className="nav-link" href="#early-access">{content.accessEyebrow}</a>
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
