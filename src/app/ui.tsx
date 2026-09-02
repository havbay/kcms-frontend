import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react'

/* ==========================================================================
   Workspace primitives
   --------------------------------------------------------------------------
   The authenticated screens are assembled from these, not from bespoke markup
   per page. A change here moves Pages & Team, Settings and Profile together,
   which is the only way three screens stay consistent as they grow.
   ========================================================================== */

export type Tone = 'neutral' | 'accent' | 'amber' | 'danger' | 'violet'

/* ---- Icons --------------------------------------------------------------- */

const PATHS = {
  facebook: null, // drawn separately: it is a filled brand mark, not a stroke icon
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'],
  building: ['M3 21h18', 'M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16', 'M15 21V9h2a2 2 0 0 1 2 2v10', 'M9 7h2', 'M9 11h2', 'M9 15h2'],
  settings: ['M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  lock: ['M7 11V7a5 5 0 0 1 10 0v4'],
  clock: ['M12 6v6l4 2'],
  check: ['M20 6 9 17l-5-5'],
  plus: ['M12 5v14', 'M5 12h14'],
  link: ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
  copy: ['M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'],
  alert: ['M12 9v4', 'M12 17h.01', 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'],
  info: ['M12 16v-4', 'M12 8h.01'],
  star: ['M12 2 15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z'],
  arrowRight: ['M5 12h14', 'm12 5 7 7-7 7'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  globe: ['M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
  trash: ['M3 6h18', 'M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6'],
  mail: ['m22 7-10 6L2 7'],
  key: ['m10.5 13.5-7 7', 'm7 17 2 2'],
  page: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M9 13h6', 'M9 17h6'],
  ban: ['m4.9 4.9 14.2 14.2'],
  search: ['m21 21-4.3-4.3'],
} as const

export type IconName = keyof typeof PATHS

/** Circles that some icons need on top of their paths, keyed by name. */
const CIRCLES: Partial<Record<IconName, Array<[number, number, number]>>> = {
  users: [[9, 7, 4]],
  user: [[12, 7, 4]],
  settings: [[12, 12, 3]],
  clock: [[12, 12, 10]],
  info: [[12, 12, 10]],
  globe: [[12, 12, 10]],
  key: [[15.5, 8.5, 5.5]],
  ban: [[12, 12, 10]],
  search: [[11, 11, 8]],
}

/** Rectangles that some icons need, keyed by name. */
const RECTS: Partial<Record<IconName, Array<[number, number, number, number, number]>>> = {
  lock: [[3, 11, 18, 11, 2]],
  copy: [[8, 6, 14, 16, 2]],
  mail: [[2, 4, 20, 16, 2]],
}

export function Icon({ name, className }: { name: IconName; className?: string }) {
  if (name === 'facebook') {
    return (
      <svg aria-hidden="true" className={className} focusable="false" viewBox="0 0 24 24">
        <path
          d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 3.925 23.094 9.101 24v-8.437H6.627v-2.49h2.474V9.9c0-2.457 1.457-3.813 3.678-3.813 1.066 0 2.18.19 2.18.19v2.4h-1.229c-1.21 0-1.587.755-1.587 1.53v1.837h2.7l-.431 2.49h-2.269V24C20.075 23.094 24 18.1 24 12.073z"
          fill="currentColor"
        />
      </svg>
    )
  }
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {(RECTS[name] ?? []).map(([x, y, w, h, r]) => (
        <rect height={h} key={`r${x}${y}`} rx={r} width={w} x={x} y={y} />
      ))}
      {(CIRCLES[name] ?? []).map(([cx, cy, r]) => (
        <circle cx={cx} cy={cy} key={`c${cx}${cy}`} r={r} />
      ))}
      {(PATHS[name] ?? []).map((d) => (
        <path d={d} key={d} />
      ))}
    </svg>
  )
}

/* ---- Page frame ---------------------------------------------------------- */

export function Page({ children }: { children: ReactNode }) {
  return <main className="ws-page">{children}</main>
}

export function PageHead({
  title,
  lead,
  actions,
}: {
  title: string
  lead?: string
  actions?: ReactNode
}) {
  return (
    <header className="ws-page-head">
      <div className="ws-page-head-text">
        <h1 className="ws-page-title">{title}</h1>
        {lead && <p className="ws-page-lead">{lead}</p>}
      </div>
      {actions && <div className="ws-page-head-actions">{actions}</div>}
    </header>
  )
}

/** The two states every data-backed screen shares, so they never diverge. */
export function PageState({ kind, message, action }: { kind: 'loading' | 'error'; message: string; action?: ReactNode }) {
  return (
    <main className="ws-page">
      <div className="ws-state" role={kind === 'error' ? 'alert' : 'status'}>
        {kind === 'loading' ? <span className="ws-spinner" /> : <Icon className="ws-banner-icon" name="alert" />}
        <p style={{ margin: 0 }}>{message}</p>
        {action}
      </div>
    </main>
  )
}

/* ---- Card ---------------------------------------------------------------- */

export function Card({
  title,
  description,
  actions,
  footer,
  tone,
  label,
  children,
}: {
  title?: string
  description?: string
  actions?: ReactNode
  footer?: ReactNode
  tone?: 'accent' | 'danger'
  label?: string
  children?: ReactNode
}) {
  return (
    <section aria-label={label ?? title} className="ws-card" data-tone={tone}>
      {(title || actions) && (
        <div className="ws-card-head">
          <div className="ws-card-head-text">
            {title && <h2 className="ws-card-title">{title}</h2>}
            {description && <p className="ws-card-desc">{description}</p>}
          </div>
          {actions && <div className="ws-card-actions">{actions}</div>}
        </div>
      )}
      {children && <div className="ws-card-body">{children}</div>}
      {footer && <div className="ws-card-foot">{footer}</div>}
    </section>
  )
}

/* ---- Tabs ---------------------------------------------------------------- */

export type TabItem<T extends string> = {
  id: T
  label: string
  icon: IconName
  count?: string | number
}

export function Tabs<T extends string>({
  items,
  active,
  onChange,
  label,
}: {
  items: ReadonlyArray<TabItem<T>>
  active: T
  onChange: (id: T) => void
  label: string
}) {
  return (
    <div aria-label={label} className="ws-tabs" role="tablist">
      {items.map((item) => (
        <button
          aria-selected={active === item.id}
          className={`ws-tab${active === item.id ? ' is-active' : ''}`}
          key={item.id}
          onClick={() => onChange(item.id)}
          role="tab"
          type="button"
        >
          <Icon className="ws-tab-icon" name={item.icon} />
          <span>{item.label}</span>
          {item.count !== undefined && <span className="ws-tab-count">{item.count}</span>}
        </button>
      ))}
    </div>
  )
}

/* ---- Small parts --------------------------------------------------------- */

export function Badge({
  tone = 'neutral',
  dot,
  pulse,
  children,
}: {
  tone?: Tone
  dot?: boolean
  pulse?: boolean
  children: ReactNode
}) {
  return (
    <span className="ws-badge" data-tone={tone}>
      {dot && <span className="ws-badge-dot" data-pulse={pulse ? 'true' : undefined} />}
      {children}
    </span>
  )
}

export function initialsOf(name?: string | null): string {
  if (!name || !name.trim()) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}

export function Avatar({
  name,
  size,
  icon,
}: {
  name?: string | null
  size?: 'sm' | 'lg' | 'xl'
  icon?: IconName
}) {
  return (
    <span
      aria-hidden="true"
      className="ws-avatar"
      data-size={size}
      /* Brand blue is reserved for the provider's own mark; a page or mail
         glyph is ours and takes the workspace colour. */
      data-tone={icon === 'facebook' ? 'brand' : icon ? 'square' : undefined}
    >
      {icon ? <Icon name={icon} /> : initialsOf(name)}
    </span>
  )
}

export function Banner({
  tone = 'neutral',
  icon,
  title,
  children,
  actions,
  role,
}: {
  tone?: 'neutral' | 'accent' | 'amber' | 'danger'
  icon?: IconName
  title?: string
  children?: ReactNode
  actions?: ReactNode
  role?: 'alert' | 'status'
}) {
  const glyph: IconName = icon ?? (tone === 'danger' ? 'alert' : tone === 'amber' ? 'alert' : 'info')
  return (
    <div className="ws-banner" data-tone={tone} role={role}>
      <Icon className="ws-banner-icon" name={glyph} />
      <div className="ws-banner-body">
        {title && <strong className="ws-banner-title">{title}</strong>}
        {children && <p className="ws-banner-text">{children}</p>}
        {actions && <div className="ws-banner-actions">{actions}</div>}
      </div>
    </div>
  )
}

export function Meter({ label, value, max, caption }: { label: string; value: number; max: number; caption?: string }) {
  const safeMax = Math.max(1, max)
  const ratio = Math.min(1, value / safeMax)
  const tone = ratio >= 1 ? 'danger' : ratio >= 0.75 ? 'amber' : undefined
  return (
    <div className="ws-meter">
      <div className="ws-meter-head">
        <span className="ws-meter-label">{label}</span>
        <span className="ws-meter-value">{caption ?? `${value} / ${max}`}</span>
      </div>
      <div
        aria-valuemax={max}
        aria-valuemin={0}
        aria-valuenow={value}
        aria-label={label}
        className="ws-meter-track"
        role="progressbar"
      >
        <span className="ws-meter-fill" data-tone={tone} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="ws-empty">
      <span className="ws-empty-icon">
        <Icon name={icon} />
      </span>
      <p className="ws-empty-title">{title}</p>
      {description && <p className="ws-empty-text">{description}</p>}
      {action}
    </div>
  )
}

export function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="ws-fact">
      <dt>{term}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/* ---- Fields -------------------------------------------------------------- */

type FieldShell = {
  id: string
  label: string
  hint?: string
  error?: string | null
}

/** Errors and hints are wired with aria-describedby so a screen reader hears
 *  the problem at the input, not only in a summary elsewhere on the page. */
export function TextField({ id, label, hint, error, ...input }: FieldShell & InputHTMLAttributes<HTMLInputElement>) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className="ws-field">
      <label className="ws-field-label" htmlFor={id}>{label}</label>
      <input
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        data-invalid={error ? 'true' : undefined}
        id={id}
        {...input}
      />
      {error && <p className="ws-field-error" id={errorId}>{error}</p>}
      {hint && !error && <p className="ws-field-hint" id={hintId}>{hint}</p>}
    </div>
  )
}

export function SelectField({
  id,
  label,
  hint,
  children,
  ...select
}: FieldShell & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div className="ws-field">
      <label className="ws-field-label" htmlFor={id}>{label}</label>
      <select aria-describedby={hintId} id={id} {...select}>
        {children}
      </select>
      {hint && <p className="ws-field-hint" id={hintId}>{hint}</p>}
    </div>
  )
}
