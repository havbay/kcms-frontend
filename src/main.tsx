import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/google-sans'
import '@fontsource-variable/manrope'
import '@fontsource-variable/noto-sans-khmer'

import { BrowserRouter } from 'react-router-dom'

import { App } from './app/App'
import { SessionProvider } from './app/session'
import './styles.css'
import './styles/workspace.css'
import './styles/tailwind.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('KCMS application root was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <App />
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
)
