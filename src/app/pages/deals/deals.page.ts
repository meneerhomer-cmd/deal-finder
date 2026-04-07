import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonSearchbar, IonChip, IonLabel, IonIcon, IonButton, IonButtons,
  IonModal, IonList, IonItem, IonRadio, IonRadioGroup,
  IonSpinner, IonBadge, IonBackButton, IonSegment, IonSegmentButton, IonSkeletonText
} from '@ionic/angular/standalone';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { addIcons } from 'ionicons';
import { filter, close, checkmark, swapVertical, bookOutline } from 'ionicons/icons';
import { DealService } from '../../services/deal.service';
import { DealCardComponent } from '../../components/deal-card/deal-card.component';
import { CATEGORIES } from '../../models/deal.model';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonSearchbar, IonChip, IonLabel, IonIcon, IonButton, IonButtons,
    IonModal, IonList, IonItem, IonRadio, IonRadioGroup,
    IonSpinner, IonBadge, IonBackButton, IonSegment, IonSegmentButton, IonSkeletonText,
    ScrollingModule, DealCardComponent
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

      @if (dealService.activeFiltersCount() > 0) {
        <div class="filter-chips">
          @if (dealService.filters().category) {
            <ion-chip (click)="dealService.clearFilter('category')">
              <ion-label>{{ getCategoryName(dealService.filters().category!) }}</ion-label>
              <ion-icon name="close"></ion-icon>
            </ion-chip>
          }
          @if (dealService.filters().minDiscount) {
            <ion-chip (click)="dealService.clearFilter('minDiscount')">
              <ion-label>≥{{ dealService.filters().minDiscount }}%</ion-label>
              <ion-icon name="close"></ion-icon>
            </ion-chip>
          }
          <ion-button fill="clear" size="small" (click)="dealService.clearFilters()">
            Wis alle
          </ion-button>
        </div>
      }

      <div class="results-bar">
        <span class="results-count">{{ dealService.filteredDeals().length }} deals gevonden</span>
        <ion-button fill="clear" size="small" (click)="cycleSort()">
          <ion-icon name="swap-vertical" slot="start"></ion-icon>
          {{ sortLabel }}
        </ion-button>
      </div>

      @if (dealService.loading()) {
        <div class="skeleton-list">
          @for (i of [1,2,3,4]; track i) {
            <div class="skeleton-card">
              <ion-skeleton-text [animated]="true" style="width: 40px; height: 40px; border-radius: 8px;"></ion-skeleton-text>
              <div class="skeleton-content">
                <ion-skeleton-text [animated]="true" style="width: 70%; height: 16px;"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 50%; height: 14px;"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 30%; height: 20px;"></ion-skeleton-text>
              </div>
            </div>
          }
        </div>
      } @else if (dealService.filteredDeals().length === 0) {
        <div class="empty-state">
          <p>Geen deals gevonden</p>
          <p>Probeer andere filters of zoektermen</p>
        </div>
      } @else {
        <cdk-virtual-scroll-viewport itemSize="140" minBufferPx="600" maxBufferPx="1200" class="deal-scroll">
          @for (deal of sortedDeals(); track deal.id) {
            <app-deal-card [deal]="deal"></app-deal-card>
          }
        </cdk-virtual-scroll-viewport>
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

    .skeleton-list { padding: 12px; }
    .skeleton-card {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 16px; margin-bottom: 8px;
      background: var(--ion-card-background, white);
      border-radius: 14px;
    }
    .skeleton-content { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .deal-scroll { height: 100%; width: 100%; }

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

  cycleSort() {
    const idx = this.sortOptions.findIndex(o => o.key === this.currentSort);
    this.currentSort = this.sortOptions[(idx + 1) % this.sortOptions.length].key as typeof this.currentSort;
  }

  constructor() {
    addIcons({ filter, close, checkmark, swapVertical, bookOutline });
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
