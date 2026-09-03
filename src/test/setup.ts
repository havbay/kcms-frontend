import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  // Persisted state (session token, locale) must not leak from one test's
  // render into the next test's initial mount.
  localStorage.clear()
})
