<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Deal Finder Angular/Ionic app. A `PosthogService` singleton wraps the PostHog JS SDK with SSR-safe browser guards. PostHog is initialized in the root `AppComponent` using credentials from `environment.ts`. User identification is hooked into Firebase's `onAuthStateChanged` callback so every Google sign-in automatically calls `posthog.identify()` with the Firebase UID, and `posthog.reset()` is called on sign-out. Thirteen business events are tracked across six files, covering the full deal discovery → shopping list → purchase flow.

> **Note:** Run `npm install` in `~/IdeaProjects/deal-finder-app` to install `posthog-js` (added to `package.json`).

| Event | Description | File |
|-------|-------------|------|
| `user_signed_in` | User signs in with Google | `src/app/services/auth.service.ts` |
| `user_signed_out` | User signs out | `src/app/services/auth.service.ts` |
| `deal_viewed` | User opens the detail page of a deal | `src/app/pages/deal-detail/deal-detail.page.ts` |
| `deal_added_to_shopping_list` | User adds a deal to their shopping list | `src/app/pages/deal-detail/deal-detail.page.ts` |
| `deal_shared` | User shares a deal via native share or clipboard | `src/app/pages/deal-detail/deal-detail.page.ts` |
| `search_performed` | User performs a cross-retailer product search | `src/app/pages/search/search.page.ts` |
| `filter_applied` | User applies a discount or category filter | `src/app/pages/deals/deals.page.ts` |
| `deal_mode_switched` | User switches between food and non-food mode | `src/app/pages/deals/deals.page.ts` |
| `flyer_opened` | User opens the weekly flyer for a retailer | `src/app/pages/deals/deals.page.ts` |
| `watchlist_item_added` | User adds a product to their watchlist | `src/app/pages/watchlist/watchlist.page.ts` |
| `watchlist_item_removed` | User removes a product from their watchlist | `src/app/pages/watchlist/watchlist.page.ts` |
| `shopping_list_item_purchased` | User marks a shopping list item as purchased | `src/app/pages/shopping-list/shopping-list.page.ts` |
| `optimizer_viewed` | User views the smart shopping route with results | `src/app/pages/optimizer/optimizer.page.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/686988)
- [Deal engagement funnel](/insights/oOtpoYcf) — Conversion from deal view → add to shopping list
- [Key events over time](/insights/lcGddhJS) — Daily deal views and searches
- [Shopping list & optimizer usage](/insights/Ds7s0FgL) — Items purchased and optimizer views
- [Watchlist engagement](/insights/FCyAbYpV) — Watchlist adds vs removes
- [User sign-ins](/insights/EOScnYin) — Sign-in and sign-out trends

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-angular/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
