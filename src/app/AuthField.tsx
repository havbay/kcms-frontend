import type { InputHTMLAttributes } from 'react'

type AuthFieldProps = {
  id: string
  label: string
  hint?: string
  error?: string | null
} & InputHTMLAttributes<HTMLInputElement>

/** Each invalid field owns its error, linked with aria-describedby, so screen
 *  reader users hear what is wrong when they reach the input — not only from a
 *  summary at the top of the form. */
export function AuthField({ id, label, hint, error, ...input }: AuthFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        data-invalid={error ? 'true' : undefined}
        id={id}
        {...input}
      />
      {error && <p className="auth-field-error" id={errorId}>{error}</p>}
      {hint && !error && <p className="auth-field-hint" id={hintId}>{hint}</p>}
    </div>
  )
}
