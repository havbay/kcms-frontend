# KCMS Frontend

Khmer Comment Moderation System — public site and client web application.

**Live:** https://kcms-frontend.vercel.app

React 19, TypeScript (strict) and Vite. See
[`../kcms-planning/adr/0003-frontend-runtime.md`](../kcms-planning/adr/0003-frontend-runtime.md).

## Quick start

```bash
npm install
npm run dev          # http://127.0.0.1:5173
npm test             # Vitest
npm run test:e2e     # Playwright
npm run typecheck
npm run lint
npm run build
```

Requires Node 22.12+, npm 10+, and Google Chrome for Playwright.

> Playwright runs 6 browsers in parallel. On a loaded machine this fails with
> `Object with guid ... was not bound in the connection` — that is resource
> exhaustion, not a defect. Re-run with `npx playwright test --workers=1`.

## What is built

The complete bilingual public landing page:

```
Header ─▶ Hero + Comment Pathway
       ─▶ How KCMS works        three handoffs, Page to human decision
       ─▶ Built for Khmer       institution complaint vs person-directed abuse
       ─▶ Human control         five guarantees, current scope
       ─▶ Early access          pilot card, no invented price tiers
       ─▶ Footer
```

Every section is fully English/Khmer switchable.

A unit test asserts the **section order**, so the pilot ask cannot drift above
the trust sections that justify it.

## Design system

| Token | Hex | Use |
|---|---|---|
| Rice Paper | `#F6F4ED` | Page background |
| Clean White | `#FFFFFF` | Panels and cards |
| Deep Ink | `#183033` | Text, headings, footer |
| Mekong Teal | `#0B6B63` | Primary actions, links, focus |
| Review Amber | `#C26A0A` | Needs-review and warning states |
| Harm Red | `#B42318` | Harmful content and errors only |

Typography is Manrope with Noto Sans Khmer, with Khmer-specific line-height and
letter-spacing overrides (`.site[lang='km']`) because Khmer needs more vertical
room than Latin.

Amber and red carry operational meaning and are never decorative.

## Copy rules

Claims on the public site must stay true as automation grows:

- **"Automatic detection"** names the step; **"Pattern matching · v0.1"** names
  the engine. Shipping the model changes one string, not the section.
- Say *"Automatic hiding is off today"*, never *"KCMS never acts by itself"* —
  a forever-claim that breaks the day controlled auto-hide ships.
- No invented pricing tiers, metrics, testimonials, or accuracy claims.

## Backend

The API lives at https://kcms-backend.onrender.com and is CORS-allowed for this
origin. **The two are not yet connected** — the landing page is static and the
moderation work list is the next slice.

## Deployment

Vercel. `vercel deploy --prod` publishes; pushing to `main` auto-deploys.
Framework Vite, output `dist`.

## Not yet built

`/request-access` · `/sign-in` · `/contact` · `/privacy` are navigation targets
for later slices and currently **404**. Moderation work list, comment review,
Page connection, team, settings and platform administration are all pending.
