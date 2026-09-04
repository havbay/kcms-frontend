import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    // Keep production overhead and event volume appropriate for the demo.
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      // KCMS must never send comment text, bearer tokens, or request bodies.
      if (event.request) {
        delete event.request.data
        delete event.request.cookies
        if (event.request.headers) {
          delete event.request.headers.Authorization
          delete event.request.headers.authorization
          delete event.request.headers.Cookie
          delete event.request.headers.cookie
        }
      }
      return event
    },
  })
}

