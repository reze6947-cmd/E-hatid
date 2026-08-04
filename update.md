# E-Hatid — Project Update

## Summary (For Everyone)

E-Hatid is a food-and-rides delivery app where you can switch between being a **Customer**, a **Rider**, or a **Vendor** — all in one account. The latest work focused on making the app feel natural on **phones, tablets, and iPads**, improving how delivery **addresses** are confirmed, and polishing the daily experience for riders and vendors.

### What's New Recently

- **Tablets & iPads now work like phones.** On smaller screens (including all iPads), navigation uses a bottom tab bar instead of a desktop top menu. The layout adapts so nothing gets hidden or overlaps.
- **Role switching moved to your Profile.** If you have more than one role, you switch roles from the **Profile** page (or the role menu in the desktop top bar on large screens). No more overlap issues on tablets.
- **Addresses are confirmed with a map pin, not just text.** When you order, you place a pin on a map. The app checks that your typed address matches where the pin is, so riders always know exactly where to go.
  - Vague addresses (just a village or neighborhood) are fine — we just add a friendly note.
  - Very specific addresses (house number) must match the pin closely; otherwise we ask you to fix it before continuing.
- **Better address details.** You now enter your house/unit number, street or subdivision, and a landmark separately — then they're combined into one clean address.
- **Easier map picking.** You can **drag the pin** or tap the map to set your exact spot. Selecting a suggestion from the search bar moves the pin closer to it for fine-tuning.
- **Riders get a cleaner full-screen map.** The full-screen map on the delivery page has a simple close button, works with the Escape key, and respects the phone's notch (safe area).
- **Safe ordering.** Double-checking a review no longer submits it twice. A small "Review submitted" confirmation shows when it's done.

### In Progress

- Final polish of the tablet layout and role-switch placement (wrapping up now).

---

## Technical Notes (For Developers)

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
- `npx tsc --noEmit` and `npm run build` pass.
