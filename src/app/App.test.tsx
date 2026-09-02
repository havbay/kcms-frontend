import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('KCMS public landing page', () => {
  it('explains the product and gives visitors one primary next action', () => {
    render(<App />, { wrapper: MemoryRouter })

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
    render(<App />, { wrapper: MemoryRouter })

    const header = within(screen.getByRole('navigation', { name: 'Primary navigation' }))

    expect(screen.getByRole('link', { name: 'KCMS home' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(header.getByRole('link', { name: 'How KCMS works' })).toHaveAttribute(
      'href',
      '#how-it-works',
    )
    expect(header.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in',
    )
  })

  it('lets a visitor read the hero in Khmer without leaving the page', async () => {
    const user = userEvent.setup()
    render(<App />, { wrapper: MemoryRouter })

    const languageButton = screen.getByRole('button', { name: 'ភាសាខ្មែរ' })
    expect(languageButton.querySelector('img')).toHaveAttribute(
      'src',
      '/flags/kh.svg',
    )

    await user.click(languageButton)

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
    expect(
      screen.getByRole('button', { name: 'English' }).querySelector('img'),
    ).toHaveAttribute('src', '/flags/gb.svg')
  })

  it('opens and closes the compact navigation with one labelled control', async () => {
    const user = userEvent.setup()
    render(<App />, { wrapper: MemoryRouter })

    const menuButton = screen.getByRole('button', { name: 'Open menu' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes compact navigation after changing language', async () => {
    const user = userEvent.setup()
    render(<App />, { wrapper: MemoryRouter })

    const menuButton = screen.getByRole('button', { name: 'Open menu' })

    await user.click(menuButton)
    await user.click(screen.getByRole('button', { name: 'ភាសាខ្មែរ' }))

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows the disclosed path from pattern matching to a human decision', () => {
    render(<App />, { wrapper: MemoryRouter })

    const pathway = screen.getByRole('figure', {
      name: 'How a comment reaches human review',
    })

    expect(pathway).toHaveTextContent('Automatic detection')
    expect(pathway).toHaveTextContent('Pattern matching · v0.1')
    expect(pathway).toHaveTextContent('Needs human review')
    expect(pathway).toHaveTextContent('Your team decides')
    expect(pathway).toHaveTextContent('Automatic detection · Human-approved Page actions')
  })

  it('explains the public workflow without requiring Meta developer expertise', () => {
    render(<App />, { wrapper: MemoryRouter })

    const workflow = screen.getByRole('region', {
      name: 'From Facebook comment to human decision.',
    })

    expect(workflow).toHaveAttribute('id', 'how-it-works')
    expect(workflow).toHaveTextContent('Connect the Page')
    expect(workflow).toHaveTextContent('Prioritize review')
    expect(workflow).toHaveTextContent('Decide with context')
    expect(workflow).toHaveTextContent('No Meta developer workflow for client staff')
  })

  it('translates the public workflow to Khmer', async () => {
    const user = userEvent.setup()
    render(<App />, { wrapper: MemoryRouter })

    await user.click(screen.getByRole('button', { name: 'ភាសាខ្មែរ' }))

    const workflow = screen.getByRole('region', {
      name: 'ពីមតិយោបល់ Facebook ទៅការសម្រេចដោយមនុស្ស។',
    })

    expect(workflow).toHaveTextContent('ភ្ជាប់ទំព័រ')
    expect(workflow).toHaveTextContent('កំណត់អាទិភាពពិនិត្យ')
    expect(workflow).toHaveTextContent('សម្រេចដោយមានបរិបទ')
  })

  it('offers the published early access plans', () => {
    render(<App />, { wrapper: MemoryRouter })

    const access = screen.getByRole('region', {
      name: 'Start a pilot with your Page and your team.',
    })

    expect(access).toHaveAttribute('id', 'early-access')
    expect(access).toHaveTextContent('Early access')
    expect(access).toHaveTextContent('Starter')
    expect(access).toHaveTextContent('$15/mo')
    expect(access).toHaveTextContent('Khmer & Khmerlish comment moderation')
    expect(access).toHaveTextContent('Price per Page drops as you grow')
    expect(within(access).getAllByRole('link', { name: /Request pilot access/ })).toHaveLength(2)
    expect(
      within(access).getAllByRole('link', { name: /Request pilot access/ })[0],
    ).toHaveAttribute('href', '/request-access')
  })

  it('closes the page with a footer that states prototype status', () => {
    render(<App />, { wrapper: MemoryRouter })

    const footer = screen.getByRole('contentinfo')

    expect(footer).toHaveTextContent('Prototype status')
    expect(footer).toHaveTextContent('Versioned pattern matching')
    expect(footer).toHaveTextContent('Human review required')
    expect(within(footer).getByRole('navigation', { name: 'Footer navigation' })).toBeVisible()
    expect(within(footer).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in')
  })

  it('translates the early access section and footer to Khmer', async () => {
    const user = userEvent.setup()
    render(<App />, { wrapper: MemoryRouter })

    await user.click(screen.getByRole('button', { name: 'ភាសាខ្មែរ' }))

    const access = screen.getByRole('region', {
      name: 'ចាប់ផ្តើមសាកល្បងជាមួយទំព័រ និងក្រុមរបស់អ្នក។',
    })

    expect(access).toHaveTextContent('ការចូលប្រើសាកល្បង')
    expect(access).toHaveTextContent('ចាប់ផ្តើម')
    expect(access).toHaveTextContent('$15/ខែ')
    expect(screen.getByRole('contentinfo')).toHaveTextContent('ស្ថានភាព Prototype')
  })

  it('shows how Khmer context separates institution criticism from person-directed abuse', () => {
    render(<App />, { wrapper: MemoryRouter })

    const khmer = screen.getByRole('region', {
      name: 'Khmer, Khmerlish, and the slang in between.',
    })

    expect(khmer).toHaveAttribute('id', 'khmer-context')
    expect(khmer).toHaveTextContent('Khmerlish and code-switching')
    expect(khmer).toHaveTextContent('Misspellings and obfuscated words')
    expect(khmer).toHaveTextContent('Institution')
    expect(khmer).toHaveTextContent('Stays visible')
    expect(khmer).toHaveTextContent('Person')
    expect(khmer).toHaveTextContent('Needs review')
  })

  it('states every human-control guarantee including the no-self-training rule', () => {
    render(<App />, { wrapper: MemoryRouter })

    const control = screen.getByRole('region', {
      name: 'You decide what KCMS is allowed to do.',
    })

    expect(control).toHaveAttribute('id', 'human-control')
    expect(control).toHaveTextContent('Automatic hiding is off today')
    expect(control).toHaveTextContent('Every hide and unhide is performed by a person')
    expect(control).toHaveTextContent('Actions are reversible')
    expect(control).toHaveTextContent('Correcting a model label is separate from hiding')
    expect(control).toHaveTextContent('never hidden automatically')
    expect(control).toHaveTextContent('The model is frozen between releases')
    expect(control).toHaveTextContent('reviewed offline')
    expect(control).toHaveTextContent('Messenger and Instagram are not connected yet')
  })

  it('asks for a pilot only after establishing Khmer capability and human control', () => {
    const { container } = render(<App />, { wrapper: MemoryRouter })

    const ids = Array.from(container.querySelectorAll('main > section')).map((s) => s.id)

    expect(ids).toEqual(['', 'service-overview', 'how-it-works', 'khmer-context', 'human-control', 'early-access', 'faq'])
  })

  it('offers an honest looping service overview without publishing a broken video', async () => {
    const user = userEvent.setup()
    render(<App />, { wrapper: MemoryRouter })

    const overview = screen.getByRole('region', {
      name: 'See one Facebook comment move through KCMS.',
    })
    expect(overview).toHaveAttribute('id', 'service-overview')
    expect(overview).toHaveTextContent('Comment posted on Facebook')
    expect(overview).toHaveTextContent('Automatic detection')
    expect(overview).toHaveTextContent('Human review')
    expect(overview).toHaveTextContent('Hide confirmed on Facebook')
    expect(overview).toHaveTextContent('Unhide restores the comment')
    expect(within(overview).getByRole('link', { name: 'Open the client workspace' })).toHaveAttribute('href', '/app')
    const pause = within(overview).getByRole('button', { name: 'Pause animation' })
    await user.click(pause)
    expect(within(overview).getByRole('button', { name: 'Play animation' })).toBeInTheDocument()
    expect(within(overview).queryByText(/coming soon/i)).not.toBeInTheDocument()
  })

  it('answers the core product questions one at a time', async () => {
    const user = userEvent.setup()
    render(<App />, { wrapper: MemoryRouter })

    const faq = screen.getByRole('region', { name: 'Questions before connecting a Page.' })
    const detection = within(faq).getByRole('button', { name: 'Does KCMS automatically detect comments?' })
    const pricing = within(faq).getByRole('button', { name: 'How much does KCMS cost?' })

    expect(detection).toHaveAttribute('aria-expanded', 'true')
    expect(faq).toHaveTextContent('Pattern matching powers the current prototype')

    await user.click(pricing)
    expect(detection).toHaveAttribute('aria-expanded', 'false')
    expect(pricing).toHaveAttribute('aria-expanded', 'true')
    expect(faq).toHaveTextContent('number of connected Facebook Pages')
    expect(faq).not.toHaveTextContent('comment volume')
    expect(faq).not.toHaveTextContent('team size')
  })

  it('translates the Khmer context and human control sections', async () => {
    const user = userEvent.setup()
    render(<App />, { wrapper: MemoryRouter })

    await user.click(screen.getByRole('button', { name: 'ភាសាខ្មែរ' }))

    expect(
      screen.getByRole('region', { name: 'ខ្មែរ Khmerlish និងពាក្យស្លែងនៅចន្លោះ។' }),
    ).toHaveTextContent('អង្គភាព')
    expect(
      screen.getByRole('region', {
        name: 'អ្នកជាអ្នកសម្រេចថា KCMS អាចធ្វើអ្វីបាន។',
      }),
    ).toHaveTextContent('គំរូត្រូវបានបង្កក')
  })
})
