import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

// Mock DotLottieReact to avoid canvas/network dependencies in jsdom
vi.mock('@lottiefiles/dotlottie-react', () => ({
  DotLottieReact: ({ src, className }: { src: string; className?: string }) => (
    <div className={className} data-testid="dotlottie-animation" data-src={src} />
  ),
}))

import {
  FloatingChannelCard,
  FloatingCommentCard,
  FloatingReactionCard,
  FloatingReplyCard,
  FloatingTrustCard,
} from './index'

describe('Bento Floating Cards', () => {
  it('renders FloatingCommentCard and toggles hide/unhide state', async () => {
    const user = userEvent.setup()
    render(<FloatingCommentCard />)

    expect(screen.getByText('Rin Layheang')).toBeInTheDocument()
    expect(screen.getByText(/98% Scam Risk/i)).toBeInTheDocument()
    expect(screen.getByText('ចុចតំណនេះទទួលលុយ $500 ថ្ងៃនេះ!')).toBeInTheDocument()

    const button = screen.getByRole('button', { name: 'Hide Comment' })
    await user.click(button)

    expect(screen.getByRole('button', { name: 'Unhide Comment' })).toBeInTheDocument()
    expect(screen.getByText('Status: Hidden on Page')).toBeInTheDocument()
  })

  it('renders FloatingReactionCard and increments reaction counters on click', async () => {
    const user = userEvent.setup()
    render(<FloatingReactionCard />)

    expect(screen.getByText('Facebook Live Stream')).toBeInTheDocument()

    const loveButton = screen.getByRole('button', { name: /Love reaction/i })
    expect(loveButton).toHaveTextContent('1,420')

    await user.click(loveButton)
    expect(loveButton).toHaveTextContent('1,421')
  })

  it('renders FloatingReplyCard with Khmer auto-reply message', () => {
    render(<FloatingReplyCard />)

    expect(screen.getByText('Smart Assistant')).toBeInTheDocument()
    expect(screen.getByText('Auto-Replied ✓')).toBeInTheDocument()
    expect(screen.getByText(/សូមអរគុណ! ក្រុមការងារនឹងឆ្លើយតបឆាប់ៗនេះ/i)).toBeInTheDocument()
  })

  it('renders FloatingChannelCard and toggles connection status', async () => {
    const user = userEvent.setup()
    render(<FloatingChannelCard />)

    expect(screen.getByText('Official Business Page')).toBeInTheDocument()
    expect(screen.getByText('Syncing Active')).toBeInTheDocument()

    const button = screen.getByRole('button', { name: 'Connected ✓' })
    await user.click(button)

    expect(screen.getByText('Paused')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument()
  })

  it('renders FloatingTrustCard with human verification guarantee', () => {
    render(<FloatingTrustCard />)

    expect(screen.getByText('100% Human-Approved')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })
})
