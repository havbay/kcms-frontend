import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = ''
  readonly scrollMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
  unobserve() {}
}

if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
}

if (typeof window !== 'undefined' && window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.play = () => Promise.resolve()
  window.HTMLMediaElement.prototype.pause = () => {}
}

afterEach(() => {
  cleanup()
  // Persisted state (session token, locale) must not leak from one test's
  // render into the next test's initial mount.
  localStorage.clear()
})
