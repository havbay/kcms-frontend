import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import '@fontsource-variable/google-sans'
import '@fontsource-variable/manrope'
import '@fontsource-variable/noto-sans-khmer'

import { BrowserRouter } from 'react-router-dom'

import { App } from './app/App'
import { ClerkSessionProvider } from './app/ClerkSessionProvider'
import { SessionProvider } from './app/session'
import './sentry'
import './styles.css'
import './styles/workspace.css'
import './styles/tailwind.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('KCMS application root was not found')
}

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const sessionTree = clerkKey ? (
  <ClerkProvider publishableKey={clerkKey}>
    <ClerkSessionProvider><App /></ClerkSessionProvider>
  </ClerkProvider>
) : <SessionProvider><App /></SessionProvider>

createRoot(rootElement).render(
  <StrictMode><BrowserRouter>{sessionTree}</BrowserRouter></StrictMode>,
)
