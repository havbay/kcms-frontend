import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConnectPage } from './ConnectPage'

/** The merged screen loads Pages and the team together, so ordering mocks by
 *  call number is brittle. Route them by URL and let the page ask in any
 *  order; `then` supplies the response for the action the test is about. */
function routeFetch(options: {
  connections?: unknown
  team?: unknown
  session?: () => Response | Promise<Response>
  selection?: () => Response | Promise<Response>
  then?: () => Response | Promise<Response>
}) {
  const team = options.team ?? { your_role: 'owner', members: [], invitations: [] }
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    if (url.includes('/team')) return new Response(JSON.stringify(team), { status: 200 })
    if (url.includes('/facebook/connections')) {
      return new Response(
        JSON.stringify(options.connections ?? { state: 'NOT_CONNECTED', can_moderate: false }),
        { status: 200 },
      )
    }
    if (options.selection && url.includes('/selection')) return options.selection()
    if (options.session && url.includes('/oauth/sessions/')) return options.session()
    if (options.then) return options.then()
    return new Response(JSON.stringify({}), { status: 200 })
  })
}

function renderPage() {
  return render(<ConnectPage locale="en" />, { wrapper: MemoryRouter })
}

describe('Facebook Page connection', () => {
  afterEach(() => vi.restoreAllMocks())

  it('offers Add Page as the only connection route', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ state: 'NOT_CONNECTED', can_moderate: false }), {
        status: 200,
      }),
    )

    renderPage()

    expect(await screen.findByRole('button', { name: 'Add Page' })).toBeVisible()
    // The provider's branding belongs on the sign-in screen, not in here.
    expect(screen.queryByRole('button', { name: 'Continue with Facebook' })).toBeNull()
  })

  it('starts Facebook authorization and hands off to Meta', async () => {
    const user = userEvent.setup()
    const assign = vi.fn()
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      search: '',
      assign,
    } as unknown as Location)
    routeFetch({
      then: () =>
        new Response(
          JSON.stringify({ authorization_url: 'https://www.facebook.com/v26.0/dialog/oauth?x=1' }),
          { status: 201 },
        ),
    })

    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Add Page' }))

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('https://www.facebook.com/v26.0/dialog/oauth?x=1'),
    )
  })

  it('says Facebook Login is unconfigured rather than blaming the operator', async () => {
    const user = userEvent.setup()
    routeFetch({ then: () => new Response(null, { status: 503 }) })

    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Add Page' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Facebook connection is not configured yet. Contact KCMS support.',
    )
  })

  it('shows the current connected Page and its first-sync state', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          connections: [
            {
              state: 'CONNECTED',
              method: 'FACEBOOK_LOGIN',
              page_id: 'page-456',
              page_name: 'Community Page',
              tasks: ['PROFILE_PLUS_MODERATE'],
              can_moderate: true,
              connected_at: '2026-09-01T08:00:00Z',
              last_synced_at: null,
            },
          ],
          page_limit: 3,
          plan: 'STARTER',
        }),
        { status: 200 },
      ),
    )

    renderPage()

    await waitFor(() => expect(screen.getAllByText('Community Page').length).toBeGreaterThan(0))
    expect(screen.getByText('Ready to moderate')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Disconnect Page' })).toBeVisible()
  })
})

describe('returning from Facebook', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('explains a spent authorization instead of blanking the screen', async () => {
    window.history.replaceState({}, '', '/app/connect?facebook_session=abc123')
    routeFetch({
      session: () =>
        new Response(JSON.stringify({ detail: 'authorization session not found' }), {
          status: 404,
        }),
    })

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /That Facebook authorization has expired or was already used/,
    )
    expect(window.location.search).toBe('')
  })

  it('offers the authorized Pages to choose from', async () => {
    window.history.replaceState({}, '', '/app/connect?facebook_session=abc123')
    routeFetch({
      session: () =>
        new Response(
          JSON.stringify({
            pages: [
              { page_id: 'p-1', page_name: 'KCMS-Demo', tasks: ['MODERATE'], can_moderate: true },
            ],
          }),
          { status: 200 },
        ),
    })

    renderPage()

    expect(await screen.findByText('KCMS-Demo')).toBeVisible()
    expect(window.location.search).toBe('?facebook_session=abc123')
  })

  it('says why the Page could not be connected instead of failing silently', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', '/app/connect?facebook_session=abc123')
    routeFetch({
      session: () =>
        new Response(
          JSON.stringify({
            pages: [
              { page_id: 'p-1', page_name: 'KCMS-Demo', tasks: ['MODERATE'], can_moderate: true },
            ],
          }),
          { status: 200 },
        ),
      selection: () =>
        new Response(
          JSON.stringify({
            detail: 'This Facebook Page is already connected to another KCMS workspace.',
          }),
          { status: 409 },
        ),
    })

    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Connect selected Page' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /already connected to another KCMS workspace/,
    )
  })
})

describe('a refused authorization', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('reports the reason Meta gave rather than showing the plain connect screen', async () => {
    window.history.replaceState({}, '', '/app/connect?facebook_error=exchange_failed')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ state: 'NOT_CONNECTED', can_moderate: false }), {
        status: 200,
      }),
    )

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Facebook rejected the authorization/,
    )
    expect(window.location.search).toBe('')
  })

  it('treats a cancelled authorization as ordinary, not as a fault', async () => {
    window.history.replaceState({}, '', '/app/connect?facebook_error=denied')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ state: 'NOT_CONNECTED', can_moderate: false }), {
        status: 200,
      }),
    )

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(/was cancelled/)
    expect(screen.getByRole('button', { name: 'Add Page' })).toBeEnabled()
  })

  it('names the account problem when Facebook returns no Pages', async () => {
    window.history.replaceState({}, '', '/app/connect?facebook_error=no_pages')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ state: 'NOT_CONNECTED', can_moderate: false }), {
        status: 200,
      }),
    )

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /does not administer any Page/,
    )
  })
})

describe('Workspace Team Management in unified view', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('switches to the team tab and displays team members', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ connections: [], page_limit: 3, plan: 'STARTER' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            your_role: 'owner',
            members: [
              {
                user_id: 'u-1',
                display_name: 'Admin User',
                email: 'admin@kcms.local',
                role: 'owner',
              },
            ],
            invitations: [],
          }),
          { status: 200 },
        ),
      )

    renderPage()

    expect(await screen.findByText('Admin User')).toBeVisible()
    expect(screen.getByText('admin@kcms.local')).toBeVisible()
    expect(screen.getByText('Invite a Team Member')).toBeVisible()
  })
})

describe('leaving a workspace', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  function teamApi(overrides: { leaveStatus?: number; leaveBody?: unknown } = {}) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const url = String(input)
      const json = (body: unknown, status = 200) =>
        Promise.resolve(new Response(JSON.stringify(body), { status }))
      if (url.includes('/team/membership') && (init as RequestInit)?.method === 'DELETE') {
        return Promise.resolve(
          new Response(
            overrides.leaveBody ? JSON.stringify(overrides.leaveBody) : null,
            { status: overrides.leaveStatus ?? 204 },
          ),
        )
      }
      if (url.includes('/team')) {
        return json({
          workspace_name: 'CADT',
          your_role: 'member',
          members: [{ user_id: 'u1', display_name: 'Nara', role: 'member', joined_at: null }],
        })
      }
      return json({ state: 'NOT_CONNECTED', can_moderate: false })
    })
  }

  it('asks before leaving, since only an owner can add you back', async () => {
    const user = userEvent.setup()
    const fetchMock = teamApi()

    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Leave this workspace' }))

    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          String(url).includes('/team/membership') &&
          (init as RequestInit)?.method === 'DELETE',
      ),
    ).toBe(false)
    expect(screen.getByText(/only an owner can add you back/)).toBeVisible()
  })

  it('explains when the last owner cannot leave', async () => {
    const user = userEvent.setup()
    teamApi({
      leaveStatus: 409,
      leaveBody: { detail: 'you are the last owner of this workspace; promote someone else before leaving' },
    })

    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Leave this workspace' }))
    await user.click(screen.getByRole('button', { name: 'Leave workspace' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/last owner of this workspace/)
  })
})
