import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import '@fontsource-variable/noto-sans-khmer'

import { App } from './app/App'
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('KCMS application root was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
