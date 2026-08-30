import { useState } from 'react'

import { recordCorrection, type SeverityLabel, type TargetLabel } from '../api/client'
import { copy, type Locale } from './copy'

type CorrectionFormProps = {
  commentId: string
  locale: Locale
  currentSeverity: string | null
  currentTarget: string | null
  onSaved: (severity: string, target: string) => void
}

const SEVERITIES: SeverityLabel[] = ['SAFE', 'OFFENSIVE', 'HARMFUL']
const TARGETS: TargetLabel[] = ['PERSON', 'INSTITUTION', 'NEITHER']

/** Disagreeing with a label is deliberately separate from acting on the
 *  comment. The hint below says so, because a moderator who thinks "correct"
 *  means "hide" would be manufacturing training labels without knowing it. */
export function CorrectionForm({
  commentId, locale, currentSeverity, currentTarget, onSaved,
}: CorrectionFormProps) {
  const content = copy[locale]
  const [open, setOpen] = useState(false)
  const [severity, setSeverity] = useState<SeverityLabel>(
    (currentSeverity as SeverityLabel) ?? 'SAFE',
  )
  const [target, setTarget] = useState<TargetLabel>((currentTarget as TargetLabel) ?? 'NEITHER')
  const [saving, setSaving] = useState(false)

  if (!open) {
    return (
      <button className="button button-small button-quiet" onClick={() => setOpen(true)} type="button">
        {content.modCorrect}
      </button>
    )
  }

  async function save() {
    setSaving(true)
    try {
      await recordCorrection(commentId, severity, target)
      onSaved(severity, target)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="correction" role="group" aria-label={content.modCorrect}>
      <p className="correction-hint">{content.modCorrectHint}</p>

      <label className="correction-field">
        <span>{content.modCorrectSeverity}</span>
        <select onChange={(e) => setSeverity(e.target.value as SeverityLabel)} value={severity}>
          {SEVERITIES.map((value) => (
            <option key={value} value={value}>
              {content.modSeverity[value]}
            </option>
          ))}
        </select>
      </label>

      <label className="correction-field">
        <span>{content.modCorrectTarget}</span>
        <select onChange={(e) => setTarget(e.target.value as TargetLabel)} value={target}>
          {TARGETS.map((value) => (
            <option key={value} value={value}>
              {content.modTarget[value]}
            </option>
          ))}
        </select>
      </label>

      <div className="correction-actions">
        <button className="button button-small" disabled={saving} onClick={() => void save()} type="button">
          {content.modCorrectSave}
        </button>
        <button className="button button-small button-quiet" onClick={() => setOpen(false)} type="button">
          {content.modCorrectCancel}
        </button>
      </div>
    </div>
  )
}
