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
  auto_delete_delay_minutes: 0,
  auto_hide_offensive: false,
  keyword_allowlist: [] as string[],
  keyword_blocklist: [] as string[],
}

/** Settings reads both the workspace and this workspace's keyword list. */
function stub(settings: Record<string, unknown> = OWNER, keywords: unknown[] = []) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    if (url.includes('/settings/keywords')) {
      return new Response(JSON.stringify(keywords), { status: 200 })
    }
    if (url.includes('/comments/samples')) {
      return new Response(JSON.stringify({ removed: 12 }), { status: 200 })
    }
    return new Response(JSON.stringify(settings), { status: 200 })
  })
}

function renderPage() {
  return render(
    <SessionProvider>
      <SettingsPage locale="en" />
    </SessionProvider>,
    { wrapper: MemoryRouter },
  )
}

describe('what the settings page shows', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('no longer offers workspace rename, sample removal, or account details', async () => {
    stub()

    renderPage()
    await screen.findByLabelText('Auto-delete delay')

    expect(screen.queryByLabelText('Workspace name')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove sample comments' })).not.toBeInTheDocument()
    expect(screen.queryByText('Account details')).not.toBeInTheDocument()
    expect(screen.queryByText('You')).not.toBeInTheDocument()
  })
})

describe('auto-delete quarantine delay', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('shows the current delay and lets an owner change it', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes('/settings/keywords')) return new Response(JSON.stringify([]), { status: 200 })
      if (url.includes('/settings/auto-delete')) {
        return new Response(JSON.stringify({ ...OWNER, auto_delete_delay_minutes: 30 }), { status: 200 })
      }
      return new Response(JSON.stringify(OWNER), { status: 200 })
    })

    renderPage()
    const select = await screen.findByLabelText('Auto-delete delay')
    expect(select).toHaveValue('0')

    await user.selectOptions(select, '30')

    await waitFor(() => expect(select).toHaveValue('30'))
    const patched = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes('/settings/auto-delete') && (init as RequestInit)?.method === 'PATCH',
    )
    expect(patched).toBeDefined()
    expect(JSON.parse(String((patched?.[1] as RequestInit).body))).toEqual({ delay_minutes: 30 })
  })

  it('is disabled for a member, who cannot change it', async () => {
    stub({ ...OWNER, your_role: 'member' })

    renderPage()
    expect(await screen.findByLabelText('Auto-delete delay')).toBeDisabled()
  })
})

describe('advanced moderation settings', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('lets an owner turn on auto-hide for offensive comments', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes('/settings/keywords')) return new Response(JSON.stringify([]), { status: 200 })
      if (url.includes('/settings/auto-hide-offensive')) {
        return new Response(JSON.stringify({ ...OWNER, auto_hide_offensive: true }), { status: 200 })
      }
      return new Response(JSON.stringify(OWNER), { status: 200 })
    })

    renderPage()
    const toggle = await screen.findByLabelText('Auto-hide offensive comments')
    expect(toggle).not.toBeChecked()

    await user.click(toggle)

    await waitFor(() => expect(toggle).toBeChecked())
    const patched = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes('/settings/auto-hide-offensive') &&
        (init as RequestInit)?.method === 'PATCH',
    )
    expect(JSON.parse(String((patched?.[1] as RequestInit).body))).toEqual({ enabled: true })
  })

  it('is disabled for a member, who cannot change it', async () => {
    stub({ ...OWNER, your_role: 'member' })

    renderPage()
    expect(await screen.findByLabelText('Auto-hide offensive comments')).toBeDisabled()
  })

  it('no longer offers allowlist or blocklist phrase editing', async () => {
    stub()

    renderPage()
    await screen.findByLabelText('Auto-hide offensive comments')

    expect(screen.queryByLabelText('Allowlist phrases')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Blocklist phrases')).not.toBeInTheDocument()
  })
})
