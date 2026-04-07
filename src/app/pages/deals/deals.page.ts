import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonSearchbar, IonChip, IonLabel, IonIcon, IonButton, IonButtons,
  IonModal, IonList, IonItem, IonRadio, IonRadioGroup,
  IonSpinner, IonBadge, IonBackButton, IonSegment, IonSegmentButton, IonSkeletonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { filter, close, checkmark, swapVertical, bookOutline, chevronDown, chevronUp } from 'ionicons/icons';
import { DealService } from '../../services/deal.service';
import { DealCardComponent } from '../../components/deal-card/deal-card.component';
import { CATEGORIES, FOOD_CATEGORIES, FOOD_SLUGS } from '../../models/deal.model';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonSearchbar, IonChip, IonLabel, IonIcon, IonButton, IonButtons,
    IonModal, IonList, IonItem, IonRadio, IonRadioGroup,
    IonSpinner, IonBadge, IonBackButton, IonSegment, IonSegmentButton, IonSkeletonText,
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
        <span class="results-count">{{ foodDeals().length }} voedingsdeals</span>
        <ion-button fill="clear" size="small" (click)="cycleSort()">
          <ion-icon name="swap-vertical" slot="start"></ion-icon>
          {{ sortLabel }}
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
          @for (deal of foodDeals(); track deal.id) {
            <app-deal-card [deal]="deal"></app-deal-card>
          }
        </div>

        @if (nonFoodDeals().length > 0) {
          <div class="bonus-section" (click)="showNonFood = !showNonFood">
            <div class="bonus-header">
              <span>Andere aanbiedingen</span>
              <ion-badge color="medium">{{ nonFoodDeals().length }}</ion-badge>
              <ion-icon [name]="showNonFood ? 'chevron-up' : 'chevron-down'"></ion-icon>
            </div>
          </div>
          @if (showNonFood) {
            <div class="deal-grid">
              @for (deal of nonFoodDeals(); track deal.id) {
                <app-deal-card [deal]="deal"></app-deal-card>
              }
            </div>
          }
        }
      }

      <ion-modal [isOpen]="showFilterModal" (didDismiss)="showFilterModal = false">
        <ng-template>
          <ion-header>
            <ion-toolbar>
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

    .category-scroll {
      display: flex;
      gap: 8px;
      padding: 10px 12px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .category-scroll::-webkit-scrollbar { display: none; }
    .cat-chip {
      flex-shrink: 0;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1.5px solid var(--ion-color-light-shade, #d7d8da);
      background: transparent;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--ion-text-color);
      cursor: pointer;
      white-space: nowrap;
    }
    .cat-chip.active {
      background: var(--ion-color-primary);
      color: white;
      border-color: var(--ion-color-primary);
    }

    .deal-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding: 8px 12px;
    }

    .bonus-section {
      margin: 12px 12px 8px;
      cursor: pointer;
    }
    .bonus-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--ion-color-light);
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--ion-color-medium-shade);
    }
    .bonus-header ion-icon {
      margin-left: auto;
      font-size: 1.1rem;
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
export class DealsPage implements OnInit {
  dealService = inject(DealService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  showFilterModal = false;
  showNonFood = false;
  retailerSlug: string | null = null;
  categories = CATEGORIES;
  currentSort: 'discount' | 'price' | 'expiry' | 'name' = 'discount';

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

  get sortLabel(): string {
    return this.sortOptions.find(o => o.key === this.currentSort)?.label ?? 'Korting';
  }

  sortedDeals() {
    const deals = [...this.dealService.filteredDeals()];
    switch (this.currentSort) {
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
  }

  topCategories = computed(() => {
    const deals = this.dealService.filteredDeals();
    const counts = new Map<string, number>();
    for (const d of deals) {
      if (d.categorySlug && FOOD_SLUGS.has(d.categorySlug)) {
        counts.set(d.categorySlug, (counts.get(d.categorySlug) || 0) + 1);
      }
    }
    return FOOD_CATEGORIES.filter(c => counts.has(c.slug))
      .sort((a, b) => (counts.get(b.slug) || 0) - (counts.get(a.slug) || 0));
  });

  foodDeals = computed(() => {
    const sorted = this.sortedDeals();
    return sorted.filter(d => d.categorySlug && FOOD_SLUGS.has(d.categorySlug));
  });

  nonFoodDeals = computed(() => {
    const sorted = this.sortedDeals();
    return sorted.filter(d => !d.categorySlug || !FOOD_SLUGS.has(d.categorySlug));
  });

  cycleSort() {
    const idx = this.sortOptions.findIndex(o => o.key === this.currentSort);
    this.currentSort = this.sortOptions[(idx + 1) % this.sortOptions.length].key as typeof this.currentSort;
  }

  constructor() {
    addIcons({ filter, close, checkmark, swapVertical, bookOutline, chevronDown, chevronUp });
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
  }

  onCategoryChange(event: CustomEvent) {
    this.dealService.setFilter('category', event.detail.value || undefined);
  }

  getCategoryName(slug: string): string {
    const cat = CATEGORIES.find(c => c.slug === slug);
    return cat ? `${cat.emoji} ${cat.name}` : slug;
  }

  openFlyer() {
    if (!this.retailerSlug) return;
    this.dealService.loadFlyers(this.retailerSlug).subscribe({
      next: data => {
        if (data.flyers?.length > 0) {
          this.router.navigate(['/flyer', this.retailerSlug, data.flyers[0].id]);
        }
      }
    });
  }
}
