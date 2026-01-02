import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonSearchbar, IonChip, IonLabel, IonIcon, IonButton, IonButtons,
  IonModal, IonList, IonItem, IonRadio, IonRadioGroup, IonCheckbox,
  IonSpinner, IonBadge, IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { filter, close, checkmark } from 'ionicons/icons';
import { DealService, DealFilters } from '../../services/deal.service';
import { DealCardComponent } from '../../components/deal-card/deal-card.component';
import { CATEGORIES, PromoKind } from '../../models/deal.model';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonSearchbar, IonChip, IonLabel, IonIcon, IonButton, IonButtons,
    IonModal, IonList, IonItem, IonRadio, IonRadioGroup, IonCheckbox,
    IonSpinner, IonBadge, IonBackButton,
    DealCardComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start" *ngIf="retailerSlug">
          <ion-back-button defaultHref="/retailers"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showFilterModal = true">
            <ion-icon name="filter" slot="icon-only"></ion-icon>
            <ion-badge *ngIf="dealService.activeFiltersCount() > 0" color="danger">
              {{ dealService.activeFiltersCount() }}
            </ion-badge>
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

      <!-- Active filters -->
      @if (dealService.activeFiltersCount() > 0) {
        <div class="filter-chips">
          @if (dealService.filters().category) {
            <ion-chip (click)="dealService.clearFilter('category')">
              <ion-label>{{ getCategoryName(dealService.filters().category!) }}</ion-label>
              <ion-icon name="close"></ion-icon>
            </ion-chip>
          }
          @if (dealService.filters().promoKind) {
            <ion-chip (click)="dealService.clearFilter('promoKind')">
              <ion-label>{{ getPromoKindName(dealService.filters().promoKind!) }}</ion-label>
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

      <!-- Results count -->
      <div class="results-count">
        {{ dealService.filteredDeals().length }} deals gevonden
      </div>

      <!-- Deals list -->
      @if (dealService.loading()) {
        <div class="loading">
          <ion-spinner></ion-spinner>
          <p>Deals laden...</p>
        </div>
      } @else if (dealService.filteredDeals().length === 0) {
        <div class="empty-state">
          <ion-icon name="pricetag"></ion-icon>
          <h2>Geen deals gevonden</h2>
          <p>Probeer andere filters of zoektermen</p>
        </div>
      } @else {
        @for (deal of dealService.filteredDeals(); track deal.id) {
          <app-deal-card [deal]="deal"></app-deal-card>
        }
      }

      <!-- Filter Modal -->
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
            <!-- Promo type filter -->
            <ion-list>
              <ion-item>
                <ion-label><strong>Promo type</strong></ion-label>
              </ion-item>
              <ion-radio-group [value]="dealService.filters().promoKind || ''" (ionChange)="onPromoKindChange($event)">
                <ion-item>
                  <ion-radio value="">Alle types</ion-radio>
                </ion-item>
                <ion-item>
                  <ion-radio value="MULTI_BUY">Multi-buy (1+1, 2+1, etc.)</ion-radio>
                </ion-item>
                <ion-item>
                  <ion-radio value="PERCENTAGE">Percentage (-20%, -30%)</ion-radio>
                </ion-item>
                <ion-item>
                  <ion-radio value="FIXED_PRICE">Vaste prijs (3 voor €5)</ion-radio>
                </ion-item>
                <ion-item>
                  <ion-radio value="PRICE_DROP">Prijsverlaging</ion-radio>
                </ion-item>
              </ion-radio-group>
            </ion-list>

            <!-- Minimum discount filter -->
            <ion-list>
              <ion-item>
                <ion-label><strong>Minimum korting</strong></ion-label>
              </ion-item>
              <ion-radio-group [value]="dealService.filters().minDiscount || 0" (ionChange)="onMinDiscountChange($event)">
                <ion-item>
                  <ion-radio [value]="0">Alle kortingen</ion-radio>
                </ion-item>
                <ion-item>
                  <ion-radio [value]="25">≥ 25%</ion-radio>
                </ion-item>
                <ion-item>
                  <ion-radio [value]="33">≥ 33%</ion-radio>
                </ion-item>
                <ion-item>
                  <ion-radio [value]="50">≥ 50%</ion-radio>
                </ion-item>
              </ion-radio-group>
            </ion-list>

            <!-- Category filter -->
            <ion-list>
              <ion-item>
                <ion-label><strong>Categorie</strong></ion-label>
              </ion-item>
              <ion-radio-group [value]="dealService.filters().category || ''" (ionChange)="onCategoryChange($event)">
                <ion-item>
                  <ion-radio value="">Alle categorieën</ion-radio>
                </ion-item>
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
    
    .results-count {
      padding: 12px 16px;
      font-size: 0.9rem;
      color: var(--ion-color-medium);
      border-bottom: 1px solid var(--ion-color-light);
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: var(--ion-color-medium);
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
  
  showFilterModal = false;
  retailerSlug: string | null = null;
  categories = CATEGORIES;

  get pageTitle(): string {
    if (this.retailerSlug) {
      const retailer = this.dealService.retailers().find(r => r.slug === this.retailerSlug);
      return retailer?.name || 'Deals';
    }
    return 'Alle Deals';
  }

  constructor() {
    addIcons({ filter, close, checkmark });
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

  onSearch(event: any) {
    const value = event.target.value;
    this.dealService.setFilter('search', value);
  }

  onPromoKindChange(event: any) {
    this.dealService.setFilter('promoKind', event.detail.value || undefined);
  }

  onMinDiscountChange(event: any) {
    const value = event.detail.value;
    this.dealService.setFilter('minDiscount', value > 0 ? value : undefined);
  }

  onCategoryChange(event: any) {
    this.dealService.setFilter('category', event.detail.value || undefined);
  }

  getCategoryName(slug: string): string {
    const cat = CATEGORIES.find(c => c.slug === slug);
    return cat ? `${cat.emoji} ${cat.name}` : slug;
  }

  getPromoKindName(kind: PromoKind): string {
    switch (kind) {
      case 'MULTI_BUY': return 'Multi-buy';
      case 'PERCENTAGE': return 'Percentage';
      case 'FIXED_PRICE': return 'Vaste prijs';
      case 'PRICE_DROP': return 'Prijsverlaging';
      default: return kind;
    }
  }
}
