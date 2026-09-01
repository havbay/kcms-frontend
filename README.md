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
       ─▶ Service overview      interactive preview; optional real video
       ─▶ How KCMS works        three handoffs, Page to human decision
       ─▶ Built for Khmer       institution complaint vs person-directed abuse
       ─▶ Human control         five guarantees, current scope
       ─▶ Early access          pilot card, no invented price tiers
       ─▶ FAQ                   automation, access, data and pricing
       ─▶ Footer
```

Every section is fully English/Khmer switchable.

The public-to-client onboarding flow is also implemented:

```
/request-access ──▶ public pilot request
                          │
/admin/requests ──▶ approve / decline + email delivery state
                          │
/setup/:token ────▶ invited owner chooses their own password
                          │
/app ───────────▶ authenticated client workspace
```

No password is emailed. When transactional email is not configured, the
Platform Administrator receives a copyable one-time setup URL instead.

Set `VITE_OVERVIEW_VIDEO_URL` to a public MP4/WebM URL to replace the overview
poster with native video controls. When it is unset, the page links to the real
interactive demo instead of rendering a broken or "coming soon" player.

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
origin. Authentication, isolated workspaces, overview, moderation, corrections,
public pilot requests, invitation setup, Page connection, team management,
settings, and request administration are connected to the backend contract.

The current local Page Connection screen offers **Continue with Facebook** as
the recommended flow and an advanced Page-token flow. Both converge on one
backend connection record; stored credentials never return to the frontend.

Moderation is a compact server-paginated table with search, severity, target,
surfacing-reason, review-status and sort controls. Rows summarize the source
post/caption and open a complete context panel. Leave/hide/unhide Actions and
label Corrections remain distinct controls.

The new pilot-onboarding changes are currently local and must not be described
as live until the approved branches are pushed and both deployments are checked.

## Deployment

Vercel. `vercel deploy --prod` publishes; pushing to `main` auto-deploys.
Framework Vite, output `dist`.

## Not yet built

Live Facebook verification and ingestion, provider-side hide/unhide, full
moderation history, workspace switching, Platform Administration beyond request
review, and the trained Khmer model.
`/contact` and `/privacy` still use the application's explanatory fallback.
