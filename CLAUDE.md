# CLAUDE.md

## Project Overview

Ionic/Angular mobile app for browsing Belgian supermarket promotions. Requires the `deal-finder-api` Quarkus backend at `http://localhost:8080`.

## Tech Stack

- **Framework**: Angular 17 (standalone components, signals)
- **Mobile**: Ionic 7
- **Styling**: SCSS
- **Path aliases**: `@env` → `src/environments`, `@app` → `src/app` (defined but unused)

## Commands

```bash
npm install
ionic serve       # Dev server (port 8100)
ng serve          # Alternative
ionic build --prod
```

## Release & Deploy

| Target | Command | Notes |
|--------|---------|-------|
| **Web (prod)** | `npm run deploy:prod` | Builds prod + Sentry source maps + `firebase deploy` → https://promo-finder-be.web.app |
| **Web + App together** | `nvm use 22 && SENTRY_AUTH_TOKEN=… npm run deploy:prod:ota` | `deploy:prod` **+** Capgo OTA bundle upload. **Use this** so web and the native app stay in sync. Must run under node 22 (firebase-tools + Capgo CLI both installed there). |
| **OTA only** | `npm run capgo:upload` | Uploads current `www/browser` to the Capgo `production` channel |

**Before any OTA release:** bump `version` in `package.json` — each OTA bundle needs a unique version or the upload is rejected.

### Mobile (Capacitor + Capgo OTA)
- **Capacitor 8** wraps the Angular build. Native projects in `ios/` + `android/` (`appId: be.dealfinder.app`). Capacitor 8 uses Swift Package Manager (no CocoaPods).
- ⚠️ **Every `cap`/SDK/Capgo CLI command needs Node ≥ 22** — the repo's default node is 21, so prefix with `nvm use 22` (e.g. `. "$HOME/.nvm/nvm.sh" && nvm use 22 && npx cap sync android`).
- **Android build**: `npx cap open android` (needs Android Studio); APK at `android/app/build/outputs/apk/debug/app-debug.apk`. SDK installs to `~/Library/Android/sdk`.
- **Live updates (Capgo)**: `@capgo/capacitor-updater`, `autoUpdate: true`, `notifyAppReady()` in `app.component` (required or bundles roll back). App `be.dealfinder.app` registered; `production` channel is default + self-assign + android + emulator-allowed. CLI auth in `~/.capgo`.
  - **iOS OTA not enabled yet** — run `npx @capgo/cli channel set production --ios` + ship an iOS build (needs full Xcode; only Command Line Tools installed).
  - **Real devices need the plugin-APK installed once** (`adb install -r <apk>`); after that every release is OTA (no APK rebuild).
- Native splash/status-bar themed retro-red; haptics via `@capacitor/haptics` (`HapticsService`) — no-op on web.

## Architecture

```
src/app/
├── components/deal-card/     # Deal card with emoji, discount badge, prices
├── models/deal.model.ts      # Interfaces + 25 Dutch categories with emojis
├── pages/home/               # Welcome, retailer chips, top 5 deals
├── pages/deals/              # All deals + filter modal + search (also used for /retailer/:slug)
├── pages/retailers/          # Retailer list with branded colors + deal counts
├── services/deal.service.ts  # Central state via Angular signals + HTTP
├── app.component.ts          # Root with 3-tab bar (Home/Deals/Winkels)
└── app.routes.ts             # Flat routes, lazy-loaded
```

**State management**: `DealService` holds all state via signals (`deals`, `retailers`, `loading`, `error`, `filters`). `filteredDeals` is a computed signal applying all active filters.

**Routes**: `/home`, `/deals`, `/retailers`, `/retailer/:slug` (reuses DealsPage)

## Known Bugs (Deep Scan April 2026)

| # | Severity | Issue |
|---|----------|-------|
| 1 | **Critical** | Category mismatch — FE has 25 Dutch slugs, BE has 12 English. **All category filtering broken. Emojis never display.** |
| 2 | **High** | No deal detail page — cards are not tappable, dead-end UI |
| 3 | **High** | Tab nav doesn't use `ion-tabs` — component destroyed/recreated on tab switch (loses scroll, search, filters) |
| 4 | **Medium** | Dark mode incomplete — chips, filter backgrounds, retailer colors not adapted |
| 5 | **Medium** | Dates display in English (no Dutch locale registered) |
| 6 | **Medium** | `onSearch` uses `event.target.value` instead of Ionic `event.detail.value` |
| 7 | **Medium** | No sorting options (key feature for a deal app) |
| 8 | **Low** | `src/assets` dir missing but referenced in angular.json |
| 9 | **Low** | No 404/wildcard route |
| 10 | **Low** | Dead imports (settings icon, chevronForward, .skeleton-card CSS) |
| 11 | **Low** | Mixed `*ngIf` and `@if` control flow syntax |
| 12 | **Low** | Retailer colors duplicated in 4 places |

## Decisions

| Date | Decision | Why |
|------|----------|-----|
| Jan 2, 2026 | Angular 17 + Ionic 7 | Familiar stack, mobile-ready |
| Jan 2, 2026 | Signals over NgRx | Lightweight for simple app |
| Jan 2, 2026 | Single-file components | Fast iteration |
| Jan 2, 2026 | Dutch UI | Target audience is Flemish |

## TODO (Priority Order)

### Fix What's Broken (DONE — April 6, 2026)
- [x] Fix category mismatch — backend now uses Dutch slugs matching frontend
- [x] Register Dutch locale — `registerLocaleData(localeNl)` + `LOCALE_ID` in main.ts
- [x] Fix `onSearch` — uses `event.detail.value` (CustomEvent)
- [x] Add 404 route — wildcard redirects to home
- [x] Create `src/assets/` directory
- [x] Fix `loadDealsByRetailer` — clears error signal

### Core UX (DONE — April 6, 2026)
- [x] Add deal detail page — cards are tappable, navigate to `/deal/:id`
- [x] Add sorting options — cycle through discount/price/expiry/name
- [x] Implement shopping list UI — new "Lijst" tab, session-based, active/purchased tabs

### Polish (DONE — April 6, 2026)
- [x] Complete dark mode — all chip/badge/retailer colors adapt via CSS vars
- [x] Centralize retailer colors — single source of truth in variables.scss

### UX gaps closed May 17, 2026
- [x] Deal detail page redesign — single hero, retailer/deal-type tags, savings amount, info-grid
- [x] Persist food/non-food mode in localStorage (home, deals, categories)
- [x] Categories page food/non-food split
- [x] Filter zero-deal retailers
- [x] Shopping list savings hero + tap-through
- [x] Back navigation on inner pages (brands, categories, retailers, shopping-list, watchlist)
- [x] Folders banner on home

### Remaining
- [ ] Fix tab navigation — switch to proper `ion-tabs` for state preservation
- [ ] Add virtual scrolling for deal lists
- [ ] PWA icons (192x192, 512x512)
- [ ] Tests

## External Docs

Full project documentation: `~/Documents/Personal Projects/deal-finder/project.md`
