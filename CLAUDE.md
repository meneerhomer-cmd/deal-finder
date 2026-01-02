# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ionic/Angular mobile app for browsing Belgian supermarket promotions. Requires the `deal-finder-api` Quarkus backend running at `http://localhost:8080`.

## Commands

```bash
# Install dependencies
npm install

# Development server (use either)
ionic serve
ng serve

# Production build
ionic build --prod

# Mobile builds
ionic capacitor build android
ionic capacitor build ios

# Run tests
ng test
```

## Architecture

This is an Angular 17 app using standalone components and signals for reactive state management.

### State Management Pattern

`DealService` (`src/app/services/deal.service.ts`) is the central state manager using Angular signals:
- `deals`, `retailers`, `loading`, `error`, `filters` - reactive state signals
- `filteredDeals` - computed signal that applies all active filters
- HTTP calls via RxJS update signals via `tap()` operators

### Routing

Tab-based navigation defined in `app.routes.ts` with lazy-loaded pages:
- `/home` - Overview page
- `/deals` - All deals with filtering
- `/retailers` - Retailer list
- `/retailer/:slug` - Retailer-specific deals (reuses DealsPage)

### Models

`src/app/models/deal.model.ts` contains:
- `Deal`, `Retailer`, `ScanStatus` interfaces matching backend API
- `PromoKind` type: `'MULTI_BUY' | 'PERCENTAGE' | 'FIXED_PRICE' | 'PRICE_DROP'`
- `CATEGORIES` constant with Dutch category names and emojis

### API Integration

Backend endpoints (prefixed with `environment.apiUrl`):
- `GET /deals` - All active deals
- `GET /deals/retailer/{slug}` - Deals by retailer
- `GET /retailers` - All retailers with deal counts
- `GET /admin/status` - Scan status
- `POST /admin/scan` - Trigger scan

## Tech Stack

- Angular 17 (standalone components, signals)
- Ionic 7
- SCSS for styling
- Path alias: `@env` → `src/environments`
