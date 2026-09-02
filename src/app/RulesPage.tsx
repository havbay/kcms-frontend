import { useCallback, useEffect, useState } from 'react'

import {
  addKeyword, ApiError, getKeywords, removeKeyword,
  type KeywordEntry, type KeywordSeverity,
} from '../api/client'
import { copy, type Locale } from './copy'
import {
  Badge, Banner, Card, EmptyState, Icon, Page, PageHead, PageState, SelectField, TextField,
} from './ui'

type RulesPageProps = { locale: Locale }

// Two outcomes, so two severities. HARMFUL is deleted from the Page without
// asking; OFFENSIVE goes to a reviewer. Nothing here can mark a comment safe:
// a keyword surfaces a comment, it never clears one.
const SEVERITIES: KeywordSeverity[] = ['HARMFUL', 'OFFENSIVE']

export function RulesPage({ locale }: RulesPageProps) {
  const content = copy[locale]
  const [keywords, setKeywords] = useState<KeywordEntry[]>([])
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const [newSeverity, setNewSeverity] = useState<KeywordSeverity>('OFFENSIVE')
  const [saving, setSaving] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(async () => {
    try {
      const found = await getKeywords()
      setKeywords(Array.isArray(found) ? found : [])
      setFailed(false)
    } catch {
      setFailed(true)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  if (!loaded) {
    return <PageState kind="loading" message={content.modLoading} />
  }
  if (failed) {
    return (
      <PageState
        action={
          <button className="ws-btn" onClick={() => { setLoaded(false); void load() }} type="button">
            {content.modRetry}
          </button>
        }
        kind="error"
        message={content.modErrorTitle}
      />
    )
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!newKeyword.trim()) return
    setSaving(true)
    setProblem(null)
    try {
      const added = await addKeyword(newKeyword.trim(), newSeverity)
      setKeywords((current) => [added, ...current])
      setNewKeyword('')
    } catch (caught) {
      setProblem(
        caught instanceof ApiError && caught.status === 409
          ? content.setRulesDuplicate
          : content.setRulesFailed,
      )
    } finally {
      setSaving(false)
    }
  }

  async function drop(keyword: string) {
    setProblem(null)
    try {
      await removeKeyword(keyword)
      setKeywords((current) => current.filter((row) => row.keyword !== keyword))
    } catch {
      setProblem(content.setRulesFailed)
    }
  }

  return (
    <Page>
      <PageHead
        actions={<Badge tone="neutral">{content.setRulesCount(keywords.length)}</Badge>}
        lead={content.setRulesLead}
        title={content.setRules}
      />

      {problem && <Banner role="alert" tone="danger">{problem}</Banner>}

      {/* What each severity actually does, stated where the choice is made:
          one of them deletes without asking anyone. */}
      <div className="ws-grid-2">
        <Banner icon="alert" tone="danger" title={content.modSeverity.HARMFUL}>
          {content.setRulesHarmfulHint}
        </Banner>
        <Banner icon="info" tone="amber" title={content.modSeverity.OFFENSIVE}>
          {content.setRulesOffensiveHint}
        </Banner>
      </div>

      <Card description={content.setRulesAddLead} title={content.setRulesAddTitle} tone="accent">
        <form className="ws-form" noValidate onSubmit={submit}>
          <div className="ws-form-row">
            <TextField
              autoComplete="off"
              hint={content.setRulesKeywordHint}
              id="new-keyword"
              label={content.setRulesKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              value={newKeyword}
            />
            <SelectField
              id="new-severity"
              label={content.setRulesSeverity}
              onChange={(e) => setNewSeverity(e.target.value as KeywordSeverity)}
              value={newSeverity}
            >
              {SEVERITIES.map((level) => (
                <option key={level} value={level}>{content.modSeverity[level]}</option>
              ))}
            </SelectField>
            <button className="ws-btn" disabled={saving || !newKeyword.trim()} type="submit">
              <Icon className="ws-btn-icon" name="plus" />
              <span>{saving ? content.setRulesSaving : content.setRulesAdd}</span>
            </button>
          </div>
        </form>
      </Card>

      <Card
        actions={
          keywords.length > 0 ? (
            <button
              className="ws-btn"
              data-size="sm"
              data-variant="secondary"
              onClick={() => setShowAll((open) => !open)}
              type="button"
            >
              <span>{showAll ? content.setRulesHideAll : content.setRulesSeeAll}</span>
              <Icon className="ws-btn-icon" name={showAll ? 'check' : 'arrowRight'} />
            </button>
          ) : undefined
        }
        description={content.setRulesListLead}
        title={content.setRulesListTitle}
      >
        {keywords.length === 0 ? (
          <EmptyState
            description={content.setRulesEmpty}
            icon="ban"
            title={content.setRulesEmptyTitle}
          />
        ) : showAll ? (
          <ul className="ws-rows">
            {keywords.map((row) => (
              <li className="ws-row" key={row.keyword}>
                <div className="ws-row-main">
                  <span aria-hidden="true" className="ws-word-mark" data-tone={row.severity}>
                    <Icon name="ban" />
                  </span>
                  <div className="ws-row-text">
                    <p className="ws-row-title">{row.keyword}</p>
                    {row.note && <p className="ws-row-sub">{row.note}</p>}
                  </div>
                </div>
                <div className="ws-row-meta">
                  <Badge tone={row.severity === 'HARMFUL' ? 'danger' : 'amber'}>
                    {content.modSeverity[row.severity]}
                  </Badge>
                  <button
                    className="ws-link-btn"
                    data-tone="danger"
                    onClick={() => void drop(row.keyword)}
                    type="button"
                  >
                    {content.setRulesRemove}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="ws-chips">
            {keywords.slice(0, 16).map((row) => (
              <Badge key={row.keyword} tone={row.severity === 'HARMFUL' ? 'danger' : 'amber'}>
                {row.keyword}
              </Badge>
            ))}
            {keywords.length > 16 && (
              <span className="ws-card-note">{content.setRulesMore(keywords.length - 16)}</span>
            )}
          </div>
        )}
      </Card>
    </Page>
  )
}
