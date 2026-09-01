import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConnectPage } from './ConnectPage'

function renderPage() {
  return render(<ConnectPage locale="en" />, { wrapper: MemoryRouter })
}

describe('Facebook Page connection', () => {
  afterEach(() => vi.restoreAllMocks())

  it('offers the Page token as the supported route', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ state: 'NOT_CONNECTED', can_moderate: false }), {
        status: 200,
      }),
    )

    renderPage()

    // No toggle to find first: the working method is the one on screen.
    expect(await screen.findByLabelText('Page access token')).toHaveAttribute('type', 'password')
    expect(screen.getByText('Recommended')).toBeVisible()
  })

  it('starts Facebook authorization and hands off to Meta', async () => {
    const user = userEvent.setup()
    const assign = vi.fn()
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      search: '',
      assign,
    } as unknown as Location)
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ state: 'NOT_CONNECTED', can_moderate: false }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ authorization_url: 'https://www.facebook.com/v26.0/dialog/oauth?x=1' }),
          { status: 201 },
        ),
      )

    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Continue with Facebook' }))

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('https://www.facebook.com/v26.0/dialog/oauth?x=1'),
    )
  })

  it('says Facebook Login is unconfigured rather than blaming the operator', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ state: 'NOT_CONNECTED', can_moderate: false }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 503 }))

    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Continue with Facebook' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Facebook connection is not configured yet. Contact KCMS support.',
    )
  })

  it('never presents a second Page connection approval flow', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ state: 'NOT_CONNECTED', can_moderate: false }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 403 }))

    renderPage()
    await user.type(await screen.findByLabelText('Page access token'), 'a-token')
    await user.click(screen.getByRole('button', { name: 'Validate and connect' }))

    expect(await screen.findByRole('alert')).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Request Page connection approval' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Facebook Page name or URL')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request approval' })).not.toBeInTheDocument()
  })

  it('connects a validated Page token without echoing the secret', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ state: 'NOT_CONNECTED', can_moderate: false }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            state: 'CONNECTED',
            method: 'MANUAL_TOKEN',
            page_id: 'page-123',
            page_name: 'KCMS Test Page',
            tasks: ['PROFILE_PLUS_MODERATE'],
            can_moderate: true,
            connected_at: '2026-09-01T08:00:00Z',
            last_synced_at: null,
          }),
          { status: 201 },
        ),
      )

    renderPage()
    await screen.findByLabelText('Page access token')
    await user.type(screen.getByLabelText('Page access token'), 'secret-page-token')
    await user.click(screen.getByRole('button', { name: 'Validate and connect' }))

    expect(await screen.findByText('KCMS Test Page')).toBeVisible()
    expect(screen.getByText('Ready to moderate')).toBeVisible()
    expect(screen.queryByText('secret-page-token')).not.toBeInTheDocument()
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({ page_access_token: 'secret-page-token' }),
    )
  })

  it('shows the current connected Page and its first-sync state', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          state: 'CONNECTED',
          method: 'FACEBOOK_LOGIN',
          page_id: 'page-456',
          page_name: 'Community Page',
          tasks: ['PROFILE_PLUS_MODERATE'],
          can_moderate: true,
          connected_at: '2026-09-01T08:00:00Z',
          last_synced_at: null,
        }),
        { status: 200 },
      ),
    )

    renderPage()

    await waitFor(() => expect(screen.getByText('Community Page')).toBeVisible())
    expect(screen.getAllByText('Connected with Facebook')).toHaveLength(2)
    expect(screen.getByText('Waiting for first synchronization')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Disconnect Page' })).toBeVisible()
  })
})

describe('page token refusals', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('tells the operator a User token was pasted instead of a generic failure', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ state: 'NOT_CONNECTED', can_moderate: false }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            detail:
              'This is a User access token, not a Page access token. In Graph '
              + "API Explorer open the 'User or Page' menu and choose your Page "
              + 'under Page Access Tokens, then copy the token again.',
          }),
          { status: 422 },
        ),
      )

    renderPage()
    await screen.findByLabelText('Page access token')
    await user.type(screen.getByLabelText('Page access token'), 'a-user-token')
    await user.click(screen.getByRole('button', { name: 'Validate and connect' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /This is a User access token, not a Page access token/,
    )
  })

  it('falls back to the generic message when the API explains nothing', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ state: 'NOT_CONNECTED', can_moderate: false }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 500 }))

    renderPage()
    await screen.findByLabelText('Page access token')
    await user.type(screen.getByLabelText('Page access token'), 'a-token')
    await user.click(screen.getByRole('button', { name: 'Validate and connect' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'KCMS could not complete the connection. Check the authorization and try again.',
    )
  })
})

describe('returning from Facebook', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('explains a spent authorization instead of blanking the screen', async () => {
    window.history.replaceState({}, '', '/app/connect?facebook_session=abc123')
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ state: 'NOT_CONNECTED', can_moderate: false }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'authorization session not found' }), {
          status: 404,
        }),
      )

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /That Facebook authorization has expired or was already used/,
    )
    // The page still works: the token form is there to fall back on.
    expect(screen.getByLabelText('Page access token')).toBeVisible()
    // The spent state is cleared, so a refresh does not retry it.
    expect(window.location.search).toBe('')
  })

  it('offers the authorized Pages to choose from', async () => {
    window.history.replaceState({}, '', '/app/connect?facebook_session=abc123')
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ state: 'NOT_CONNECTED', can_moderate: false }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            pages: [
              { page_id: 'p-1', page_name: 'KCMS-Demo', tasks: ['MODERATE'], can_moderate: true },
            ],
          }),
          { status: 200 },
        ),
      )

    renderPage()

    expect(await screen.findByText('KCMS-Demo')).toBeVisible()
    expect(window.location.search).toBe('')
  })
})
