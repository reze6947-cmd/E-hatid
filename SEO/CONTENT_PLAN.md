# E-Hatid — Content Marketing Plan

Purpose: generate organic search traffic, brand searches, and backlinks. The app is
a single-page experience today; content lives in two places we recommend adding:

## Proposed content infrastructure

1. **A `/blog` route** (new pages, no framework change — plain React routes like the
   rest of the app). Each post gets `Seo` + `Article` JSON-LD via `src/components/Seo.tsx`.
2. **Shared help/FAQ page** at `/help` — consolidate the Landing FAQ + support answers.

## Content calendar (first 90 days)

| Week | Topic | Keyword target | Format |
|---|---|---|---|
| 1 | "How much does food delivery cost in the Philippines?" | delivery fees Philippines | Guide + FAQ schema |
| 2 | "How to start a food stall online (and get customers fast)" | open a food stall online | Guide → internal link to `/apply/vendor` |
| 3 | "How to become a delivery rider: what you need to know" | become a delivery rider | Guide → internal link to `/apply/rider` |
| 4 | "Best food delivery apps in the Philippines compared" | food delivery apps Philippines | Comparison |
| 6 | "How to find food delivery near me on a budget" | food delivery near me | Listicle → internal links to stalls |
| 8 | Launch post: "E-Hatid launch: order from local stalls" | brand | Announcement (PR/distribution) |
| 10 | "How we keep delivery tracking live" | trust/technical | Behind-the-scenes → E-E-A-T |
| 12 | Monthly roundup: "New food stalls near you this month" | local freshness | Recurring series → stall pages |

## Distribution checklist (each post)

- [ ] Published with `Article` JSON-LD + Open Graph image.
- [ ] Shared to FB page, Instagram, LinkedIn, community groups.
- [ ] 1–2 outreach pitches to PH food/finance blogs for citation (link building).
- [ ] Internal links added to/from relevant app pages.

## Repurposing

- FAQ answers (from Landing) → seed the `/help` page.
- Best-performing posts → pin on social, feed into Google Business Profile posts.

## Success metrics (review monthly)

- Organic sessions (GSC) — target growth after 90 days.
- Indexed pages = sitemap URLs + blog posts; verify in GSC → Pages.
- Keyword rankings for the primary list in `KEYWORDS.md`.
- Referring domains from `LINK_BUILDING.md`.
