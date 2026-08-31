# Part 1 — Page connection request and review

## Why this slice

The dashboard already tells a sandbox workspace to "Request Page connection".
That control currently leads to a static notice. The product makes a promise it
does not keep, and this slice keeps it.

It also creates the first Platform Administrator screen, an area where nothing
exists today.

## Job to be done

- **Client:** "I have tried the demo. I want KCMS on my real Facebook Page."
- **Platform Administrator:** "Who is asking, are they plausible, and should I
  let them connect?"

## Screen 1 — Request Page connection (Client)

Route `/app/connect`, inside the dashboard shell. Reached from the sandbox banner.

```
┌──────────────┬──────────────────────────────────────────────┐
│ Overview     │  ● Demo workspace · sample data              │
│ Moderate     ├──────────────────────────────────────────────┤
│ Page  ●      │  Connect a Facebook Page                     │
│ Team         │  KCMS is in a pilot. Connecting a real Page  │
│ Settings     │  needs approval from our team first.         │
│              │                                              │
│              │  Facebook Page name or URL      [__________] │
│              │  Comments per month             [ select   ] │
│              │  People who will moderate       [ select   ] │
│              │  Anything we should know?       [__________] │
│              │                            (optional)        │
│              │                                              │
│              │  [ Request connection ]                      │
└──────────────┴──────────────────────────────────────────────┘
```

**States**

| State | Shows |
|---|---|
| Idle | The form above |
| Invalid | Inline error per field, as on sign-up |
| Submitting | Button disabled, "Sending…" |
| Pending | "Request received. We will reply by email." with what was submitted |
| Approved | "Approved — you can now connect your Page", sandbox banner gone |
| Declined | The reason, and the form again so it can be resubmitted |

A workspace has at most one open request. Submitting again while one is pending
replaces it rather than queuing a second.

**Why these fields.** Volume and team size are what the Early access section
already promises to size a pilot around. Nothing else is asked, because anything
unused should not be collected.

## Screen 2 — Access requests (Platform Administrator)

Route `/admin/requests`. A separate shell from the client dashboard, so the two
audiences are never one mis-click apart.

```
┌───────────────────────────────────────────────────────────────┐
│ KCMS · Platform operations                    Signed in as … │
├───────────────────────────────────────────────────────────────┤
│ Access requests            [ Pending ] [ All ]                │
│                                                               │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Angkor Shop                                    PENDING    │ │
│ │ Dara Sok · dara@example.com                               │ │
│ │ Page: facebook.com/angkorshop                             │ │
│ │ ~10,000 comments/month · 3 moderators                     │ │
│ │ "We get a lot of scam replies on product posts."          │ │
│ │                                                           │ │
│ │ [ Approve ]  [ Decline ]                                  │ │
│ └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

Declining asks for a reason, which the client sees. Approving clears the
workspace's sandbox flag.

**What this screen must never show.** Customer comment content. The product
specification states that Platform Administrators cannot browse customer comments
through ordinary administration views, and this is the first view where that rule
becomes testable. Workspace name, requester identity, Page, volume and note are
in scope; comments are not, at any nesting level of the response.

## Accessibility

- Same inline validation contract as sign-up: error owned by its field,
  `aria-describedby`, `aria-invalid`, validated on blur.
- Decline reason is a required field with its own error, not a browser prompt.
- Status changes announce with `role="status"`; failures with `role="alert"`.
- Both screens bilingual, and the admin shell is bilingual too.

## Out of scope here

Meta OAuth and real Page token exchange. Approval lifts the sandbox restriction;
it does not itself connect anything. The actual connection remains blocked on
Meta App Review and is a later slice.
