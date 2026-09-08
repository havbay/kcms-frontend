import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AutomatedRepliesPage } from './AutomatedRepliesPage'

const settings = { enabled: false, your_role: 'owner' }

function stubApi() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input)
    if (url.endsWith('/settings') && init?.method === 'PATCH') {
      const body = JSON.parse(String(init.body)) as { enabled?: boolean }
      return new Response(JSON.stringify({ ...settings, enabled: body.enabled ?? false }), { status: 200 })
    }
    if (url.endsWith('/settings')) return new Response(JSON.stringify(settings), { status: 200 })
    if (url.endsWith('/rules')) return new Response('[]', { status: 200 })
    if (url.includes('/events')) return new Response('[]', { status: 200 })
    return new Response('{}', { status: 200 })
  })
}

describe('automated reply live controls', () => {
  afterEach(() => vi.restoreAllMocks())

  it('requires confirmation before enabling live replies', async () => {
    stubApi()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<AutomatedRepliesPage locale="en" />, { wrapper: MemoryRouter })

    const enabled = await screen.findByRole('switch', { name: 'Automated replies are off' })
    await userEvent.click(enabled)

    expect(window.confirm).toHaveBeenCalledOnce()
    expect(enabled).toBeChecked()
  })

  it('keeps Messenger visibly disabled while it is under development', async () => {
    stubApi()

    render(<AutomatedRepliesPage locale="en" />, { wrapper: MemoryRouter })

    const messenger = await screen.findByRole('checkbox', { name: /Messenger messages/ })
    expect(messenger).toBeDisabled()
    expect(screen.getByText('Under development')).toBeVisible()
  })
})
