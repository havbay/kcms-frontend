import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'

import type { Locale } from './copy'
import { LandingPage } from './LandingPage'
import { ModeratePage } from './ModeratePage'

export function App() {
  const [locale, setLocale] = useState<Locale>('en')

  return (
    <Routes>
      <Route path="/" element={<LandingPage locale={locale} setLocale={setLocale} />} />
      <Route path="/moderate" element={<ModeratePage locale={locale} setLocale={setLocale} />} />
    </Routes>
  )
}
