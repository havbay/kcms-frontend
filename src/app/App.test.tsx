import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { App } from './App'

describe('KCMS public landing page', () => {
  // The app defaults an unseeded visitor to Khmer; these tests describe the
  // English experience specifically, so they seed the choice a real
  // English-preferring visitor would already have stored.
  beforeEach(() => {
    localStorage.setItem('kcms.locale', 'en')
  })

  it('states the offer once and points at a single primary action', () => {
    render(<App />, { wrapper: MemoryRouter })

    expect(
      screen.getByRole('heading', { level: 1, name: 'No more spending hours checking comments one by one.' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Manage thousands of comments effortlessly with AI.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Try free trial' })).toHaveAttribute('href', '/sign-up')
  })

  it('offers public navigation that reaches every section of the page', () => {
    render(<App />, { wrapper: MemoryRouter })

    const nav = within(screen.getByRole('navigation', { name: 'Primary navigation' }))
    expect(nav.getByRole('link', { name: 'How It Works' })).toHaveAttribute('href', '#how')
    expect(nav.getByRole('link', { name: 'Features' })).toHaveAttribute('href', '#features')
    expect(nav.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '#pricing')
    expect(nav.getByRole('link', { name: 'About' })).toHaveAttribute('href', '#why')

    expect(screen.getByRole('link', { name: 'KCMS home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in')
  })

  it('walks a visitor from the problem to the answer before asking for anything', () => {
    render(<App />, { wrapper: MemoryRouter })

    expect(screen.getByRole('heading', { name: 'Too many comments to handle?' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'KCMS helps you handle it.' })).toBeInTheDocument()

    // The four steps are a real sequence, so they are numbered and ordered.
    const solution = within(screen.getByRole('region', { name: 'KCMS helps you handle it.' }))
    expect(solution.getByRole('heading', { name: 'Comment' })).toBeInTheDocument()
    expect(solution.getByRole('heading', { name: 'AI analysis' })).toBeInTheDocument()
    expect(solution.getByRole('heading', { name: 'Classification' })).toBeInTheDocument()
    expect(solution.getByRole('heading', { name: 'Action' })).toBeInTheDocument()
  })

  it('never claims KCMS acts on a comment by itself', () => {
    render(<App />, { wrapper: MemoryRouter })

    expect(screen.getByText('Hide, reply or leave it. A person on your team decides.')).toBeInTheDocument()
    expect(screen.getByText('Every action taken by a person')).toBeInTheDocument()
    expect(screen.getByText('Reversible, with a full audit trail')).toBeInTheDocument()
  })

  it('shows the whole comment journey, including the step that puts it back', () => {
    render(<App />, { wrapper: MemoryRouter })

    const how = within(screen.getByRole('region', { name: 'AI understands and analyzes your comments.' }))
    for (const chapter of [
      'Comment posted on Facebook',
      'Automatic detection',
      'Human review',
      'Hide confirmed on Facebook',
      'Unhide restores the comment',
    ]) {
      expect(how.getByText(chapter)).toBeInTheDocument()
    }
  })

  it('lets a visitor stop the walkthrough rather than trapping them in a loop', async () => {
    const user = userEvent.setup()
    render(<App />, { wrapper: MemoryRouter })

    const how = within(screen.getByRole('region', { name: 'AI understands and analyzes your comments.' }))
    await user.click(how.getByRole('button', { name: 'Pause walkthrough' }))
    expect(how.getByRole('button', { name: 'Play walkthrough' })).toBeInTheDocument()
  })

  it('says the walkthrough is a prototype rather than passing it off as a recording', () => {
    render(<App />, { wrapper: MemoryRouter })

    expect(
      screen.getByText(/replaced by a recording of the verified live flow/i),
    ).toBeInTheDocument()
  })

  it('publishes three plans and marks the undecided price as undecided', () => {
    render(<App />, { wrapper: MemoryRouter })

    const pricing = within(screen.getByRole('region', { name: 'Choose a plan that fits your needs.' }))
    expect(pricing.getByRole('heading', { name: 'Free' })).toBeInTheDocument()
    expect(pricing.getByRole('heading', { name: 'Pro' })).toBeInTheDocument()
    expect(pricing.getByRole('heading', { name: 'Business' })).toBeInTheDocument()

    // A price we have not set must never render as a number a visitor could hold us to.
    expect(pricing.getByText(/Pricing is not final/i)).toBeInTheDocument()
    expect(pricing.getByText(/Coming soon/i)).toBeInTheDocument()
    expect(pricing.getByText('$—')).toBeInTheDocument()
  })

  it('explains the Khmer-first advantage rather than only asserting it', () => {
    render(<App />, { wrapper: MemoryRouter })

    const why = within(screen.getByRole('region', { name: 'Built for Khmer.' }))
    expect(why.getByText(/translate a Khmer comment into English and judge the translation/i)).toBeInTheDocument()
    expect(why.getByText('Khmerlish and code-switching')).toBeInTheDocument()
    expect(why.getByText('Criticism of a company, kept visible')).toBeInTheDocument()
  })

  it('keeps Khmer comment samples in Khmer on the English page', () => {
    render(<App />, { wrapper: MemoryRouter })

    // A Khmer comment on a Cambodian Page is the product's real input; it is
    // not interface copy and must not be translated away.
    expect(screen.getAllByText('ចុចតំណនេះទទួលលុយ $500 ថ្ងៃនេះ!').length).toBeGreaterThan(0)
  })

  it('switches the whole page to Khmer and offers the way back', async () => {
    const user = userEvent.setup()
    render(<App />, { wrapper: MemoryRouter })

    await user.click(screen.getByRole('button', { name: 'ភាសាខ្មែរ' }))

    expect(
      screen.getByRole('heading', { level: 1, name: 'មិនចាំបាច់ចំណាយពេលច្រើនមើល និង Check Comment ម្ដងមួយទៀតទេ' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'មតិយោបល់ច្រើនពេក?' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'បង្កើតឡើងសម្រាប់ភាសាខ្មែរ' })).toBeInTheDocument()

    // The toggle always offers the language you are not reading.
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'ភាសាខ្មែរ' })).not.toBeInTheDocument()
  })

  it('remembers the language choice for the next visit', async () => {
    const user = userEvent.setup()
    render(<App />, { wrapper: MemoryRouter })

    await user.click(screen.getByRole('button', { name: 'ភាសាខ្មែរ' }))
    expect(localStorage.getItem('kcms.locale')).toBe('km')
  })

  it('closes the page with a footer that can reach the rest of the site', () => {
    render(<App />, { wrapper: MemoryRouter })

    const footer = within(screen.getByRole('contentinfo'))
    expect(footer.getByRole('navigation', { name: 'Footer navigation' })).toBeVisible()
    expect(footer.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/request-access')
    expect(footer.getByText(/Built in Cambodia, for Khmer/i)).toBeInTheDocument()
  })
})
