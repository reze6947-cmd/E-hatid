# E-Hatid — Keyword Strategy

Where each target keyword lives in the app and how to use it for on-page SEO.
Everything below is already implemented in the codebase unless marked **TODO**.

## Primary keywords (money terms)

| Keyword | Intent | Target page | Placement (done?) |
|---|---|---|---|
| food delivery Philippines | Transactional/Informational | Landing (`/`), Guest Home (`/guest/home`) | Title, h1 ("Food delivery from local stalls…"), meta description, JSON-LD `WebSite` ✓ |
| food delivery near me | Local transactional | Guest Home, Stall pages | Landing subheadline "Order online food delivery near you…" ✓; **TODO** add to Guest Home title when logged-out SEO is finalized |
| order food online | Transactional | Guest Home, Stall pages | Landing h2 "Eat, Sell & Deliver…" ✓; feature copy ✓ |
| food stalls near me | Local | Guest Home, Stall pages | Feature copy ✓, keywords meta ✓ |
| online food ordering Philippines | Informational | Landing | Keywords meta ✓ |

## Secondary / audience keywords

| Keyword | Intent | Target page | Placement (done?) |
|---|---|---|---|
| become a delivery rider | Transactional | Landing (Deliver feature), Apply Rider | Feature copy "Earn as a delivery rider…" ✓; FAQ "Can I earn as a delivery rider with E-Hatid?" ✓ |
| open a food stall online | Transactional | Landing (Sell feature), Apply Vendor | Feature copy "Open your own food stall online…" ✓; FAQ "Can I open my own food stall on E-Hatid?" ✓ |
| local food delivery | Local | Landing, Stall pages | SITE_DESCRIPTION ✓, keywords ✓ |
| restaurant delivery | Generic | Landing | Keywords meta ✓ |

## Long-tail / FAQ keywords (question-based)

Covered by the Landing FAQ block + `FAQPage` JSON-LD ✓:
- "How does food delivery work?"
- "How do I find food delivery near me?"
- "How much does food delivery cost?"

## Rules of thumb

1. **One topic per page.** `/stall/:id/menu` pages target `<Stall Name> + "food delivery"` and `<dish>`. Do not stuff national keywords onto stall pages.
2. **Use natural phrasing** — write for humans; keywords in meta/copy, never keyword-stuffed.
3. **Keep `SITE_URL` in `src/config/seo.ts` in sync** with the production domain once deployed — everything (canonicals, OG image, sitemap, JSON-LD) derives from it.
4. **Re-verify keyword placement** every time landing copy is rewritten (see `LANDING_COPY.md`).
