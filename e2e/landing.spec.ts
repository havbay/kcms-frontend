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
  for (const path of ['/sign-in', '/request-access', '/nonsense-route']) {
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
  await expect(page).toHaveURL(/\/moderate$/)
})
