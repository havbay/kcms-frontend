import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ModeratePage } from './ModeratePage'

/** Contract-faithful interception at the network boundary — production
 *  modules are untouched. Shapes mirror the generated OpenAPI types. */
const WORK_LIST = {
  total: 2,
  items: [
    {
      comment_id: 'c-001',
      text: 'សេវាកម្មក្រុមហ៊ុននេះយឺតណាស់ ខកចិត្តខ្លាំង។',
      author_ref: 'user-a',
      posted_at: '2026-08-30T10:00:00Z',
      severity: 'OFFENSIVE', severity_confidence: 0.62,
      target: 'INSTITUTION', target_confidence: 0.82,
      abstain: false, surfaced_reason: 'institution_sample',
      rationale: null, model_version: 'pattern-matching-v0.1',
      latest_action: null, latest_actor: null, latest_action_at: null,
    },
    {
      comment_id: 'c-004',
      text: 'អ្នកនេះល្ងង់ណាស់ កុំឱ្យវានិយាយ។',
      author_ref: 'user-d',
      posted_at: '2026-08-30T10:01:00Z',
      severity: 'HARMFUL', severity_confidence: 0.79,
      target: 'PERSON', target_confidence: 0.8,
      abstain: false, surfaced_reason: 'triage',
      rationale: null, model_version: 'pattern-matching-v0.1',
      latest_action: null, latest_actor: null, latest_action_at: null,
    },
  ],
}

function renderPage() {
  return render(<ModeratePage locale="en" setLocale={() => {}} />, { wrapper: MemoryRouter })
}

describe('moderation work list', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('shows why each comment surfaced, not just a score', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(WORK_LIST), { status: 200 }),
    )
    renderPage()

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2))
    expect(
      screen.getByText(/Aimed at an organization — never hidden automatically/),
    ).toBeVisible()
    expect(screen.getByText(/Possible harm — review first/)).toBeVisible()
  })

  it('keeps institution criticism visually distinct from targeted harm', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(WORK_LIST), { status: 200 }),
    )
    renderPage()

    const rendered = await screen.findAllByRole('listitem')
    const institution = rendered[0]!
    const person = rendered[1]!
    expect(institution).toHaveAttribute('data-reason', 'institution_sample')
    expect(person).toHaveAttribute('data-reason', 'triage')
    expect(within(institution).getByText('Institution')).toBeVisible()
    expect(within(person).getByText('Person')).toBeVisible()
  })

  it('records a moderation action and reflects it back', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(WORK_LIST), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { kind: 'HIDE', actor: 'demo-client', occurred_at: '2026-08-30T10:05:00Z' },
          ]),
          { status: 201 },
        ),
      )
    renderPage()

    const items = await screen.findAllByRole('listitem')
    const person = items[1]!
    await user.click(within(person).getByRole('button', { name: 'Hide' }))

    await waitFor(() => expect(within(person).getByText(/HIDE/)).toBeVisible())
    const actionCall = fetchMock.mock.calls[1]!
    expect(String(actionCall[0])).toContain('/api/v1/comments/c-004/actions')
    expect(actionCall[1]?.method).toBe('POST')
  })

  it('explains an unreachable backend instead of showing an empty list', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network'))
    renderPage()

    await waitFor(() => expect(screen.getByRole('alert')).toBeVisible())
    expect(screen.getByText(/Could not reach KCMS/)).toBeVisible()
    expect(screen.getByText(/Nothing has been changed/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible()
  })
})
