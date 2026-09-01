import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsPage } from './SettingsPage'
import { SessionProvider } from './session'

const OWNER = {
  workspace_id: 'ws-1',
  workspace_name: 'Angkor Shop',
  display_name: 'Dara Sok',
  your_role: 'owner',
  is_sandbox: true,
  sample_comments: 12,
}

function renderPage() {
  return render(
    <SessionProvider>
      <SettingsPage locale="en" />
    </SessionProvider>,
    { wrapper: MemoryRouter },
  )
}

describe('removing the sample comments', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('asks for confirmation before emptying the workspace', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(OWNER), { status: 200 }))

    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Remove sample comments' }))

    // Nothing is deleted on the first click — the destructive call happens
    // only after the confirmation.
    expect(
      fetchMock.mock.calls.some(([, init]) => (init as RequestInit)?.method === 'DELETE'),
    ).toBe(false)
    expect(screen.getByText(/Remove the sample comments permanently\?/)).toBeVisible()
  })

  it('removes them on confirmation and reports how many went', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(OWNER), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ removed: 12 }), { status: 200 }))

    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Remove sample comments' }))
    await user.click(screen.getByRole('button', { name: 'Remove them' }))

    expect(await screen.findByText('Removed 12 sample comments.')).toBeVisible()
    const deleted = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes('/comments/samples') && (init as RequestInit)?.method === 'DELETE',
    )
    expect(deleted).toBeDefined()
  })

  it('keeps them when the owner backs out', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(OWNER), { status: 200 }))

    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Remove sample comments' }))
    await user.click(screen.getByRole('button', { name: 'Keep them' }))

    expect(
      fetchMock.mock.calls.some(([, init]) => (init as RequestInit)?.method === 'DELETE'),
    ).toBe(false)
    expect(await screen.findByRole('button', { name: 'Remove sample comments' })).toBeVisible()
  })

  it('is not offered to a member, who cannot empty a shared workspace', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ...OWNER, your_role: 'member' }), { status: 200 }),
    )

    renderPage()
    await screen.findByDisplayValue('Angkor Shop')
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Remove sample comments' })).not.toBeInTheDocument(),
    )
  })

  it('is not offered once no samples remain', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ...OWNER, sample_comments: 0 }), { status: 200 }),
    )

    renderPage()
    await screen.findByDisplayValue('Angkor Shop')

    // Gated on what is stored, not on the sandbox flag, so a workspace with no
    // samples is not offered a removal that would do nothing.
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Remove sample comments' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('says how many samples will go before removing them', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(OWNER), { status: 200 }),
    )

    renderPage()
    expect(await screen.findByText('12 sample comments stored.')).toBeVisible()
  })
})
