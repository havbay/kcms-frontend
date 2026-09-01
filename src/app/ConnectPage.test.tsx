import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConnectPage } from './ConnectPage'

function renderPage() {
  return render(<ConnectPage locale="en" />, { wrapper: MemoryRouter })
}

describe('Facebook Page connection', () => {
  afterEach(() => vi.restoreAllMocks())

  it('presents Facebook Login as recommended and token entry as advanced', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ state: 'NOT_CONNECTED', can_moderate: false }), {
        status: 200,
      }),
    )

    renderPage()

    expect(await screen.findByRole('button', { name: 'Continue with Facebook' })).toBeVisible()
    expect(screen.getByText('Recommended')).toBeVisible()
    expect(screen.queryByLabelText('Page access token')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Connect with Page token/ }))
    expect(screen.getByLabelText('Page access token')).toHaveAttribute('type', 'password')
  })

  it('explains when Facebook authorization is not configured', async () => {
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
    await user.click(await screen.findByRole('button', { name: 'Continue with Facebook' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'KCMS could not complete the connection. Check the authorization and try again.',
    )
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
    await screen.findByRole('button', { name: 'Continue with Facebook' })
    await user.click(screen.getByRole('button', { name: /Connect with Page token/ }))
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
