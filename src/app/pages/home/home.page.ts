import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon,
  IonList, IonItem, IonLabel, IonBadge, IonSkeletonText, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refresh, arrowForward, pricetag, storefront, sparkles, syncOutline, timerOutline } from 'ionicons/icons';
import { DealService } from '../../services/deal.service';
import { ShoppingListService } from '../../services/shopping-list.service';
import { DealCardComponent } from '../../components/deal-card/deal-card.component';
import { Deal } from '../../models/deal.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon,
    IonList, IonItem, IonLabel, IonBadge, IonSkeletonText, IonSpinner,
    DealCardComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Deal Finder</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Stats row -->
      @if (!dealService.loading()) {
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-value">{{ dealService.totalDeals() }}</span>
            <span class="stat-label">Deals</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ dealService.retailers().length }}</span>
            <span class="stat-label">Winkels</span>
          </div>
          <div class="stat-card accent">
            <span class="stat-value">{{ avgDiscount() }}%</span>
            <span class="stat-label">Gem. korting</span>
          </div>
          <div class="stat-card success">
            <span class="stat-value">{{ shoppingList.activeCount() }}</span>
            <span class="stat-label">Op lijst</span>
          </div>
        </div>
      }

      <!-- Retailers -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="storefront"></ion-icon>
            Winkels
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          @if (dealService.retailers().length === 0) {
            <ion-skeleton-text [animated]="true" style="height: 40px"></ion-skeleton-text>
          } @else {
            <div class="retailer-chips">
              @for (retailer of activeRetailers(); track retailer.slug) {
                <a [routerLink]="['/retailer', retailer.slug]" class="retailer-chip" [class]="retailer.slug">
                  {{ retailer.name }}
                  <ion-badge color="light">{{ retailer.dealCount }}</ion-badge>
                </a>
              }
            </div>
          }
        </ion-card-content>
      </ion-card>

      <!-- Top deals -->
      <ion-card>
        <ion-card-header>
          <div class="section-header">
            <ion-card-title>
              <ion-icon name="sparkles"></ion-icon>
              Beste Deals
            </ion-card-title>
            <ion-button fill="clear" routerLink="/deals" size="small">
              Alles <ion-icon name="arrow-forward" slot="end"></ion-icon>
            </ion-button>
          </div>
        </ion-card-header>
        <ion-card-content class="deals-content">
          @if (dealService.loading()) {
            <div class="loading">
              <ion-spinner></ion-spinner>
              <p>Deals laden...</p>
            </div>
          } @else if (topDeals().length === 0) {
            <div class="empty">
              <p>Nog geen deals beschikbaar.</p>
              <ion-button fill="outline" (click)="triggerScan()">
                <ion-icon name="sync-outline" slot="start"></ion-icon>
                Scan starten
              </ion-button>
            </div>
          } @else {
            @for (deal of topDeals(); track deal.id) {
              <app-deal-card [deal]="deal"></app-deal-card>
            }
          }
        </ion-card-content>
      </ion-card>

      <!-- Expiring soon -->
      @if (expiringDeals().length > 0) {
        <ion-card class="expiring-card">
          <ion-card-header>
            <ion-card-title class="expiring-title">
              <ion-icon name="timer-outline"></ion-icon>
              Bijna verlopen!
            </ion-card-title>
          </ion-card-header>
          <ion-card-content class="deals-content">
            @for (deal of expiringDeals(); track deal.id) {
              <app-deal-card [deal]="deal"></app-deal-card>
            }
          </ion-card-content>
        </ion-card>
      }

      <!-- Recently added -->
      @if (recentDeals().length > 0) {
        <ion-card>
          <ion-card-header>
            <div class="section-header">
              <ion-card-title>
                <ion-icon name="pricetag"></ion-icon>
                Recent Toegevoegd
              </ion-card-title>
              <ion-button fill="clear" routerLink="/deals" size="small">
                Alles <ion-icon name="arrow-forward" slot="end"></ion-icon>
              </ion-button>
            </div>
          </ion-card-header>
          <ion-card-content class="deals-content">
            @for (deal of recentDeals(); track deal.id) {
              <app-deal-card [deal]="deal"></app-deal-card>
            }
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
  styles: [`
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      padding: 12px;
    }

    .stat-card {
      background: var(--ion-card-background, white);
      border-radius: 12px;
      padding: 12px 8px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .stat-value {
      display: block;
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--ion-color-primary);
    }

    .stat-card.accent .stat-value {
      color: var(--ion-color-danger);
    }

    .stat-card.success .stat-value {
      color: var(--ion-color-success);
    }

    .stat-label {
      display: block;
      font-size: 0.7rem;
      color: var(--ion-color-medium);
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .retailer-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .retailer-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 20px;
      text-decoration: none;
      color: white;
      font-weight: 500;
      font-size: 0.9rem;

      &.carrefour { background: var(--retailer-carrefour); }
      &.lidl { background: var(--retailer-lidl); }
      &.delhaize { background: var(--retailer-delhaize); }
      &.colruyt { background: var(--retailer-colruyt); }
      &.aldi { background: var(--retailer-aldi); }
      &.kruidvat { background: var(--retailer-kruidvat); }
      &.albert-heijn { background: var(--retailer-albert-heijn); }
      &.jumbo { background: var(--retailer-jumbo); color: #333; }
      &.spar { background: var(--retailer-spar); }
      &.intermarche { background: var(--retailer-intermarche); }
      &.gamma { background: var(--retailer-gamma); }
      &:not([class*="-"]):not(.carrefour):not(.lidl):not(.delhaize):not(.colruyt):not(.aldi):not(.kruidvat):not(.jumbo):not(.spar):not(.gamma) {
        background: var(--ion-color-medium);
      }

      ion-badge {
        --background: rgba(255,255,255,0.3);
        --color: white;
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    ion-card-title ion-icon {
      margin-right: 8px;
      vertical-align: middle;
    }

    .deals-content {
      padding: 0;
    }

    .expiring-card {
      border-left: 4px solid var(--ion-color-warning);
    }

    .expiring-title {
      color: var(--ion-color-warning-shade);
    }

    .loading, .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      text-align: center;
      color: var(--ion-color-medium);
    }
  `]
})
export class HomePage implements OnInit {
  dealService = inject(DealService);
  shoppingList = inject(ShoppingListService);

  topDeals = computed(() =>
    [...this.dealService.deals()]
      .sort((a, b) => b.discountPercentage - a.discountPercentage)
      .slice(0, 5)
  );

  recentDeals = computed(() => {
    const top5Ids = new Set(this.topDeals().map(d => d.id));
    return [...this.dealService.deals()]
      .filter(d => !top5Ids.has(d.id))
      .slice(0, 3);
  });

  activeRetailers = computed(() =>
    this.dealService.retailers().filter(r => r.dealCount > 0)
  );

  expiringDeals = computed(() =>
    this.dealService.deals()
      .filter(d => d.expiringSoon)
      .sort((a, b) => (a.validUntil ?? '').localeCompare(b.validUntil ?? ''))
      .slice(0, 3)
  );

  avgDiscount = computed(() => {
    const deals = this.dealService.deals();
    if (deals.length === 0) return 0;
    const sum = deals.reduce((acc, d) => acc + (d.discountPercentage || 0), 0);
    return Math.round(sum / deals.length);
  });

  constructor() {
    addIcons({ refresh, arrowForward, pricetag, storefront, sparkles, syncOutline, timerOutline });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dealService.loadDeals().subscribe();
    this.dealService.loadRetailers().subscribe();
  }

  doRefresh(event: any) {
    this.dealService.loadDeals().subscribe({
      complete: () => event.target.complete()
    });
    this.dealService.loadRetailers().subscribe();
  }

  triggerScan() {
    this.dealService.triggerScan().subscribe({
      next: () => {
        setTimeout(() => this.loadData(), 3000);
      }
    });
  }
}
