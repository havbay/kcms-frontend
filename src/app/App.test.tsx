import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('KCMS public landing page', () => {
  it('explains the product and gives visitors one primary next action', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Moderate Khmer comments with context—not guesswork.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/humans decide every moderation action/i),
    ).toBeInTheDocument()
    for (const link of screen.getAllByRole('link', { name: 'Request access' })) {
      expect(link).toHaveAttribute('href', '/request-access')
    }
  })

  it('offers familiar public navigation without competing with the primary action', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: 'KCMS home' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByRole('link', { name: 'How KCMS works' })).toHaveAttribute(
      'href',
      '#how-it-works',
    )
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in',
    )
  })

  it('lets a visitor read the hero in Khmer without leaving the page', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'ភាសាខ្មែរ' }))

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'គ្រប់គ្រងមតិយោបល់ខ្មែរ ដោយយល់ពីបរិបទ មិនមែនការស្មាន។',
      }),
    ).toBeInTheDocument()
    for (const link of screen.getAllByRole('link', {
      name: 'ស្នើសុំប្រើប្រាស់',
    })) {
      expect(link).toHaveAttribute('href', '/request-access')
    }
  })

  it('opens and closes the compact navigation with one labelled control', async () => {
    const user = userEvent.setup()
    render(<App />)

    const menuButton = screen.getByRole('button', { name: 'Open menu' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows the disclosed path from pattern matching to a human decision', () => {
    render(<App />)

    const pathway = screen.getByRole('figure', {
      name: 'How a comment reaches human review',
    })

    expect(pathway).toHaveTextContent('Pattern matching')
    expect(pathway).toHaveTextContent('Needs human review')
    expect(pathway).toHaveTextContent('Your team decides')
    expect(pathway).toHaveTextContent('No automatic moderation actions')
  })
})
