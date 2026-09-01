import { expect, test, type Page } from '@playwright/test'

test('desktop hero communicates the human-review workflow without overflow', async ({
  page,
}) => {
  const browserErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })

  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      name: 'Moderate Khmer comments with context—not guesswork.',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('figure', { name: 'How a comment reaches human review' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'See how it works' }).click()
  await expect(
    page.getByRole('region', {
      name: 'From Facebook comment to human decision.',
    }),
  ).toBeInViewport()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true)
  expect(browserErrors).toEqual([])
})

test('mobile visitor can open navigation and switch the whole hero to Khmer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  const menu = page.getByRole('button', { name: 'Open menu' })
  await expect(menu).toBeVisible()
  await menu.click()
  await page.getByRole('button', { name: 'ភាសាខ្មែរ' }).click()

  await expect(
    page.getByRole('heading', {
      name: 'គ្រប់គ្រងមតិយោបល់ខ្មែរ ដោយយល់ពីបរិបទ មិនមែនការស្មាន។',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('region', {
      name: 'ពីមតិយោបល់ Facebook ទៅការសម្រេចដោយមនុស្ស។',
    }),
  ).toContainText('សម្រេចដោយមានបរិបទ')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('mobile primary navigation has a visible keyboard path', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'KCMS home' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await expect(
    page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'How KCMS works' }),
  ).toBeFocused()
})

test('desktop visitor reaches early access and footer without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')

  const access = page.getByRole('region', {
    name: 'Start a pilot with your Page and your team.',
  })
  await expect(access).toContainText('Pricing discussed with your team')
  await expect(access.getByRole('link', { name: /Request pilot access/ })).toBeVisible()

  const footer = page.getByRole('contentinfo')
  await expect(footer).toContainText('Versioned pattern matching')
  await expect(footer.getByRole('navigation', { name: 'Footer navigation' })).toBeVisible()

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('mobile early access and footer stack without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  await page.getByRole('contentinfo').scrollIntoViewIfNeeded()
  await expect(page.getByRole('contentinfo')).toContainText('© 2026 KCMS')

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('trust sections render before the pilot ask at both sizes', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const khmer = page.getByRole('region', {
      name: 'Khmer, Khmerlish, and the slang in between.',
    })
    const control = page.getByRole('region', {
      name: 'You decide what KCMS is allowed to do.',
    })

    await khmer.scrollIntoViewIfNeeded()
    await expect(khmer).toContainText('Stays visible')
    await control.scrollIntoViewIfNeeded()
    await expect(control).toContainText('The model is frozen between releases')

    const khmerBox = await khmer.boundingBox()
    const accessBox = await page.locator('#early-access').boundingBox()
    expect(khmerBox!.y).toBeLessThan(accessBox!.y)

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true)
  }
})

test('service overview and FAQ work without horizontal overflow', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const overview = page.getByRole('region', {
      name: 'See one Facebook comment move through KCMS.',
    })
    await expect(overview.getByText('Hide confirmed on Facebook', { exact: true }).first()).toBeVisible()
    await expect(overview.getByText('Unhide restores the comment', { exact: true }).first()).toBeVisible()
    await expect(overview.getByRole('link', { name: 'Open the client workspace' })).toBeVisible()

    const faq = page.getByRole('region', { name: 'Questions before connecting a Page.' })
    const pricing = faq.getByRole('button', { name: 'How much does KCMS cost?' })
    await pricing.click()
    await expect(pricing).toHaveAttribute('aria-expanded', 'true')
    await expect(faq).toContainText('number of connected Facebook Pages')
    await expect(faq).not.toContainText('comment volume')
    await expect(faq).not.toContainText('team size')

    expect(await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    )).toBe(true)
  }
})

test('unbuilt routes explain themselves instead of rendering blank', async ({ page }) => {
  for (const path of ['/nonsense-route']) {
    await page.goto(path)
    const body = (await page.locator('body').innerText()).trim()
    expect(body, `${path} rendered blank`).not.toBe('')
    await expect(page.getByRole('link', { name: /Open the demo/ })).toBeVisible()
  }
})

test('a visitor can submit a pilot request without creating an account first', async ({ page }) => {
  await page.route('**/api/v1/pilot-requests', (route) => route.fulfill({
    status: 202,
    contentType: 'application/json',
    body: JSON.stringify({ id: 'p1', status: 'PENDING', message: 'received' }),
  }))
  await page.goto('/request-access')
  await page.getByLabel('Your name').fill('Dara Sok')
  await page.getByLabel('Organization').fill('Angkor Shop')
  await page.getByLabel('Work email').fill('dara@example.com')
  await page.getByLabel('Facebook Page').fill('facebook.com/angkorshop')
  await page.getByRole('button', { name: 'Send request' }).click()
  await expect(page.getByRole('heading', { name: 'Request received' })).toBeVisible()
})

test('a visitor can reach the moderation demo from the landing page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Open the demo' }).click()
  // The dashboard is guarded, so the demo link lands on sign-in.
  await expect(page).toHaveURL(/\/sign-in$/)
  await expect(page.getByRole('heading', { name: 'Sign in to KCMS' })).toBeVisible()
})

test('the dashboard requires a session and bounces anonymous visitors', async ({ page }) => {
  await page.goto('/app')
  await expect(page).toHaveURL(/\/sign-in$/)
  await expect(page.getByRole('heading', { name: 'Sign in to KCMS' })).toBeVisible()
})

test('sign-in offers email, and hides Telegram until a bot is configured', async ({ page }) => {
  await page.goto('/sign-in')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()

  // An unconfigured provider must be absent, never a dead button.
  await page.waitForTimeout(1500)
  const telegramSlots = await page.locator('.auth-telegram').count()
  const enabled = await page.getByText('or', { exact: true }).count()
  expect(telegramSlots).toBe(enabled)
})

test.skip('the dashboard shows the workspace shell and marks unbuilt areas', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/app')

  const nav = page.getByRole('navigation', { name: /workspace/i })
  await expect(nav.getByRole('link', { name: 'Overview' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Moderate' })).toBeVisible()
  // Unbuilt areas are shown but must not be links.
  await expect(nav.getByRole('link', { name: 'Team' })).toHaveCount(0)
  await expect(nav.getByText('Team')).toBeVisible()

  await nav.getByRole('link', { name: 'Moderate' }).click()
  await expect(page).toHaveURL(/\/app\/moderate$/)
})

test('the header stays on top while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.evaluate(() => window.scrollTo(0, 2400))
  await page.waitForTimeout(400)

  const bar = await page.locator('.site-header-bar').boundingBox()
  expect(bar!.y).toBeLessThanOrEqual(1)
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeVisible()
})

test('the mobile drawer opens from the left and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  const drawer = page.locator('.primary-navigation')
  expect((await drawer.boundingBox())!.x).toBeLessThan(0)

  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.waitForTimeout(500)
  const open = (await drawer.boundingBox())!
  expect(open.x).toBe(0)
  // Sized to the viewport, not to the header bar.
  expect(open.height).toBeGreaterThan(700)
  await expect(page.locator('.nav-backdrop[data-open="true"]')).toBeVisible()

  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  expect((await drawer.boundingBox())!.x).toBeLessThan(0)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
})

test('sign-in validates each field inline and accessibly', async ({ page }) => {
  await page.goto('/sign-in')

  // Validated on blur, not only on submit.
  await page.getByLabel('Email').fill('not-an-email')
  await page.getByLabel('Password').click()
  await expect(page.locator('#auth-email-error')).toBeVisible()
  await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByLabel('Email')).toHaveAttribute('aria-describedby', 'auth-email-error')

  // Submitting reveals every problem at once, not one per attempt.
  await page.getByLabel('Email').fill('')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.locator('.auth-field-error')).toHaveCount(2)

  // Errors clear as the fields become valid.
  await page.getByLabel('Email').fill('dara@example.com')
  await page.getByLabel('Password').fill('a-long-enough-password')
  await expect(page.locator('.auth-field-error')).toHaveCount(0)
})

test('sign-in sends new visitors through reviewed access instead of public signup', async ({ page }) => {
  await page.goto('/sign-in')
  await expect(page.getByRole('link', { name: 'Request access' })).toHaveAttribute(
    'href', '/request-access',
  )
  await expect(page.getByRole('button', { name: 'Create account' })).toHaveCount(0)
})

/**
 * Contract-faithful network interception (D-016). Production modules import no
 * fixtures; only the boundary is simulated, and the shapes mirror the generated
 * OpenAPI types.
 */
async function stubApi(
  page: Page,
  options: { isAdmin?: boolean; role?: 'owner' | 'member' } = {},
) {
  const user = {
    id: 'u1',
    display_name: 'Dara Sok',
    is_platform_admin: options.isAdmin === true,
  }
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (path.endsWith('/auth/providers')) {
      return json({ email: true, telegram: false, telegram_bot_username: null })
    }
    if (path.endsWith('/auth/signin')) {
      return json({ token: 'test-token', user })
    }
    if (path.endsWith('/auth/me')) return json(user)
    if (path.endsWith('/comments/summary')) {
      return json({
        processed: 12, need_review: 10, reviewed: 0, pending: 10,
        left_visible: 0, hidden: 0, unhidden: 0,
        reasons: [{ surfaced_reason: 'triage', count: 10 }],
      })
    }
    if (path.endsWith('/comments')) {
      return json({ items: [], total: 0, limit: 25, offset: 0 })
    }
    if (path.endsWith('/facebook/connection')) {
      return json({ state: 'NOT_CONNECTED', can_moderate: false })
    }
    if (path.endsWith('/facebook/connections/manual')) {
      return json({
        state: 'CONNECTED', method: 'MANUAL_TOKEN', page_id: 'page-123',
        page_name: 'Angkor Shop', tasks: ['PROFILE_PLUS_MODERATE'],
        can_moderate: true, connected_at: '2026-09-01T08:00:00Z',
        last_synced_at: null,
      }, 201)
    }
    if (path.endsWith('/team')) {
      return json({
        workspace_id: 'w1',
        workspace_name: 'Angkor Shop',
        your_role: options.role ?? 'owner',
        members: [
          { user_id: 'u1', display_name: 'Dara Sok', email: 'dara@example.com',
            role: 'owner', created_at: '2026-08-31T00:00:00Z' },
          { user_id: 'u2', display_name: 'Sophea Kim', email: 'sophea@example.com',
            role: 'member', created_at: '2026-08-31T01:00:00Z' },
        ],
        invitations: (options.role ?? 'owner') === 'owner'
          ? [{ token_hash: 'h1', role: 'member',
               expires_at: '2026-09-07T00:00:00Z', created_at: '2026-08-31T00:00:00Z' }]
          : [],
      })
    }
    if (path.endsWith('/settings')) {
      return json({
        workspace_id: 'w1',
        workspace_name: 'Angkor Shop',
        is_sandbox: true,
        your_role: options.role ?? 'owner',
        display_name: 'Dara Sok',
      })
    }
    if (path.endsWith('/team/invitations')) {
      return json({ token: 'tok-123', role: 'member', expires_at: '2026-09-07T00:00:00Z' }, 201)
    }
    if (path.endsWith('/admin/pilot-requests')) {
      return options.isAdmin ? json([]) : json({ detail: 'forbidden' }, 403)
    }
    return json({}, 200)
  })
}

async function signInDemo(page: Page) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill('dara@example.com')
  await page.getByLabel('Password').fill('a-long-enough-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/app$/, { timeout: 20000 })
}

test('administration is unreachable without the platform role', async ({ page }) => {
  await stubApi(page, { isAdmin: false })
  await signInDemo(page)

  // The navigation entry is absent...
  await expect(page.locator('.dash-nav-link.is-admin')).toHaveCount(0)

  // ...and the route refuses too, rather than relying on a hidden link.
  await page.goto('/admin/requests')
  await expect(page).toHaveURL(/\/app$/, { timeout: 15000 })
})

test('an administrator sees the administration entry and can open it', async ({ page }) => {
  await stubApi(page, { isAdmin: true })
  await signInDemo(page)

  await expect(page.locator('.dash-nav-link.is-admin')).toHaveCount(1)
  await page.getByRole('link', { name: 'Administration' }).click()
  await expect(page).toHaveURL(/\/admin\/requests$/)
  await expect(page.getByRole('button', { name: 'Pending' })).toBeVisible()
})

test('the client can connect a Page by token or start Facebook authorization', async ({ page }) => {
  await stubApi(page)
  await signInDemo(page)

  await page.getByRole('link', { name: 'Connect Facebook Page' }).click()
  await expect(page).toHaveURL(/\/app\/connect$/)

  // Both routes are offered: one-click authorization and the Page token.
  await expect(page.getByRole('button', { name: 'Continue with Facebook' })).toBeEnabled()

  await page.getByLabel('Page access token').fill('test-page-token')
  await page.getByRole('button', { name: 'Validate and connect' }).click()
  await expect(page.getByText('Angkor Shop')).toBeVisible()
  await expect(page.getByText('Ready to moderate')).toBeVisible()
})


test('an owner can see the team and create a shareable invitation link', async ({ page }) => {
  await stubApi(page, { role: 'owner' })
  await signInDemo(page)

  await page.getByRole('link', { name: 'Team' }).click()
  await expect(page).toHaveURL(/\/app\/team$/)
  await expect(page.locator('.team-member')).toHaveCount(2)

  await page.getByRole('button', { name: 'Create invitation link' }).click()
  const link = page.locator('.team-link-row input')
  await expect(link).toBeVisible()
  // The link is shown once, so it must carry the token the owner has to share.
  await expect(link).toHaveValue(/\/join\/tok-123$/)
  await expect(page.getByText(/works once and expires/)).toBeVisible()
})

test('a member cannot invite or remove anyone', async ({ page }) => {
  await stubApi(page, { role: 'member' })
  await signInDemo(page)

  await page.getByRole('link', { name: 'Team' }).click()
  await expect(page.getByText('Only an owner can invite or remove people.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create invitation link' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Remove' })).toHaveCount(0)
})


test('settings let an owner rename the workspace and anyone rename themselves', async ({ page }) => {
  await stubApi(page, { role: 'owner' })
  await signInDemo(page)

  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page).toHaveURL(/\/app\/settings$/)
  await expect(page.getByLabel('Workspace name')).toHaveValue('Angkor Shop')
  await expect(page.getByLabel('Workspace name')).toBeEnabled()
  await expect(page.getByLabel('Your display name')).toHaveValue('Dara Sok')

  // The rename is explained, so nobody expects it to rewrite history.
  await expect(page.getByText(/Past actions keep the name you used/)).toBeVisible()
})

test('a member cannot rename the shared workspace', async ({ page }) => {
  await stubApi(page, { role: 'member' })
  await signInDemo(page)

  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page.getByLabel('Workspace name')).toBeDisabled()
  await expect(page.getByText('Only an owner can rename the workspace.')).toBeVisible()
  // But their own name is still theirs to change.
  await expect(page.getByLabel('Your display name')).toBeEnabled()
})

test('the dashboard has no unbuilt placeholder sections left', async ({ page }) => {
  await stubApi(page, { role: 'owner' })
  await signInDemo(page)

  await expect(page.locator('.dash-nav-link.is-pending')).toHaveCount(0)
  await expect(page.getByText('Not in the prototype')).toHaveCount(0)
  // Scoped to the sidebar: the sandbox banner also links to Page connection.
  const nav = page.getByRole('navigation', { name: /workspace/i })
  for (const label of ['Overview', 'Moderate', 'Page connection', 'Team', 'Settings']) {
    await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible()
  }
})
