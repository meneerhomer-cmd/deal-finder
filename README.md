# Deal Finder App

Ionic/Angular mobile app for browsing Belgian supermarket promotions. Frontend for the [deal-finder-api](https://github.com/meneerhomer-cmd/deal-finder-api) Quarkus backend.

## Features

- **Browse deals** — filter by retailer, category, promo type, min discount
- **Search** — find deals by product name or brand
- **Sort** — cycle through discount/price/expiry/name
- **Deal detail** — full price info, price history timeline, share button
- **Shopping list** — add deals, mark purchased, swipe to delete, toast feedback
- **Expiring deals** — "Bijna verlopen!" section + badge on deal cards
- **Retailers** — sorted by deal count, branded colors
- **Home dashboard** — stats row, top 5 deals, expiring deals, recent deals
- **Dark mode** — full support via CSS custom properties
- **Dutch locale** — all UI text and date formatting in Dutch (nl-BE)

## Tech Stack

- **Framework**: Angular 17 (standalone components, signals)
- **Mobile**: Ionic 7
- **Language**: TypeScript 5.4
- **State**: Angular signals + computed signals
- **HTTP**: RxJS + HttpClient
- **Styling**: SCSS with Ionic theming

## Prerequisites

- Node.js 18+
- Ionic CLI: `npm install -g @ionic/cli`
- Backend running at `http://localhost:8080` ([deal-finder-api](https://github.com/meneerhomer-cmd/deal-finder-api))

## Getting Started

```bash
npm install
ionic serve       # Dev server at http://localhost:8100
```

## Project Structure

```
src/app/
  components/
    deal-card/             — Deal card with emoji, discount badge, expiry indicator
  models/
    deal.model.ts          — Interfaces (Deal, Retailer, Category, ScanStatus)
  pages/
    home/                  — Dashboard: stats, top deals, expiring, recent
    deals/                 — All deals with filters, search, sort (also /retailer/:slug)
    deal-detail/           — Full deal view, price history, shopping list, share
    retailers/             — Retailer list sorted by deal count
    shopping-list/         — Active/purchased tabs, swipe-delete
  services/
    deal.service.ts        — Deal state (signals), HTTP calls, filters
    shopping-list.service.ts — Shopping list state, session management, toasts
  app.component.ts         — Root with 4-tab bar (Home/Deals/Winkels/Lijst)
  app.routes.ts            — Lazy-loaded routes with 404 fallback
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/home` | Home | Stats, top deals, expiring, recent |
| `/deals` | Deals | Full list + search + filter modal + sort |
| `/retailers` | Retailers | Sorted list with deal counts |
| `/retailer/:slug` | Deals (filtered) | Reuses deals page for one retailer |
| `/deal/:id` | Deal Detail | Prices, history, add-to-list, share |
| `/shopping-list` | Shopping List | Active/purchased, swipe-delete |

## API Integration

Connects to `deal-finder-api` at `environment.apiUrl` (default `http://localhost:8080/api/v1`).

Key endpoints used:
- `GET /deals` — all deals with filters
- `GET /deals/retailer/{slug}` — per retailer
- `GET /deals/{id}/price-history` — price timeline
- `GET /retailers` — all retailers with deal counts
- `GET /admin/status` — scan status
- `POST /admin/scrape` — trigger scan
- `GET/POST/DELETE/PATCH /shopping-list/*` — shopping list CRUD

## Build

```bash
ionic build --prod              # Production build
ionic capacitor build android   # Android (requires Capacitor setup)
ionic capacitor build ios       # iOS (requires Capacitor setup)
```

## License

MIT
