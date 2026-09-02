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


/** Route by URL rather than call order: the page reads the Page connection on
 *  mount as well as the work list, and ordered mocks break whenever a
 *  component makes one more request than a test happened to anticipate. */
function mockApi(routes: {
  workList?: unknown
  connection?: unknown
  action?: { body: unknown; status?: number }
  sync?: { body: unknown; status?: number }
}) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = String(input)
    const json = (body: unknown, status: number) =>
      Promise.resolve(new Response(JSON.stringify(body), { status }))
    if (url.includes('/sync')) {
      return json(routes.sync?.body ?? {}, routes.sync?.status ?? 200)
    }
    if (url.includes('/facebook/connection')) {
      return json(routes.connection ?? { state: 'CONNECTED', can_moderate: true }, 200)
    }
    if (url.includes('/actions') && (init as RequestInit)?.method === 'POST') {
      return json(routes.action?.body ?? [], routes.action?.status ?? 201)
    }
    return json(routes.workList ?? WORK_LIST, 200)
  })
}

function renderPage() {
  return render(<ModeratePage locale="en" />, { wrapper: MemoryRouter })
}

describe('moderation work list', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('shows why each comment surfaced, not just a score', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(WORK_LIST), { status: 200 }),
    )
    renderPage()

    await waitFor(() => expect(screen.getAllByRole('row').slice(1)).toHaveLength(2))
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveAttribute('data-reason', 'institution_sample')
    expect(rows[1]).toHaveAttribute('data-reason', 'triage')

    await user.click(within(rows[0]!).getByRole('button', { name: /សេវាកម្ម/ }))
    expect(screen.getByText(/Aimed at an organization — never hidden automatically/)).toBeVisible()
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
    const fetchMock = mockApi({
      action: {
        body: [{ kind: 'DELETE', actor: 'demo-client', occurred_at: '2026-08-30T10:05:00Z' }],
      },
    })
    renderPage()

    await user.click(await screen.findByRole('button', { name: /អ្នកនេះល្ងង់ណាស់/ }))
    const panel = screen.getByRole('complementary', { name: 'Comment details' })
    await user.click(within(panel).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(within(panel).getByText(/DELETE/)).toBeVisible())
    const actionCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes('/comments/c-004/actions') &&
        (init as RequestInit)?.method === 'POST',
    )
    expect(actionCall).toBeDefined()
  })

  it('shows compact source-post context in rows and full context in the detail panel', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(WORK_LIST), { status: 200 }),
    )
    renderPage()

    await waitFor(() => expect(screen.getAllByRole('row').slice(1)).toHaveLength(2))
    expect(screen.getAllByText(/ស្វែងយល់ពីសេវាថ្មី/).length).toBeGreaterThan(0)
    // Hide is on every row now, so moderating never requires opening detail.
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(WORK_LIST.items.length)

    await user.click(screen.getByRole('button', { name: /អ្នកនេះល្ងង់ណាស់/ }))
    const panel = screen.getByRole('complementary', { name: 'Comment details' })
    expect(within(panel).getByText('Source post')).toBeVisible()
    expect(within(panel).getByText(/តើអ្នកគិតយ៉ាងណា/)).toBeVisible()
    expect(within(panel).getByRole('button', { name: 'Delete' })).toBeVisible()
  })

  it('sends search and review filters to server pagination', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(WORK_LIST), { status: 200 }),
    )
    renderPage()
    await waitFor(() => expect(screen.getAllByRole('row').slice(1)).toHaveLength(2))

    await user.type(screen.getByLabelText('Search comments'), 'scam')
    await user.selectOptions(screen.getByLabelText('Review status'), 'PENDING')
    await user.click(screen.getByRole('button', { name: 'Apply filters' }))

    await waitFor(() => {
      const url = String(fetchMock.mock.calls.at(-1)?.[0])
      expect(url).toContain('query=scam')
      expect(url).toContain('review_status=PENDING')
      expect(url).toContain('limit=')
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
        { ...WORK_LIST.items[0]!, comment_id: 'fb-999', text: 'មតិយោបល់ថ្មីពី Facebook' },
        ...WORK_LIST.items,
      ],
    }
    let synced = false
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input)
      const json = (body: unknown) =>
        Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
      if (url.includes('/sync')) {
        synced = true
        return json({
          fetched: 4, imported: 1, page_id: 'page-real',
          page_name: 'Demo Page', last_synced_at: '2026-09-01T12:00:00Z',
        })
      }
      if (url.includes('/facebook/connections')) {
        return json({
          connections: [{ state: 'CONNECTED', page_id: 'page-real' }],
          page_limit: 3,
          plan: 'STARTER',
        })
      }
      return json(synced ? arrived : WORK_LIST)
    })

    renderPage()
    await waitFor(() => expect(screen.getAllByRole('row').slice(1)).toHaveLength(2))

    await user.click(screen.getByRole('button', { name: 'Sync from Facebook' }))

    expect(await screen.findByText('Imported 1 new comment')).toBeVisible()
    await waitFor(() => expect(screen.getAllByRole('row').slice(1)).toHaveLength(3))
    expect(screen.getByText('មតិយោបល់ថ្មីពី Facebook')).toBeVisible()
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          String(url).includes('/facebook/connections/page-real/sync')
          && (init as RequestInit)?.method === 'POST',
      ),
    ).toBe(true)
  })

  it('says to connect a Page rather than reporting a generic failure', async () => {
    const user = userEvent.setup()
    mockApi({
      connection: { state: 'NOT_CONNECTED' },
      sync: { body: { detail: 'no Facebook Page is connected' }, status: 409 },
    })

    renderPage()
    await waitFor(() => expect(screen.getAllByRole('row').slice(1)).toHaveLength(2))

    await user.click(screen.getByRole('button', { name: 'Sync from Facebook' }))
    expect(await screen.findByText('Connect a Facebook Page first.')).toBeVisible()
  })

  it('warns that actions stay in KCMS while no Page is connected', async () => {
    mockApi({ connection: { state: 'NOT_CONNECTED' } })

    renderPage()

    expect(await screen.findByText('No Facebook Page connected.')).toBeVisible()
    expect(
      screen.getByText(/deleting one is recorded in KCMS and changes nothing on Facebook/),
    ).toBeVisible()
  })

  it('shows an action failure on the row instead of destroying the list', async () => {
    const user = userEvent.setup()
    mockApi({
      action: { body: { detail: 'A Page cannot hide its own comments.' }, status: 502 },
    })

    renderPage()
    const rows = await screen.findAllByRole('row')
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!)

    expect(await screen.findByText('A Page cannot hide its own comments.')).toBeVisible()
    // The queue survives: a refused action is about one comment, not the list.
    expect(screen.getAllByRole('row')).toHaveLength(rows.length)
  })
})


describe('source post link', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('links the source post when Meta gave a permalink', async () => {
    const withLink = {
      ...WORK_LIST,
      total: 1,
      items: [
        {
          ...WORK_LIST.items[0]!,
          post_text: 'This is testing',
          post_permalink: 'https://facebook.com/1350914224763068/posts/122095233513453649',
        },
      ],
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(withLink), { status: 200 }),
    )

    renderPage()

    const link = await screen.findByRole('link', { name: /This is testing/ })
    expect(link).toHaveAttribute(
      'href',
      'https://facebook.com/1350914224763068/posts/122095233513453649',
    )
    expect(link).toHaveAttribute('target', '_blank')
    // Untrusted destination opened in a new tab must not reach window.opener.
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('leaves a seeded post as plain text rather than a dead link', async () => {
    const noLink = {
      ...WORK_LIST,
      total: 1,
      items: [{ ...WORK_LIST.items[0]!, post_permalink: null }],
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(noLink), { status: 200 }),
    )

    renderPage()
    await waitFor(() => expect(screen.getAllByRole('row').slice(1)).toHaveLength(1))
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
