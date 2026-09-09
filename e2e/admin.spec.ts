import { expect, test } from '@playwright/test'

// The local bearer-session provider is used for this focused console check.
// The repository's default browser suite runs with Clerk enabled, so keep the
// provider-specific check opt-in instead of pretending Clerk was authenticated.
test.skip(!process.env.KCMS_ADMIN_E2E, 'run with KCMS_ADMIN_E2E=1 and Clerk disabled')

const workspace = {
  id: 'ws-angkor', name: 'Angkor Shop', plan: 'STARTER', is_sandbox: false,
  status: 'ACTIVE', is_suspended: false, page_limit: 3, trial_expires_at: null, created_at: '2026-09-01T08:00:00Z',
  member_count: 3, page_count: 1, comments_processed: 42,
  comments_processed_7d: 12, pending_comments: 2, replies_sent_7d: 4,
  reply_failures_7d: 0, auto_reply_enabled: true,
  latest_activity_at: '2026-09-09T08:00:00Z',
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kcms.locale', 'en')
    localStorage.setItem('kcms.session', 'admin-session')
  })
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ id: 'platform-admin', display_name: 'Platform Admin', is_platform_admin: true }),
  }))
  await page.route('**/api/v1/admin/overview', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      total_workspaces: 1, active_workspaces: 1, trial_workspaces: 0,
      expired_workspaces: 0, connected_pages: 1, integration_attention: 0,
      comments_processed_7d: 12, replies_sent_7d: 4, reply_failures_7d: 0,
      suspended_workspaces: 0, pending_access_requests: 1, recent_workspaces: [workspace],
      generated_at: '2026-09-09T08:00:00Z',
    }),
  }))
})

test('platform admin overview stays within the viewport on desktop', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/admin/overview')

  await expect(page.getByRole('heading', { name: 'Admin overview' })).toBeVisible()
  await expect(page.getByText('KCMS is operating normally')).toBeVisible()
  await expect(page.getByText('Angkor Shop')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  expect(browserErrors).toEqual([])
})

test('platform admin navigation opens on mobile and can reach workspaces', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/admin/overview')

  const menu = page.getByRole('button', { name: 'Open admin navigation' })
  await expect(menu).toBeVisible()
  await menu.click()
  await expect(page.getByRole('navigation', { name: 'KCMS administration' })).toBeVisible()
  await page.getByRole('link', { name: 'Workspaces' }).click()
  await expect(page).toHaveURL(/\/admin\/workspaces$/)
})
