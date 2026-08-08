# E-Hatid — Landing Copy & On-page SEO

Current state of the Landing page (`src/pages/Guest/Landing.tsx`) and the copy that
targets our keyword strategy.

## Hero

- **Badge:** "Pin-point delivery, all over the Philippines" — brand tone, keep.
- **H1:** "Food delivery from local stalls, right to your door." — keyword-led, keep.
- **Subheadline:** "Order online food delivery near you from the best local stalls.
  Track every delivery live — from stall to your doorstep." — hits *food delivery near
  me*, *order food online*, *track delivery live*.

> Copywriting note: never swap the H1 for a CTA (e.g. "Get started") — the H1 is the
> single strongest ranking signal on the page. CTAs live in the buttons.

## Features ("Eat, Sell & Deliver with E-Hatid")

Each card targets one audience segment and one keyword group:

| Card | Copy | Targets |
|---|---|---|
| Eat | "Discover the best food stalls near you and order food delivery online in a few taps." | food delivery near me, order food online |
| Sell | "Open your own food stall online and reach hungry customers in your area." | open a food stall online |
| Deliver | "Earn as a delivery rider bringing orders to doorsteps, faster." | become a delivery rider |

## FAQ ("Food Delivery Questions, Answered")

Rendered with native `<details>` (accessible, no JS) and mirrored in `FAQPage`
JSON-LD so Google can surface the Q&As in rich results.

| Question | Intent covered |
|---|---|
| How does food delivery work with E-Hatid? | How-to / process |
| How do I find food delivery near me? | Local, high-volume |
| Can I open my own food stall on E-Hatid? | Vendor acquisition |
| Can I earn as a delivery rider with E-Hatid? | Rider acquisition |
| How much does food delivery cost? | Price transparency, E-E-A-T |

Guidelines for editing the FAQ:
- Every answer must be **true of the current app** (fees shown before checkout, live
  tracking, vendor/rider applications).
- Add new Q&As only for questions real users ask; each new Q must also be added to the
  `FAQPage` `@graph` in the same file.
- Never repeat the same keyword in every question.

## Footer tagline

"Made with care for Filipino communities." — keep; reinforces local identity for E-E-A-T.

## TODO before/after launch

- [ ] Once deployed, set the real domain in `src/config/seo.ts` (`SITE_URL`).
- [ ] Re-audit the page with the Lighthouse "SEO" category after any copy change.
- [ ] Track FAQ clicks via analytics; promote the 2 most-clicked Q&As into a future
      blog/help page (see `CONTENT_PLAN.md`).
