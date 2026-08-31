import { expect, test } from '@playwright/test'

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

test('unbuilt routes explain themselves instead of rendering blank', async ({ page }) => {
  for (const path of ['/request-access', '/nonsense-route']) {
    await page.goto(path)
    const body = (await page.locator('body').innerText()).trim()
    expect(body, `${path} rendered blank`).not.toBe('')
    await expect(page.getByRole('link', { name: /Open the demo/ })).toBeVisible()
  }
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

test('sign-up validates each field inline and accessibly', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByRole('button', { name: /Need an account/ }).click()

  // Validated on blur, not only on submit.
  await page.getByLabel('Email').fill('not-an-email')
  await page.getByLabel('Password').click()
  await expect(page.locator('#auth-email-error')).toBeVisible()
  await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByLabel('Email')).toHaveAttribute('aria-describedby', 'auth-email-error')

  // Submitting reveals every problem at once, not one per attempt.
  await page.getByLabel('Email').fill('')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.locator('.auth-field-error')).toHaveCount(3)

  // Errors clear as the fields become valid.
  await page.getByLabel('Your name').fill('Dara Sok')
  await page.getByLabel('Email').fill('dara@example.com')
  await page.getByLabel('Password').fill('a-long-enough-password')
  await expect(page.locator('.auth-field-error')).toHaveCount(0)
})

test('sign-up says what a demo workspace is before asking for details', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByRole('button', { name: /Need an account/ }).click()
  await expect(page.getByText(/demo workspace with sample Khmer comments/)).toBeVisible()
  await expect(page.getByText(/Connecting your own Facebook Page needs approval/)).toBeVisible()
})
