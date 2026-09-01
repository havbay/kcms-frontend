import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ModeratePage } from './ModeratePage'

/** Contract-faithful interception at the network boundary — production
 *  modules are untouched. Shapes mirror the generated OpenAPI types. */
const WORK_LIST = {
  total: 2,
  limit: 10,
  offset: 0,
  items: [
    {
      comment_id: 'c-001',
      text: 'សេវាកម្មក្រុមហ៊ុននេះយឺតណាស់ ខកចិត្តខ្លាំង។',
      author_ref: 'user-a',
      page_id: 'page-demo',
      post_text: 'ស្វែងយល់ពីសេវាថ្មីរបស់យើងក្នុងវីដេអូនេះ។',
      parent_text: null, is_reply: false, post_kind: 'VIDEO', post_permalink: null,
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
      page_id: 'page-demo',
      post_text: 'ស្វែងយល់ពីសេវាថ្មីរបស់យើងក្នុងវីដេអូនេះ។',
      parent_text: 'តើអ្នកគិតយ៉ាងណាចំពោះសេវានេះ?', is_reply: true,
      post_kind: 'VIDEO', post_permalink: null,
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
  return render(<ModeratePage locale="en" />, { wrapper: MemoryRouter })
}

describe('moderation work list', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('shows why each comment surfaced, not just a score', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(WORK_LIST), { status: 200 }),
    )
    renderPage()

    await waitFor(() => expect(screen.getAllByRole('row').slice(1)).toHaveLength(2))
    expect(
      screen.getAllByText(/Aimed at an organization — never hidden automatically/).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText(/Possible harm — review first/).length).toBeGreaterThan(0)
  })

  it('keeps institution criticism visually distinct from targeted harm', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(WORK_LIST), { status: 200 }),
    )
    renderPage()

    const rendered = (await screen.findAllByRole('row')).slice(1)
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

    await user.click(await screen.findByRole('button', { name: /អ្នកនេះល្ងង់ណាស់/ }))
    const panel = screen.getByRole('complementary', { name: 'Comment details' })
    await user.click(within(panel).getByRole('button', { name: 'Hide' }))

    await waitFor(() => expect(within(panel).getByText(/HIDE/)).toBeVisible())
    const actionCall = fetchMock.mock.calls[1]!
    expect(String(actionCall[0])).toContain('/api/v1/comments/c-004/actions')
    expect(actionCall[1]?.method).toBe('POST')
  })

  it('shows compact source-post context in rows and full context in the detail panel', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(WORK_LIST), { status: 200 }),
    )
    renderPage()

    expect((await screen.findAllByText('Video')).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/ស្វែងយល់ពីសេវាថ្មី/).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Hide' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /អ្នកនេះល្ងង់ណាស់/ }))
    const panel = screen.getByRole('complementary', { name: 'Comment details' })
    expect(within(panel).getByText('Source post')).toBeVisible()
    expect(within(panel).getByText(/តើអ្នកគិតយ៉ាងណា/)).toBeVisible()
    expect(within(panel).getByRole('button', { name: 'Hide' })).toBeVisible()
  })

  it('sends search and review filters to server pagination', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(WORK_LIST), { status: 200 }),
    )
    renderPage()
    await screen.findAllByText('Video')

    await user.type(screen.getByLabelText('Search comments'), 'scam')
    await user.selectOptions(screen.getByLabelText('Review status'), 'PENDING')
    await user.click(screen.getByRole('button', { name: 'Apply filters' }))

    await waitFor(() => {
      const url = String(fetchMock.mock.calls.at(-1)?.[0])
      expect(url).toContain('query=scam')
      expect(url).toContain('review_status=PENDING')
      expect(url).toContain('limit=10')
    })
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

describe('syncing from the connected Page', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('imports new comments and reloads the list so they appear', async () => {
    const user = userEvent.setup()
    const arrived = {
      ...WORK_LIST,
      total: 3,
      items: [
        {
          ...WORK_LIST.items[0]!,
          comment_id: 'fb-999',
          text: 'មតិយោបល់ថ្មីពី Facebook',
        },
        ...WORK_LIST.items,
      ],
    }
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(WORK_LIST), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            fetched: 4, imported: 1, page_id: 'page-real',
            page_name: 'Demo Page', last_synced_at: '2026-09-01T12:00:00Z',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValue(new Response(JSON.stringify(arrived), { status: 200 }))

    renderPage()
    await waitFor(() => expect(screen.getAllByRole('row').slice(1)).toHaveLength(2))

    await user.click(screen.getByRole('button', { name: 'Sync from Facebook' }))

    expect(await screen.findByText('Imported 1 new comment')).toBeVisible()
    await waitFor(() => expect(screen.getAllByRole('row').slice(1)).toHaveLength(3))
    expect(screen.getByText('មតិយោបល់ថ្មីពី Facebook')).toBeVisible()

    const synced = fetchMock.mock.calls.find(([url]) => String(url).includes('/facebook/sync'))
    expect(synced).toBeDefined()
    expect((synced?.[1] as RequestInit).method).toBe('POST')
  })

  it('says to connect a Page rather than reporting a generic failure', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(WORK_LIST), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'no Facebook Page is connected' }), { status: 409 }),
      )

    renderPage()
    await waitFor(() => expect(screen.getAllByRole('row').slice(1)).toHaveLength(2))

    await user.click(screen.getByRole('button', { name: 'Sync from Facebook' }))
    expect(await screen.findByText('Connect a Facebook Page first.')).toBeVisible()
  })
})
