# E-Hatid — Project Update

## Summary (For Everyone)

E-Hatid is a food-and-rides delivery app where you can switch between being a **Customer**, a **Rider**, or a **Vendor** — all in one account. The latest work focused on making the app feel natural on **phones, tablets, and iPads**, improving how delivery **addresses** are confirmed, and polishing the daily experience for riders and vendors. The most recent round added **profile photo cropping**, a **rider's picture on live order tracking**, smoother **role switching**, and a full **performance + SEO overhaul** (Phases 0–3).

### What's New Recently

- **Profile photos are cropped automatically.** Uploading a profile picture (customer or rider) now crops it to a perfect square, so avatars look clean everywhere.
- **See who's delivering your order.** Live order tracking now shows the rider's photo and a tap-to-call button, so you always know who's on the way.
- **Role switching goes straight to the right screen.** Changing roles does a quick refresh and lands you on that role's home screen — no confusion about where you ended up.
- **The app is much faster.** Images load lazily, the JS bundle is split so only the code you need loads first, logos are lightweight SVGs, and caching/security headers are configured for the host.
- **Search engines can now find every stall.** Every page has a proper title and description, stall pages have rich search markup (`Restaurant` + FAQ schema), private areas are blocked from indexing, a `robots.txt` exists, and a `sitemap.xml` is generated at build time with every stall's URL.
- **A keyword-rich FAQ on the landing page** targets real user questions and can show up as rich results.
- *(From the previous round:)* **Tablets & iPads now work like phones.** On smaller screens (including all iPads), navigation uses a bottom tab bar instead of a desktop top menu. The layout adapts so nothing gets hidden or overlaps.
- **Role switching moved to your Profile.** If you have more than one role, you switch roles from the **Profile** page (or the role menu in the desktop top bar on large screens). No more overlap issues on tablets.
- **Addresses are confirmed with a map pin, not just text.** When you order, you place a pin on a map. The app checks that your typed address matches where the pin is, so riders always know exactly where to go.
  - Vague addresses (just a village or neighborhood) are fine — we just add a friendly note.
  - Very specific addresses (house number) must match the pin closely; otherwise we ask you to fix it before continuing.
- **Better address details.** You now enter your house/unit number, street or subdivision, and a landmark separately — then they're combined into one clean address.
- **Easier map picking.** You can **drag the pin** or tap the map to set your exact spot. Selecting a suggestion from the search bar moves the pin closer to it for fine-tuning.
- **Riders get a cleaner full-screen map.** The full-screen map on the delivery page has a simple close button, works with the Escape key, and respects the phone's notch (safe area).
- **Safe ordering.** Double-checking a review no longer submits it twice. A small "Review submitted" confirmation shows when it's done.

### In Progress

- Launch prep — deploy to Vercel, wire up the domain and SEO placeholders. See **`toupdate.md`** for the manual checklist.

---

## Technical Notes (For Developers)

### Phase 4 — Image Storage Migration (base64 → Firebase Storage)

**Problem:** Stall covers, logos, product photos, and avatars were stored as base64 data URLs inside Firestore docs (huge doc sizes, un-cacheable, invisible to crawlers).

**Fix — upload at write time:**
- `src/services/imageStorage.ts` — `dataUrlToBlob`, `uploadImageDataUrl` (uploadBytes + getDownloadURL), `persistImage` (uploads only base64, passes through http/gs:///empty). Extension derived from MIME.
- Wired into every image write path:
  - `ProductEditorModal.tsx` — cropped product image uploaded to `stalls/<stallId>/menu/<timestamp>` before `onSave` (button shows "Uploading…" while busy; upload failure surfaces an inline error instead of saving a dead base64 blob).
  - `VendorProfile.tsx` — cover + logo uploaded to `stalls/<uid>/cover` and `/logo` in `handleSave`.
  - `customer/Profile.tsx` + `Rider/Profile.tsx` — avatar uploaded to `avatars/<uid>/avatar` on crop apply.

**Legacy data migration:**
- `stallService.ts` — `migrateStallImages(stall)` (cover/logo/menu items, idempotent) + `saveMigratedStall(stall)`.
- `userService.ts` — `migrateUserAvatar(user)`.
- `pages/admin/Dashboard.tsx` — "Migrate Legacy Images" card with a **Run Migration** button that scans all stalls + users and rewrites docs to Storage URLs. Requires the admin exception below.

**Storage rules (`storage.rules`):**
- Added `isAdmin()` helper (checks `users/<uid>.roles` via `firestore.get`).
- `/avatars/{userId}` and `/stalls/{vendorId}` writes now allow `request.auth.uid == <owner> || isAdmin()` (admin migration writes to other owners' paths). Size/content-type checks unchanged.

**Backward compat:** `OptimizedImage` passes `src` straight through, so already-stored base64 images still render until the admin runs the migration.

### Rules & Indexes Audit (paste into Firebase manually)
- `firestore.rules` audited against real client/function usage:
  - **Fixed a gap:** `Rider/Delivery.tsx` used to read the customer's `users/{uid}` doc, which the (correct) owner-or-admin read rule blocks. It now renders `order.customerName` / `order.customerPhone` / `order.deliveryAddress` (already snapshot onto the order at creation in `customer/Cart.tsx`) — no cross-user read.
  - **Tightened `applications` read** → owner-or-admin (was any authenticated user, exposing other applicants' data). No client reads applications directly today.
  - **Tightened `notifications` create** → only notifications addressed to yourself (was open spam vector; Firestore notifications are unused by the client — in-memory `NotificationService` is used).
- `storage.rules` — Phase 4 admin overrides (`isAdmin()` via Firestore lookup) on `/avatars` + `/stalls`.
- `firestore.indexes.json` — required composite indexes are the four `otp_requests` ones used by Cloud Functions. Others (orders/stalls/reviews/notifications/messages) are optional future-proofing; the app sorts client-side.
- Firebase Console has no paste for indexes JSON — create them by hand (list is in `toupdate.md` §E).

### Blog & Help Content (SEO pillar pages)
- `src/config/faq.ts` — shared FAQ list (imported by Landing, Help page, FAQ JSON-LD).
- `src/content/blogPosts.ts` — 3 posts ("How much does delivery cost in the Philippines?", "How to start a food stall online", "How to become a delivery rider").
- `src/pages/Blog/BlogIndex.tsx`, `src/pages/Blog/BlogPost.tsx` (per-post `BlogPosting` JSON-LD + canonical), `src/pages/Help.tsx` (`FAQPage` JSON-LD + support CTA).
- Routes `/blog`, `/blog/:slug`, `/help` in `App.tsx`; `AppFooter` quick links (Help & FAQ, Blog); sitemap staticRoutes include `/blog` and `/help`.

### Profile Photo Crop (crop-on-upload)
- Shared helpers in `src/utils/image.ts` (`readImageAsDataURL`, `createImageBitmapFromDataUrl`, `cropImageToSquare`, `fileToDataUrl`, `dataUrlToBlob`).
- Lazy-loaded `ImageCropper` modal (`src/components/ImageCropper.tsx`), 512×512 square output, applied on customer (`src/pages/customer/Profile.tsx`) and rider (`src/pages/Rider/Profile.tsx`) avatar uploads. Vendor imports moved off `products/utils.ts` for image helpers.

### Rider Picture on Order Tracking
- `riderAvatar?: string` added to `Order` (`src/types/index.ts`).
- Written on accept in `src/pages/Rider/Orders.tsx` (`riderAvatar: user.avatar`).
- `src/pages/customer/OrderTracking.tsx` rider card shows the avatar (person-icon fallback) + a `tel:` call link.

### Role Switching (full-page reload)
- `switchRole(role)` in `src/context/AuthContext.tsx`: guards roles → `setActiveRole` → `window.location.assign(target)` hard reload to `getRoleRedirect(user, role) || roleHomePaths[role] || /<role>/home`.
- Wired into `RoleSwitcher.tsx`, `customer/Profile.tsx`, `Rider/Profile.tsx`, `vendor/VendorProfile.tsx`, `Auth/RoleSelection.tsx` (which dropped `getRoleRedirect`/`user` usage, kept the single-role auto-redirect effect).

### Performance & SEO Overhaul (Phases 0–3)

**Phase 0 — Performance**
- `src/components/OptimizedImage.tsx`: lazy `loading`, async `decoding`, `fetchPriority="high"` when `priority`, aspect-ratio boxes, returns `null` when no `src`. Applied across stall/product/order/profile imagery.
- Lightweight SVG logos under `public/Logo/` (user's real design) referenced from Navbar, AppFooter, Landing, LogoHeader.
- `vite.config.ts` `manualChunks`: `firebase`, `leaflet`, `animations`, `ionic`, `react-vendor`. (Generic `vendor` catch-all removed to eliminate circular-chunk warnings.)
- `vercel.json`: SPA rewrite + cache headers (immutable `/assets`, no-cache HTML) + security headers (HSTS, nosniff, X-Frame-Options, Permissions-Policy).

**Phase 1 — On-page SEO**
- `react-helmet-async@3.0.0` (React 19-compatible); `HelmetProvider` in `src/main.tsx`.
- `src/config/seo.ts` — `SITE_NAME`, `SITE_URL` (placeholder `https://ehatid.vercel.app`, **see `toupdate.md`**), `SITE_DESCRIPTION`, `SITE_KEYWORDS`, `DEFAULT_OG_IMAGE`.
- `src/components/Seo.tsx` — Helmet wrapper: title, description, keywords, canonical (`SITE_URL + path`), OG/Twitter, `noindex`, `jsonLd`.
- `RoleLayout.tsx` noindexes private prefixes (`/customer`, `/rider`, `/vendor`, `/admin`, auth/apply/guest-cart/guest-location).
- Landing: `WebSite` (SearchAction) + `Organization` + `FAQPage` JSON-LD, keyword-led h1, h2/h3 hierarchy.
- `customer/Home.tsx`: indexable `/guest/home` when logged out, noindex when logged in.
- `StallDetail.tsx`: per-stall title/description/canonical `/stall/:id/menu` + `Restaurant` JSON-LD (name, image, servesCuisine, address, geo, aggregateRating from live review stats).
- `index.html`: default meta description, canonical, OG/Twitter, Organization JSON-LD (all hardcoded → `toupdate.md`).

**Phase 2 — Technical SEO**
- `public/robots.txt`: allows public routes, disallows private areas, points to sitemap.
- `sitemapPlugin.ts` (Vite `closeBundle`): writes `dist/sitemap.xml` with static routes + live stall URLs fetched from Firestore REST (paginated, best-effort). `SITE_URL` imported from `seo.ts`.

**Phase 3 — Content SEO**
- Landing FAQ block (accessible `<details>`) + matching `FAQPage` JSON-LD; keyword-targeted feature copy and hero subheadline.
- `SEO/KEYWORDS.md`, `SEO/LANDING_COPY.md`, `SEO/LINK_BUILDING.md`, `SEO/CONTENT_PLAN.md`.

### Navigation & Breakpoints (tablet-first)
- **Breakpoint changed from `md` to `xl`** for the responsive shell:
  - Desktop top header: `hidden md:block` → `hidden xl:block` (`src/components/Navbar.tsx:88`).
  - Mobile bottom tab bar: `md:hidden` → `xl:hidden` (`src/components/Navbar.tsx:171`).
  - `RoleLayout` content padding: `pb-24 md:pb-0` → `pb-24 xl:pb-0` (`src/layouts/RoleLayout.tsx`).
- This makes phones **and tablets/iPads** (768–1279px) use the bottom tab bar, so the desktop header no longer renders there — fixing the vendor role-switcher overlap on tablets.

### Role Switching
- `RoleSwitcher` (`src/components/RoleSwitcher.tsx`) is rendered only in the desktop header (`xl:`+); removed from the mobile bottom bar.
- Profile pages show a Switch Role card for multi-role users, visible below `xl`:
  - `src/pages/customer/Profile.tsx`, `src/pages/Rider/Profile.tsx`, `src/pages/vendor/VendorProfile.tsx` — Switch Role section + Sign Out changed `md:hidden` → `xl:hidden`.
- Dropped the now-unused `dropUp` prop from `RoleSwitcher`.

### Address Validation (pin-based)
- Source of truth = **pin coordinates** (`customerLatitude`/`customerLongitude`) stored on the order, not profile coords.
- `src/utils/geocode.ts`:
  - `geocodeAddress` returns a `GeocodeResult` with a `type` (`coarse` | `street` | `specific`) and `hasHouseNumber`.
  - `validatePinAgainstAddress` → `{ valid, distance?, geocodeFailed?, unverifiable? }`.
- Type-aware tolerances:
  - **Coarse** (village/neighborhood/city): never blocks; soft amber notice.
  - **Street**: 1,000 m tolerance.
  - **Specific** (house/building/number): 500 m block → user must adjust.
- `src/pages/customer/Cart.tsx`: `validating` interlock, `locationMismatch` banner with "Adjust location", amber `locationNotice` for geocode-failure/unverifiable cases.
- `src/pages/customer/LocationPicker.tsx`: split detail fields (House/Unit, Street/Subdivision, Landmark) combined on confirm; draggable pin (`dragend` → `handleLocationChange`); suggestion pick sets `suppressSuggestionsRef`, clears suggestions, and `focusZoom(16)`; `handleConfirm` reverse-geocodes the final pin before persisting.

### Rider Delivery Full-Screen Map
- `src/pages/Rider/Delivery.tsx`:
  - Safe-area top padding (`env(safe-area-inset-top)`), circular X close button, Escape-key close, Capacitor `backButton` handler while fullscreen.
  - Car icon fetched atomically at role switch.

### Deep Links
- `src/utils/geocode.ts` — `openGoogleMapsDirections(travelMode)` with 50 m origin≈destination fallback to `openGoogleMapsLocation`; `openGoogleMapsLocation`, `getStoredCoords`, `reverseGeocode` (Photon), `haversineKm`.
- **Rider "Start Navigation" forces `travelmode=two-wheeler`**; vendor/customer previews keep driving.

### Review Double-Submit Guard
- `orderId` on `Review` type, `hasReviewedOrder`, `ReviewModal` guard, "Review submitted ✓" state — prevents duplicate reviews.

### Constraints (Do Not Change)
- **Free services only**: Nominatim/Photon geocoding, OSRM routing (no paid Google APIs). Keep 1 req/s throttle + User-Agent.
- Do not modify OSRM routing/pricing, Firestore schema, or backend logic.
- Ignore/invalidate `deliveryAddress === 'Current Location'`.

### Verified
- `npx tsc --noEmit`, `npm run lint` (0 errors; 16 pre-existing react-hooks/react-refresh warnings) and `npm run build` pass. Build regenerates `dist/sitemap.xml` with static + live stall URLs and copies `robots.txt`.
- Manual launch checklist: **`toupdate.md`**. SEO strategy docs: `SEO/`.
