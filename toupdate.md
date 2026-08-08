# E-Hatid — Manual To-Do List (no domain yet)

Everything here must be updated **by hand** once you buy a domain / before or right
after launching. The app code has placeholders pointing at `https://ehatid.vercel.app`.

> How to find every placeholder: search the repo for `ehatid.vercel.app`.

---

## A. Domain & site URL (do when you buy the domain)

- [ ] **`src/config/seo.ts`** — replace the `SITE_URL` value (line 2, has a `// TODO`):
      `'https://ehatid.vercel.app'` → `'https://<yourdomain.com>'`.
      This is the single source of truth — canonical URLs, OG image, and the generated
      sitemap all derive from it.
- [ ] **`index.html`** — hardcoded URLs, edit by hand:
  - `<link rel="canonical" href="https://ehatid.vercel.app/">` (line 11)
  - `og:url` (line 17), `og:image` (line 18), `twitter:image` (line 22)
  - JSON-LD `Organization` `url` and `logo` (lines 29–30)
- [ ] **`public/robots.txt`** — last line `Sitemap: https://ehatid.vercel.app/sitemap.xml`
      → change to your domain.
- [ ] **Rebuild after changing `SITE_URL`**: `npm run build` regenerates
      `dist/sitemap.xml` with the new domain (see `sitemapPlugin.ts`). Redeploy.
- [ ] **`src/config/seo.ts`** — remove the `// TODO` comment once real.

---

## B. Launch on Vercel (no domain needed — deploy now)

- [ ] Create a Vercel project from this repo (framework: Vite/React).
- [ ] Add environment variables (copy from `.env`):
      `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
      `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
      `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`,
      `VITE_ADMIN_EMAIL`.
- [ ] Deploy. Build works on Node 20 (a warning about `@capacitor/cli` needing
      Node ≥22 is harmless); set Node 22 in Vercel if you want it quiet.
- [ ] Verify `/robots.txt`, `/sitemap.xml`, `/manifest.json`, `/favicon.png`, and the
      `/Logo/*` SVGs are served (not rewritten to `index.html` — Vercel serves real
      files before catch-all rewrites).
- [ ] Once you buy a domain: attach it in Vercel → Settings → Domains, then do section A.

---

## C. Branding / assets

- [ ] **OG image**: `DEFAULT_OG_IMAGE` in `src/config/seo.ts` and the `og:image` /
      `twitter:image` tags in `index.html` point to `/favicon.png` as a placeholder.
      Create a real **1200×630** branded OG image, put it in `public/`, update the paths.
- [ ] (Optional) **PWA icon**: `public/Logo/Logo-light-mode.png` (1.4 MB) is used by
      `manifest.json` as the 512×512 maskable icon. Compress it or export a lean PNG
      for faster installs.
- [ ] Your real logo SVGs (`public/Logo/*.svg`) are already in place — nothing to do. ✓

---

## D. Search engines (do after first deploy)

- [ ] Add the site to **Google Search Console**, verify ownership, and submit
      `https://<yourdomain>/sitemap.xml`.
- [ ] Add to **Bing Webmaster Tools** (imports from GSC).
- [ ] Check GSC → Coverage periodically for crawl errors.
- [ ] Create a **Google Business Profile** (food delivery service) — see
      `SEO/LINK_BUILDING.md`.

---

## E. Firebase config sync

- [ ] Keep `VITE_ADMIN_EMAIL` in `.env` **in sync** with the `isMasterAdmin()` email
      (`admin@ehatid.com`) in `firestore.rules`. If you change one, change both.
- [ ] In Firebase Console, confirm the enabled sign-in methods / APIs the app uses
      (email + password, OTP via Cloud Functions, Firestore, Storage) for the
      production Firebase project.
- [ ] **Publish the updated `storage.rules`** to the production Firebase project
      (Rules → Storage → firebase storage rules → Publish). The new `isAdmin()`
      override is required for the image migration button to write to vendors'
      stall/avatar paths.
- [ ] **Run the image migration once**, in production, after deploying: Admin →
      Admin Dashboard → "Migrate Legacy Images" → **Run Migration**. This moves
      existing base64 photos out of Firestore into Storage (idempotent — safe to
      re-run; it skips anything already migrated).

---

## F. Before publishing a mobile app (Capacitor)

- [ ] **`capacitor.config.ts`** still uses `appId: 'com.riderapp.app'` and
      `appName: 'RiderApp'` — rename to something E-Hatid-branded (e.g.
      `com.ehatid.app` / `E-Hatid`) before building store releases.
- [ ] **`capacitor.config.ts` `webDir`** now points to `'dist'` (fixed ✓) — do not
      change it back to `build/`; the `build/` folder at the repo root is a stale
      leftover and should be deleted before releasing.

---

## G. Content SEO (see `SEO/` docs for details)

- [ ] Start the 90-day content calendar (`SEO/CONTENT_PLAN.md`) — `/blog` + `/help`
      routes, Article JSON-LD.
- [ ] Begin link building (`SEO/LINK_BUILDING.md`): GSC, directories, partner stalls.

---

## Quick checklist before final launch

- [ ] `SITE_URL` updated + rebuilt (section A)
- [ ] Env vars set in Vercel (section B)
- [ ] Real OG image in place (section C)
- [ ] Sitemap submitted to GSC (section D)
- [ ] Admin email in sync (section E)
- [ ] Capacitor appId/appName renamed (section F)
