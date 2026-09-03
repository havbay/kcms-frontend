import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setSessionToken } from '../api/client'
import { DashboardLayout } from './DashboardLayout'
import { SessionProvider } from './session'

const USER = {
  id: 'u-1',
  email: 'admin@kcms.local',
  display_name: 'Admin User',
  is_platform_admin: false,
  workspace_id: 'ws-1',
}

const SETTINGS = {
  workspace_id: 'ws-1',
  workspace_name: 'Angkor Shop',
  display_name: 'Admin User',
  your_role: 'owner',
  is_sandbox: true,
  sample_comments: 0,
}

/** The sidebar reads the signed-in user, the workspace, and the plan that the
 *  Page connections carry. Route by URL so the plan can be varied on its own. */
function stub(options: { plan?: unknown; planStatus?: number } = {}) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    if (url.includes('/facebook/connections')) {
      return new Response(
        JSON.stringify(options.plan ?? { connections: [], page_limit: 3, plan: 'STARTER' }),
        { status: options.planStatus ?? 200 },
      )
    }
    if (url.includes('/auth/me') || url.includes('/me')) {
      return new Response(JSON.stringify(USER), { status: 200 })
    }
    return new Response(JSON.stringify(SETTINGS), { status: 200 })
  })
}

function renderLayout() {
  return render(
    <SessionProvider>
      <DashboardLayout locale="en" setLocale={() => {}}>
        <p>page</p>
      </DashboardLayout>
    </SessionProvider>,
    { wrapper: MemoryRouter },
  )
}

describe('the sidebar account card', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // The client reads the stored token once, at import: set it through the
    // client so the session restores rather than writing localStorage here.
    setSessionToken('token-1')
  })
  afterEach(() => {
    vi.restoreAllMocks()
    setSessionToken(null)
  })

  it('shows the plan this workspace is on beside the role', async () => {
    stub()

    renderLayout()

    const card = await screen.findByTitle('Profile')
    expect(within(card).getByText('Owner')).toBeVisible()
    expect(within(card).getByText('Starter')).toBeVisible()
  })

  it('names the bigger plan when the workspace is on it', async () => {
    stub({ plan: { connections: [], page_limit: 10, plan: 'GROWTH' } })

    renderLayout()

    expect(await screen.findByText('Growth')).toBeVisible()
  })

  it('says nothing about the plan rather than guessing when it cannot be read', async () => {
    stub({ planStatus: 500 })

    renderLayout()

    const card = await screen.findByTitle('Profile')
    expect(within(card).getByText('Owner')).toBeVisible()
    expect(within(card).queryByText('Starter')).toBeNull()
    expect(within(card).queryByText('Growth')).toBeNull()
  })
})
