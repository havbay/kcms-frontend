import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfilePage } from './ProfilePage'
import { SessionProvider } from './session'

const SETTINGS = {
  workspace_id: 'ws-1',
  workspace_name: 'Angkor Shop',
  display_name: 'Dara Sok',
  your_role: 'owner',
  is_sandbox: true,
  sample_comments: 0,
}

const STARTER = {
  connections: [
    {
      page_id: 'page-1',
      page_name: 'Angkor Shop',
      connected_at: '2026-09-01T08:00:00Z',
      can_moderate: true,
      method: 'FACEBOOK_LOGIN',
    },
  ],
  page_limit: 3,
  plan: 'STARTER',
}

/** The profile reads the account and, for the plan, the Page connections that
 *  the plan limits. Route by URL so either can be varied on its own. */
function stub(options: { plan?: unknown; planStatus?: number } = {}) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    if (url.includes('/facebook/connections')) {
      return new Response(JSON.stringify(options.plan ?? STARTER), {
        status: options.planStatus ?? 200,
      })
    }
    return new Response(JSON.stringify(SETTINGS), { status: 200 })
  })
}

function renderPage() {
  return render(
    <SessionProvider>
      <ProfilePage locale="en" setLocale={() => {}} />
    </SessionProvider>,
    { wrapper: MemoryRouter },
  )
}

describe('current subscription plan', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('names the plan and how much of it is used', async () => {
    stub()

    renderPage()

    const card = await screen.findByRole('region', { name: 'Subscription plan' })
    expect(within(card).getByText('Starter')).toBeVisible()
    expect(within(card).getByText('1 of 3 Pages connected')).toBeVisible()
    expect(within(card).getByRole('link', { name: /Upgrade to Growth/ })).toBeVisible()
  })

  it('offers the upgrade only while there is a bigger plan to move to', async () => {
    stub({ plan: { ...STARTER, page_limit: 10, plan: 'GROWTH' } })

    renderPage()

    const card = await screen.findByRole('region', { name: 'Subscription plan' })
    expect(within(card).getByText('Growth')).toBeVisible()
    expect(within(card).queryByRole('link', { name: /Upgrade to Growth/ })).toBeNull()
  })

  it('says the plan is unreadable rather than claiming a plan it did not get', async () => {
    stub({ planStatus: 500 })

    renderPage()

    const card = await screen.findByRole('region', { name: 'Subscription plan' })
    expect(await within(card).findByText(/plan could not be read/)).toBeVisible()
    // Guessing "Starter" here would understate a workspace that pays for more.
    expect(within(card).queryByText('Starter')).toBeNull()
  })
})
