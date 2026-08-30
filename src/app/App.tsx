import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'

import type { Locale } from './copy'
import { LandingPage } from './LandingPage'
import { ModeratePage } from './ModeratePage'
import { NoticePage } from './NoticePage'

export function App() {
  const [locale, setLocale] = useState<Locale>('en')
  const shared = { locale, setLocale }

  return (
    <Routes>
      <Route path="/" element={<LandingPage {...shared} />} />
      <Route path="/moderate" element={<ModeratePage {...shared} />} />
      <Route path="/request-access" element={<NoticePage kind="request-access" {...shared} />} />
      <Route path="/sign-in" element={<NoticePage kind="sign-in" {...shared} />} />
      {/* Never leave a route blank: the SPA rewrite makes every path return 200. */}
      <Route path="*" element={<NoticePage kind="not-found" {...shared} />} />
    </Routes>
  )
}
