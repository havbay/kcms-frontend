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
  await expect(page.getByRole('link', { name: 'How KCMS works' })).toBeFocused()
})
