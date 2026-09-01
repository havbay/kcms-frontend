import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'
import { SessionProvider } from './session'
import { setSessionToken } from '../api/client'


function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider><App /></SessionProvider>
    </MemoryRouter>,
  )
}


function response(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }))
}


afterEach(() => {
  vi.unstubAllGlobals()
  setSessionToken(null)
  localStorage.clear()
})


describe('pilot onboarding', () => {
  it('keeps account creation behind the reviewed access flow', async () => {
    vi.stubGlobal('fetch', vi.fn(() => response({
      email: true,
      telegram: false,
      telegram_bot_username: null,
    })))

    renderAt('/sign-in')

    expect(await screen.findByRole('heading', { name: 'Sign in to KCMS' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Request access' })).toHaveAttribute(
      'href', '/request-access',
    )
    expect(screen.queryByText('Need an account? Create one')).not.toBeInTheDocument()
  })

  it('submits a focused public request and keeps the visitor informed', async () => {
    const user = userEvent.setup()
    let submittedBody: unknown
    const fetch = vi.fn((_url: string, init?: RequestInit) => {
      submittedBody = JSON.parse(String(init?.body))
      return response({
        id: 'request-1', status: 'PENDING', message: 'Your request was received and will be reviewed.',
      }, 202)
    })
    vi.stubGlobal('fetch', fetch)
    renderAt('/request-access')

    expect(screen.getByRole('heading', { name: 'Request pilot access' })).toBeVisible()
    await user.type(screen.getByLabelText('Your name'), 'Dara Sok')
    await user.type(screen.getByLabelText('Organization'), 'Angkor Shop')
    await user.type(screen.getByLabelText('Work email'), 'dara@example.com')
    await user.type(screen.getByLabelText('Facebook Page'), 'facebook.com/angkorshop')
    await user.type(screen.getByLabelText('What should we know? (optional)'), 'Scam replies')
    await user.click(screen.getByRole('button', { name: 'Send request' }))

    expect(await screen.findByRole('heading', { name: 'Request received' })).toBeVisible()
    expect(screen.getByText(/review it and contact you before creating access/i)).toBeVisible()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(submittedBody).toEqual({
      name: 'Dara Sok',
      organization: 'Angkor Shop',
      email: 'dara@example.com',
      facebook_page: 'facebook.com/angkorshop',
      note: 'Scam replies',
    })
  })

  it('preserves entered values when submission is unavailable', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    renderAt('/request-access')

    await user.type(screen.getByLabelText('Your name'), 'Dara Sok')
    await user.type(screen.getByLabelText('Organization'), 'Angkor Shop')
    await user.type(screen.getByLabelText('Work email'), 'dara@example.com')
    await user.type(screen.getByLabelText('Facebook Page'), 'facebook.com/angkorshop')
    await user.click(screen.getByRole('button', { name: 'Send request' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('could not send')
    expect(screen.getByLabelText('Organization')).toHaveValue('Angkor Shop')
  })

  it('lets an invited owner choose their own password', async () => {
    const user = userEvent.setup()
    const fetch = vi.fn((_url: string, init?: RequestInit) => {
      if (!init?.method) {
        return response({
          organization: 'Angkor Shop', email: 'dara@example.com', expires_at: '2026-09-07T00:00:00Z',
        })
      }
      return response({
        token: 'session-token',
        user: { id: 'u1', display_name: 'Dara Sok', is_platform_admin: false },
      })
    })
    vi.stubGlobal('fetch', fetch)
    renderAt('/setup/one-time-token')

    expect(await screen.findByRole('heading', { name: 'Set up Angkor Shop' })).toBeVisible()
    expect(screen.getByText('dara@example.com')).toBeVisible()
    await user.type(screen.getByLabelText('Your name'), 'Dara Sok')
    await user.type(screen.getByLabelText('Create password'), 'a-new-secure-password')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('heading', { name: 'Your workspace is ready' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Open workspace' })).toHaveAttribute('href', '/app')
  })

  it('gives an expired invitation a safe recovery path', async () => {
    vi.stubGlobal('fetch', vi.fn(() => response({ detail: 'expired' }, 404)))
    renderAt('/setup/expired-token')

    expect(await screen.findByRole('heading', { name: 'This invitation is no longer valid' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Request a new invitation' })).toHaveAttribute(
      'href', '/request-access',
    )
  })

  it('shows an administrator whether approval email was delivered and preserves fallback link', async () => {
    const user = userEvent.setup()
    setSessionToken('admin-session')
    const row = {
      id: 'p1', name: 'Dara Sok', organization: 'Angkor Shop', email: 'dara@example.com',
      facebook_page: 'facebook.com/angkorshop', note: null, status: 'PENDING',
      decision_reason: null, decided_at: null, created_at: '2026-08-31T00:00:00Z',
      delivery_status: 'MANUAL_REQUIRED',
    }
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      const path = new URL(url).pathname
      if (path.endsWith('/auth/me')) {
        return response({ id: 'admin', display_name: 'Admin', is_platform_admin: true })
      }
      if (path.endsWith('/admin/pilot-requests/p1/decision') && init?.method === 'POST') {
        return response({
          ...row, status: 'APPROVED',
          invitation_url: 'https://kcms.example/setup/one-time-token',
          delivery_status: 'MANUAL_REQUIRED',
        })
      }
      if (path.endsWith('/admin/pilot-requests')) return response([row])
      if (path.endsWith('/admin/access-requests')) return response([])
      return response({}, 404)
    }))
    renderAt('/admin/requests')

    expect(await screen.findByRole('heading', { name: 'Angkor Shop' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Approve' }))
    expect(await screen.findByText('Email not sent—share this link manually.')).toBeVisible()
    expect(screen.getByDisplayValue('https://kcms.example/setup/one-time-token')).toBeVisible()
  })
})
