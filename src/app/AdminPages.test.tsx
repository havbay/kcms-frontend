import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setSessionToken } from '../api/client'
import { App } from './App'
import { SessionProvider } from './session'

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const workspace = {
  id: 'ws-angkor',
  name: 'Angkor Shop',
  plan: 'STARTER',
  is_sandbox: false,
  is_suspended: false,
  page_limit: 3,
  status: 'ACTIVE',
  trial_expires_at: null,
  created_at: '2026-09-01T08:00:00Z',
  member_count: 3,
  page_count: 1,
  comments_processed: 42,
  comments_processed_7d: 12,
  pending_comments: 2,
  replies_sent_7d: 4,
  reply_failures_7d: 0,
  auto_reply_enabled: true,
  latest_activity_at: '2026-09-09T08:00:00Z',
}

const overview = {
  total_workspaces: 1,
  active_workspaces: 1,
  trial_workspaces: 0,
  expired_workspaces: 0,
  suspended_workspaces: 0,
  connected_pages: 1,
  integration_attention: 0,
  comments_processed_7d: 12,
  replies_sent_7d: 4,
  reply_failures_7d: 0,
  pending_access_requests: 1,
  recent_workspaces: [workspace],
  generated_at: '2026-09-09T08:00:00Z',
}

function renderAt(path: string) {
  localStorage.setItem('kcms.locale', 'en')
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider><App /></SessionProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  setSessionToken('admin-session')
  vi.stubGlobal('fetch', vi.fn((input: string | URL | Request) => {
    const path = new URL(String(input), 'http://test').pathname
    if (path.endsWith('/auth/me')) {
      return Promise.resolve(response({
        id: 'platform-admin',
        display_name: 'Platform Admin',
        is_platform_admin: true,
      }))
    }
    if (path.endsWith('/admin/overview')) return Promise.resolve(response(overview))
    if (path.endsWith('/admin/workspaces')) {
      return Promise.resolve(response({
        items: [workspace], total: 1, limit: 50, offset: 0,
        generated_at: '2026-09-09T08:00:00Z',
      }))
    }
    return Promise.resolve(response({}, 404))
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  setSessionToken(null)
})

describe('platform admin console', () => {
  it('renders the operational overview from the admin API', async () => {
    renderAt('/admin/overview')

    expect(await screen.findByRole('heading', { name: 'Admin overview' })).toBeVisible()
    expect(screen.getByText('KCMS is operating normally')).toBeVisible()
    expect(screen.getByText('Angkor Shop')).toBeVisible()
    expect(screen.getByText('Pages needing attention')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Open client workspace' })).toHaveAttribute('href', '/app')
  })

  it('lists workspaces without exposing customer comment content', async () => {
    renderAt('/admin/workspaces')

    expect(await screen.findByRole('heading', { name: 'Workspaces' })).toBeVisible()
    expect(await screen.findByText('Angkor Shop')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Open Angkor Shop' })).toHaveAttribute(
      'href',
      '/admin/workspaces/ws-angkor',
    )
    expect(screen.queryByText('This is a customer comment body')).not.toBeInTheDocument()
  })
})
