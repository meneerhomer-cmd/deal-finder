# Deal Finder App

A savings-first shopping advisor for Belgian supermarket promotions — built as an Ionic/Angular app, shipped to the web (PWA) and as a native Android app. Frontend for the [deal-finder-api](https://github.com/meneerhomer-cmd/deal-finder-api) Quarkus backend.

> **Live:** https://promo-finder-be.web.app

## Features

**Discovery**
- Browse & filter deals by retailer, category, promo type, min discount; search by product/brand; sort by discount/price/expiry/name
- Infinite-scroll deal list (windowed render for smooth scrolling on large catalogs)
- Retailers, brands, and category browsing; flyer viewer

**Savings-first**
- **"Vandaag bespaar je het meest op …"** — a daily biggest-opportunity banner on home
- **Per-product page** (`/product/:fingerprint`) — the same product across retailers, sorted by price with a `GOEDKOOPST` badge
- **Cross-retailer banner** on a deal — "goedkoper elders" / "jij zit hier goedkoopst"
- **Substitute suggestion** — one cheaper same-style alternative when the per-unit gap is worth it
- **Per-unit price** (€/L, €/kg, €/wasbeurt, €/luier) and **per-category attributes** (ABV, Nutri-Score, wash count, …)
- Honest badges: `BESTE PRIJS`, `NOG X DAGEN`, cashback shown as `100% terugbetaald`
- Single-signal **price history** ("€1,87 gedaald sinds 5 mei"); **"Slimme Boodschappenroute"** optimizer with a one-stop ("alles bij één winkel") option

**Personal**
- Shopping list (add, mark purchased, swipe-delete) with a savings hero
- Watchlist + favorite brands (anonymous Firebase Auth — works without sign-in; Google sign-in syncs across devices)
- Push notifications (FCM) for watched products / favorite brands
- "Verkeerde match?" reporting on cross-retailer rows

**Feel**
- Retro Belgian-flyer design system (Anton / Newsreader / Space Mono, newsprint + red/yellow)
- Native haptics, instant launch (cached last data + skeletons), native page transitions

## Tech Stack

- **Framework**: Angular 17 (standalone components, signals)
- **Mobile UI**: Ionic 7
- **Native**: Capacitor 8 (iOS + Android), with **Capgo** OTA live updates
- **State**: Angular signals + computed
- **Auth/data**: Firebase (Anonymous + Google Auth, Firestore, Hosting, FCM)
- **Observability**: Sentry (`@sentry/capacitor` + `@sentry/angular`), PostHog (analytics + session replay)
- **Styling**: SCSS

## Prerequisites

- **Node.js 18+** for `ng serve` / web builds — but **Node ≥ 22** is required for any Capacitor / Capgo CLI command (use `nvm use 22`)
- Ionic CLI: `npm install -g @ionic/cli`
- Backend running at `http://localhost:8080` ([deal-finder-api](https://github.com/meneerhomer-cmd/deal-finder-api)) — or point `environment.ts` at the live API

## Getting Started

```bash
npm install
ionic serve       # Dev server at http://localhost:8100
```

## Project Structure

```
src/app/
  components/
    deal-card/                 — Retro deal card (sticker, badges, unit price, tags)
    category-attributes/       — Per-category attribute renderer (beer/cereal/…)
  models/
    deal.model.ts              — Deal/Product/Opportunity interfaces, categories, isFoodDeal
  pages/
    tabs/                      — Bottom tab bar (Home / Deals / Zoek / Meer)
    home/                      — Opportunity banner, retailer rail, deal carousels
    deals/                     — Filterable/sortable list (also /retailer/:slug)
    deal-detail/               — Hero, price, cross-retailer + substitute, attributes, pinned actions
    product/                   — Per-product cross-retailer comparison
    search/  brands/  categories/  retailers/
    watchlist/  shopping-list/  optimizer/  flyer-viewer/  more/  not-found/
  services/
    deal.service.ts            — Deal state (signals), HTTP, filters, OTA-friendly caching
    auth.service.ts  user-data.service.ts  shopping-list.service.ts
    push-notification.service.ts  haptics.service.ts  posthog.service.ts  alert.service.ts
  app.component.ts             — Root: PostHog init, ?ref= attribution, Capgo notifyAppReady
  app.routes.ts                — Lazy-loaded routes + 404 fallback
```

## Routes

| Route | Description |
|-------|-------------|
| `/home` `/deals` `/search` `/more` | Bottom-tab pages |
| `/retailer/:slug` | Deals filtered to one retailer (reuses Deals) |
| `/deal/:id` | Deal detail — price, cross-retailer, substitute, attributes |
| `/product/:fingerprint` | Per-product cross-retailer comparison |
| `/retailers` `/brands` `/categories` | Browsing |
| `/watchlist` `/shopping-list` `/optimizer` | Personal + Slimme Boodschappenroute |
| `/flyer/:shopSlug/:brochureId` | Flyer viewer |

## API Integration

Connects to `deal-finder-api` at `environment.apiUrl` (`http://localhost:8080/api/v1` dev, Cloud Run in prod). Key endpoints:

- `GET /deals` (filters + pagination), `/deals/{id}`, `/deals/{id}/price-history`, `/deals/{id}/substitute`, `POST /deals/{id}/wrong-match`, `/deals/retailer/{slug}`
- `GET /products`, `/products/{fingerprint}`, `/products/opportunity`
- `GET /search`, `POST /optimizer`
- `GET /retailers`, `/categories`, `/stats`
- `/shopping-list/*` CRUD, `/admin/*` (scrape/status/backfill)

## Build & Deploy

**Web (prod):**
```bash
nvm use 22 && SENTRY_AUTH_TOKEN=… npm run deploy:prod        # build + Sentry maps + Firebase Hosting
```

**Web + native together (keeps them in sync via Capgo OTA):**
```bash
nvm use 22 && SENTRY_AUTH_TOKEN=… npm run deploy:prod:ota    # deploy:prod + Capgo bundle upload
```
> Bump `version` in `package.json` before each OTA (each bundle needs a unique version).

**Native:**
```bash
nvm use 22 && npx cap sync android && npx cap open android   # then build/run in Android Studio
```
iOS needs full Xcode + an APNs key in Firebase. See `CLAUDE.md` for the full release/OTA workflow and gotchas.

## License

MIT
