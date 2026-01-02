# Deal Finder App

Ionic/Angular mobile app for browsing Belgian supermarket promotions.

## Features

- 🏷️ Browse all multi-buy deals (1+1 gratis, 2+1 gratis, etc.)
- 🏪 Filter by retailer (Carrefour, Lidl, Delhaize, Colruyt, Aldi, Kruidvat)
- 🔍 Search by product name or brand
- 📊 Filter by category, promo type, or minimum discount
- 📱 Mobile-first design with Ionic

## Prerequisites

- Node.js 18+
- npm or yarn
- Ionic CLI: `npm install -g @ionic/cli`

## Setup

```bash
# Install dependencies
npm install

# Start development server
ionic serve

# Or with Angular CLI
ng serve
```

## Backend

This app requires the Quarkus backend running at `http://localhost:8080`.

See the `deal-finder-api` project.

## Build

```bash
# Production build
ionic build --prod

# Build for Android
ionic capacitor build android

# Build for iOS
ionic capacitor build ios
```

## Project Structure

```
src/app/
├── components/
│   └── deal-card/           # Deal card component
├── models/
│   └── deal.model.ts        # TypeScript interfaces
├── pages/
│   ├── home/                # Home page with overview
│   ├── deals/               # All deals with filters
│   └── retailers/           # Retailers list
├── services/
│   └── deal.service.ts      # API service with signals
├── app.component.ts         # Root component with tabs
└── app.routes.ts            # Routing config
```

## API Endpoints Used

- `GET /api/v1/deals` - All active deals
- `GET /api/v1/deals/retailer/{slug}` - Deals by retailer
- `GET /api/v1/retailers` - All retailers with deal counts
- `GET /api/v1/admin/status` - Scan status
- `POST /api/v1/admin/scan` - Trigger scan

## Tech Stack

- Angular 17 (standalone components, signals)
- Ionic 7
- TypeScript 5.4
- RxJS for HTTP calls
- SCSS for styling
