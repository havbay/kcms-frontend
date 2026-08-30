# KCMS V2 Frontend Design

**Status:** Approved for the landing-page header and hero on 2026-08-31.

## Direction

KCMS uses a calm, Khmer-first operational identity. The interface should feel
credible during repeated trust-and-safety work without resembling a generic AI
dashboard.

## Tokens

| Token | Value | Purpose |
|---|---|---|
| Rice Paper | `#F6F4ED` | Main background |
| Clean White | `#FFFFFF` | Focused content surfaces |
| Deep Ink | `#183033` | Text and structural marks |
| Mekong Teal | `#0B6B63` | Primary action and safe operational emphasis |
| Review Amber | `#C26A0A` | Human-review attention |
| Harm Red | `#B42318` | Harm and error states only |

Typography uses Manrope Variable for English and interface data and Noto Sans
Khmer Variable for Khmer. Khmer text receives a taller line height and must be
checked independently rather than treated as English text replacement.

The signature element is the paired-line Comment Pathway inspired by the rhythm
of krama weaving. It explains the true product sequence: incoming comment,
disclosed pattern matching, human review, and a human decision.

## Interaction Rules

- One dominant action per surface: Request access on the public landing page.
- Never imply that KCMS automatically hides comments in the prototype.
- Use color with text and shape; color is never the only status signal.
- Preserve visible keyboard focus, 44-pixel touch targets, reduced motion, and
  layout reflow without horizontal scrolling.
- Do not add fake customers, testimonials, accuracy claims, or analytics.
