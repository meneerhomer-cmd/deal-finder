import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonSearchbar, IonChip, IonLabel, IonIcon, IonButton, IonButtons,
  IonModal, IonList, IonItem, IonRadio, IonRadioGroup,
  IonSpinner, IonBadge, IonBackButton, IonSegment, IonSegmentButton, IonSkeletonText,
  IonInfiniteScroll, IonInfiniteScrollContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { filter, close, checkmark, swapVertical, bookOutline } from 'ionicons/icons';
import { DealService } from '../../services/deal.service';
import { DealCardComponent } from '../../components/deal-card/deal-card.component';
import { CATEGORIES, FOOD_CATEGORIES, NON_FOOD_CATEGORIES, FOOD_SLUGS, isFoodDeal } from '../../models/deal.model';
import { PosthogService } from '../../services/posthog.service';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonSearchbar, IonChip, IonLabel, IonIcon, IonButton, IonButtons,
    IonModal, IonList, IonItem, IonRadio, IonRadioGroup,
    IonSpinner, IonBadge, IonBackButton, IonSegment, IonSegmentButton, IonSkeletonText,
    IonInfiniteScroll, IonInfiniteScrollContent,
    DealCardComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        @if (retailerSlug) {
          <ion-buttons slot="start">
            <ion-back-button defaultHref="/retailers"></ion-back-button>
          </ion-buttons>
        }
        <ion-title>{{ pageTitle }}</ion-title>
        <ion-buttons slot="end">
          @if (retailerSlug) {
            <ion-button (click)="openFlyer()">
              <ion-icon name="book-outline" slot="icon-only"></ion-icon>
            </ion-button>
          }
          <ion-button (click)="showFilterModal = true">
            <ion-icon name="filter" slot="icon-only"></ion-icon>
            @if (dealService.activeFiltersCount() > 0) {
              <ion-badge color="danger">
                {{ dealService.activeFiltersCount() }}
              </ion-badge>
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          placeholder="Zoek product of merk..."
          [debounce]="300"
          (ionInput)="onSearch($event)"
        ></ion-searchbar>
      </ion-toolbar>
      @if (!retailerSlug) {
        <div class="mode-toggle">
          <button class="mode-btn" [class.active]="dealMode() === 'food'" (click)="setMode('food')">Voeding</button>
          <button class="mode-btn" [class.active]="dealMode() === 'nonfood'" (click)="setMode('nonfood')">Non-food</button>
        </div>
      }
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Category quick-filter chips -->
      <div class="category-scroll">
        <button class="cat-chip" [class.active]="!dealService.filters().category"
                (click)="dealService.clearFilter('category')">Alles</button>
        @for (cat of topCategories(); track cat.slug) {
          <button class="cat-chip" [class.active]="dealService.filters().category === cat.slug"
                  (click)="dealService.setFilter('category', dealService.filters().category === cat.slug ? undefined : cat.slug)">
            {{ cat.emoji }} {{ cat.name }}
          </button>
        }
        <button class="cat-chip" (click)="showFilterModal = true">Meer...</button>
      </div>

      <div class="results-bar">
        <span class="results-count">{{ modeDeals().length }} {{ dealMode() === 'food' ? 'voedingsdeals' : 'non-food deals' }}</span>
        <ion-button fill="clear" size="small" (click)="cycleSort()">
          <ion-icon name="swap-vertical" slot="start"></ion-icon>
          {{ sortLabel() }}
        </ion-button>
      </div>

      @if (dealService.loading()) {
        <div class="skeleton-grid">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="skeleton-card">
              <ion-skeleton-text [animated]="true" style="aspect-ratio: 1; border-radius: 12px;"></ion-skeleton-text>
              <ion-skeleton-text [animated]="true" style="width: 60%; height: 12px; margin-top: 8px;"></ion-skeleton-text>
              <ion-skeleton-text [animated]="true" style="width: 40%; height: 16px; margin-top: 4px;"></ion-skeleton-text>
            </div>
          }
        </div>
      } @else if (dealService.filteredDeals().length === 0) {
        <div class="empty-state">
          <p>Geen deals gevonden</p>
          <p>Probeer andere filters of zoektermen</p>
        </div>
      } @else {
        <div class="deal-grid">
          @for (deal of windowedDeals(); track deal.id) {
            <app-deal-card [deal]="deal"></app-deal-card>
          }
        </div>
        <ion-infinite-scroll (ionInfinite)="loadMore($event)" [disabled]="windowedDeals().length >= modeDeals().length">
          <ion-infinite-scroll-content loadingSpinner="crescent"></ion-infinite-scroll-content>
        </ion-infinite-scroll>
      }

      <ion-modal [isOpen]="showFilterModal" (didDismiss)="showFilterModal = false">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              @if (dealService.activeFiltersCount() > 0) {
                <ion-buttons slot="start">
                  <ion-button (click)="resetFilters()">Wis</ion-button>
                </ion-buttons>
              }
              <ion-title>Filters</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="showFilterModal = false">
                  <ion-icon name="checkmark" slot="icon-only"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <ion-list>
              <ion-item>
                <ion-label><strong>Minimum korting</strong></ion-label>
              </ion-item>
              <ion-radio-group [value]="dealService.filters().minDiscount || 0" (ionChange)="onMinDiscountChange($event)">
                <ion-item><ion-radio [value]="0">Alle kortingen</ion-radio></ion-item>
                <ion-item><ion-radio [value]="25">≥ 25%</ion-radio></ion-item>
                <ion-item><ion-radio [value]="33">≥ 33%</ion-radio></ion-item>
                <ion-item><ion-radio [value]="50">≥ 50%</ion-radio></ion-item>
              </ion-radio-group>
            </ion-list>

            <ion-list>
              <ion-item>
                <ion-label><strong>Categorie</strong></ion-label>
              </ion-item>
              <ion-radio-group [value]="dealService.filters().category || ''" (ionChange)="onCategoryChange($event)">
                <ion-item><ion-radio value="">Alle categorieën</ion-radio></ion-item>
                @for (cat of categories; track cat.slug) {
                  <ion-item>
                    <ion-radio [value]="cat.slug">{{ cat.emoji }} {{ cat.name }}</ion-radio>
                  </ion-item>
                }
              </ion-radio-group>
            </ion-list>

            @if (dealService.availableBrands().length > 0) {
              <ion-list>
                <ion-item>
                  <ion-label><strong>Merk</strong></ion-label>
                </ion-item>
                <ion-radio-group [value]="dealService.filters().brand || ''" (ionChange)="onBrandChange($event)">
                  <ion-item><ion-radio value="">Alle merken</ion-radio></ion-item>
                  @for (brand of dealService.availableBrands(); track brand.name) {
                    <ion-item>
                      <ion-radio [value]="brand.name">{{ brand.name }} ({{ brand.count }})</ion-radio>
                    </ion-item>
                  }
                </ion-radio-group>
              </ion-list>
            }
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--ion-color-light);
    }

    .results-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 16px;
      border-bottom: 1px solid var(--ion-color-light);
    }

    .results-count {
      font-size: 0.9rem;
      color: var(--ion-color-medium);
    }

    .mode-toggle {
      display: flex;
      background: var(--retro-newsprint);
      padding: 8px 12px 10px;
      gap: 0;
      border-bottom: 2px solid var(--retro-ink);
    }
    .mode-btn {
      flex: 1;
      padding: 8px 0 7px;
      border: 2px solid var(--retro-ink);
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      font-size: 0.95rem;
      font-weight: 400;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      cursor: pointer;
      background: var(--retro-newsprint-bright);
      color: var(--retro-ink);
      transition: background-color 0.1s ease;
    }
    .mode-btn + .mode-btn { border-left-width: 0; }
    .mode-btn.active {
      background: var(--retro-yellow);
      color: var(--retro-ink);
      box-shadow: inset 0 -4px 0 0 var(--retro-ink);
    }

    .category-scroll {
      display: flex;
      gap: 6px;
      padding: 10px 12px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      background: var(--retro-newsprint);
      border-bottom: 1px solid var(--retro-ink-hairline);
    }
    .category-scroll::-webkit-scrollbar { display: none; }
    .cat-chip {
      flex-shrink: 0;
      padding: 5px 11px 4px;
      border-radius: 0;
      border: 1.5px solid var(--retro-ink);
      background: var(--retro-newsprint-bright);
      font-family: 'Space Mono', monospace;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--retro-ink);
      cursor: pointer;
      white-space: nowrap;
      box-shadow: 1.5px 1.5px 0 0 var(--retro-ink);
    }
    .cat-chip.active {
      background: var(--retro-red);
      color: #ffffff;
      border-color: var(--retro-ink);
    }
    .cat-chip:active {
      transform: translate(1.5px, 1.5px);
      box-shadow: 0 0 0 0 var(--retro-ink);
    }

    .deal-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding: 8px 12px;
    }

    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding: 8px 12px;
    }
    .skeleton-card {
      padding: 12px;
      background: var(--ion-card-background, white);
      border-radius: 16px;
    }

    ion-badge {
      position: absolute;
      top: 0;
      right: 0;
      font-size: 10px;
    }
  `]
})
export class DealsPage implements OnInit, OnDestroy {
  dealService = inject(DealService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private posthog = inject(PosthogService);

  showFilterModal = false;
  dealMode = signal<'food' | 'nonfood'>(
    (localStorage.getItem('dealfinder-mode') as 'food' | 'nonfood') || 'food'
  );
  retailerSlug: string | null = null;
  categories = CATEGORIES;
  currentSort = signal<'discount' | 'price' | 'expiry' | 'name'>('discount');
  // Render a sliding window of the (client-filtered) list so the DOM stays
  // small — the full list can be 1000+ cards, which janks scroll badly.
  private static PAGE = 24;
  visibleCount = signal(DealsPage.PAGE);

  private sortOptions: Array<{ key: string; label: string }> = [
    { key: 'discount', label: 'Korting' },
    { key: 'price', label: 'Prijs' },
    { key: 'expiry', label: 'Vervaldatum' },
    { key: 'name', label: 'Naam' },
  ];

  get pageTitle(): string {
    if (this.retailerSlug) {
      const retailer = this.dealService.retailers().find(r => r.slug === this.retailerSlug);
      return retailer?.name || 'Deals';
    }
    return 'Alle Deals';
  }

  sortLabel = computed(() =>
    this.sortOptions.find(o => o.key === this.currentSort())?.label ?? 'Korting'
  );

  sortedDeals = computed(() => {
    const deals = [...this.dealService.filteredDeals()];
    switch (this.currentSort()) {
      case 'discount':
        return deals.sort((a, b) => b.discountPercentage - a.discountPercentage);
      case 'price':
        return deals.sort((a, b) => (a.currentPrice ?? 0) - (b.currentPrice ?? 0));
      case 'expiry':
        return deals.sort((a, b) => (a.validUntil ?? '').localeCompare(b.validUntil ?? ''));
      case 'name':
        return deals.sort((a, b) => a.productName.localeCompare(b.productName));
      default:
        return deals;
    }
  });

  modeDeals = computed(() => {
    const sorted = this.sortedDeals();
    if (this.retailerSlug) return sorted;
    return this.dealMode() === 'food'
      ? sorted.filter(d => isFoodDeal(d))
      : sorted.filter(d => !isFoodDeal(d));
  });

  windowedDeals = computed(() => this.modeDeals().slice(0, this.visibleCount()));

  loadMore(event: any) {
    this.visibleCount.update(c => c + DealsPage.PAGE);
    event.target.complete();
  }

  topCategories = computed(() => {
    const deals = this.dealService.filteredDeals();
    const isFood = this.dealMode() === 'food';
    const categoryList = isFood ? FOOD_CATEGORIES : NON_FOOD_CATEGORIES;
    const slugSet = isFood ? FOOD_SLUGS : new Set(NON_FOOD_CATEGORIES.map(c => c.slug));
    const counts = new Map<string, number>();
    for (const d of deals) {
      if (d.categorySlug && slugSet.has(d.categorySlug)) {
        counts.set(d.categorySlug, (counts.get(d.categorySlug) || 0) + 1);
      }
    }
    return categoryList.filter(c => counts.has(c.slug))
      .sort((a, b) => (counts.get(b.slug) || 0) - (counts.get(a.slug) || 0));
  });

  cycleSort() {
    const idx = this.sortOptions.findIndex(o => o.key === this.currentSort());
    this.currentSort.set(this.sortOptions[(idx + 1) % this.sortOptions.length].key as 'discount' | 'price' | 'expiry' | 'name');
  }

  constructor() {
    addIcons({ filter, close, checkmark, swapVertical, bookOutline });
    effect(() => localStorage.setItem('dealfinder-mode', this.dealMode()));
    // Reset the scroll window to the top whenever the result set changes
    // (filters, mode, sort, or a fresh deal load), so you don't keep a huge
    // window after narrowing the list.
    effect(() => {
      this.dealService.filters();
      this.dealService.deals();
      this.dealMode();
      this.currentSort();
      this.visibleCount.set(DealsPage.PAGE);
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.retailerSlug = params['slug'] || null;
      if (this.retailerSlug) {
        this.dealService.setFilter('retailer', this.retailerSlug);
        this.dealService.loadDealsByRetailer(this.retailerSlug).subscribe();
      } else {
        this.dealService.clearFilter('retailer');
        this.dealService.loadDeals().subscribe();
      }
    });

    this.route.queryParams.subscribe(params => {
      const brand = params['brand'];
      this.dealService.setFilter('brand', brand || undefined);
    });

    if (this.dealService.retailers().length === 0) {
      this.dealService.loadRetailers().subscribe();
    }
  }

  refresh(event: any) {
    const obs = this.retailerSlug
      ? this.dealService.loadDealsByRetailer(this.retailerSlug)
      : this.dealService.loadDeals();
    obs.subscribe({ complete: () => event.target.complete() });
  }

  onSearch(event: CustomEvent) {
    const value = event.detail.value;
    this.dealService.setFilter('search', value);
  }

  onMinDiscountChange(event: CustomEvent) {
    const value = event.detail.value;
    this.dealService.setFilter('minDiscount', value > 0 ? value : undefined);
    this.posthog.posthog.capture('filter_applied', {
      filter_type: 'min_discount',
      value: value > 0 ? value : null,
    });
  }

  onCategoryChange(event: CustomEvent) {
    const value = event.detail.value || undefined;
    this.dealService.setFilter('category', value);
    this.posthog.posthog.capture('filter_applied', {
      filter_type: 'category',
      value: value ?? null,
    });
  }

  onBrandChange(event: CustomEvent) {
    const value = event.detail.value || undefined;
    this.dealService.setFilter('brand', value);
    this.posthog.posthog.capture('filter_applied', {
      filter_type: 'brand',
      value: value ?? null,
    });
  }

  resetFilters() {
    const cleared = this.dealService.activeFiltersCount();
    if (this.retailerSlug) {
      this.dealService.setFilter('retailer', this.retailerSlug);
    } else {
      this.dealService.clearFilters();
    }
    this.dealService.clearFilter('category');
    this.dealService.clearFilter('brand');
    this.dealService.clearFilter('minDiscount');
    this.dealService.clearFilter('search');
    this.posthog.posthog.capture('filters_reset', { cleared });
  }

  getCategoryName(slug: string): string {
    const cat = CATEGORIES.find(c => c.slug === slug);
    return cat ? `${cat.emoji} ${cat.name}` : slug;
  }

  setMode(mode: 'food' | 'nonfood') {
    this.dealMode.set(mode);
    this.posthog.posthog.capture('deal_mode_switched', { mode });
  }

  ngOnDestroy() {
    // Clear ALL filters set during this page's lifetime so other pages
    // (home, brands, categories, deal-detail) start from a clean slate.
    // Filter sources: retailer (from URL slug), brand (from query param when
    // user clicked a deal-card brand chip), category (handed off from
    // /categories), plus search / minDiscount / brand / category set via the
    // filter modal. Without this, e.g. visiting /deals?brand=Dreft then
    // navigating back to home would leave the brand filter active and
    // silently bias every other deal-reading computed.
    this.dealService.clearFilters();
    // loadDealsByRetailer overwrites the global deals signal with only one
    // retailer's deals. Restore the full catalog so the home retailer rail
    // (and any other page that reads dealService.deals()) sees everything.
    if (this.retailerSlug) {
      this.dealService.loadDeals().subscribe();
    }
  }

  openFlyer() {
    if (!this.retailerSlug) return;
    this.posthog.posthog.capture('flyer_opened', { retailer: this.retailerSlug });
    this.dealService.loadFlyers(this.retailerSlug).subscribe({
      next: data => {
        if (data.flyers?.length > 0) {
          this.router.navigate(['/flyer', this.retailerSlug, data.flyers[0].id]);
        }
      }
    });
  }
}
