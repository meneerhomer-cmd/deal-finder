import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonButton, IonIcon, IonBadge, IonSkeletonText, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForward, sparkles, syncOutline, timerOutline, searchOutline } from 'ionicons/icons';
import { DealService } from '../../services/deal.service';
import { ShoppingListService } from '../../services/shopping-list.service';
import { DealCardComponent } from '../../components/deal-card/deal-card.component';
import { Deal, FOOD_SLUGS } from '../../models/deal.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonButton, IonIcon, IonBadge, IonSkeletonText, IonSpinner,
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

      @if (dealService.totalDeals() === 0 && !dealService.loading()) {
        <div class="scraping-banner">
          <ion-spinner name="crescent"></ion-spinner>
          <div>
            <strong>Deals worden geladen...</strong>
            <p>De server verzamelt de nieuwste promoties.</p>
          </div>
        </div>
      }

      <!-- Hero savings card -->
      @if (dealService.totalDeals() > 0) {
        <div class="hero-card">
          <div class="hero-left">
            <span class="hero-number">{{ dealService.totalDeals() }}</span>
            <span class="hero-label">deals bij {{ activeRetailers().length }} winkels</span>
          </div>
          <div class="hero-right">
            <span class="hero-discount">{{ avgDiscount() }}%</span>
            <span class="hero-label">gem. korting</span>
          </div>
        </div>
      }

      <!-- Search shortcut -->
      <a routerLink="/search" class="search-bar-shortcut">
        <ion-icon name="search-outline"></ion-icon>
        <span>Zoek een product of merk...</span>
      </a>

      <!-- Top Food Deals carousel -->
      @if (topFoodDeals().length > 0) {
        <div class="section">
          <div class="section-header">
            <h2>Beste voedingsdeals</h2>
            <a routerLink="/deals" class="see-all">
              Alles <ion-icon name="arrow-forward"></ion-icon>
            </a>
          </div>
          <div class="deal-carousel">
            @for (deal of topFoodDeals(); track deal.id) {
              <div class="carousel-item">
                <app-deal-card [deal]="deal"></app-deal-card>
              </div>
            }
          </div>
        </div>
      }

      <!-- Retailers row -->
      @if (activeRetailers().length > 0) {
        <div class="section">
          <div class="section-header">
            <h2>Winkels</h2>
          </div>
          <div class="retailer-scroll">
            @for (retailer of activeRetailers(); track retailer.slug) {
              <a [routerLink]="['/retailer', retailer.slug]" class="retailer-bubble">
                <div class="retailer-avatar" [class]="retailer.slug">
                  {{ retailer.name.charAt(0) }}
                </div>
                <span class="retailer-name">{{ retailer.name }}</span>
                <ion-badge>{{ retailer.dealCount }}</ion-badge>
              </a>
            }
          </div>
        </div>
      }

      <!-- Expiring soon -->
      @if (expiringDeals().length > 0) {
        <div class="section">
          <div class="section-header expiring">
            <h2><ion-icon name="timer-outline"></ion-icon> Bijna verlopen!</h2>
          </div>
          <div class="deal-carousel">
            @for (deal of expiringDeals(); track deal.id) {
              <div class="carousel-item">
                <app-deal-card [deal]="deal"></app-deal-card>
              </div>
            }
          </div>
        </div>
      }

      <!-- Recently added -->
      @if (recentDeals().length > 0) {
        <div class="section">
          <div class="section-header">
            <h2>Recent toegevoegd</h2>
            <a routerLink="/deals" class="see-all">
              Alles <ion-icon name="arrow-forward"></ion-icon>
            </a>
          </div>
          <div class="deal-grid-small">
            @for (deal of recentDeals(); track deal.id) {
              <app-deal-card [deal]="deal"></app-deal-card>
            }
          </div>
        </div>
      }

      <!-- Quick links -->
      <div class="quick-links">
        <a routerLink="/categories" class="quick-link">
          <span class="ql-icon">🏷️</span>
          <span>Categorieën</span>
        </a>
        <a routerLink="/brands" class="quick-link">
          <span class="ql-icon">⭐</span>
          <span>Merken</span>
        </a>
        <a routerLink="/watchlist" class="quick-link">
          <span class="ql-icon">👁️</span>
          <span>Mijn producten</span>
        </a>
        <a routerLink="/optimizer" class="quick-link">
          <span class="ql-icon">🧠</span>
          <span>Slimme route</span>
        </a>
      </div>

      <div style="height: 16px;"></div>
    </ion-content>
  `,
  styles: [`
    ion-content { --background: var(--ion-color-light, #f4f5f8); }

    .scraping-banner {
      display: flex; align-items: center; gap: 16px;
      margin: 12px; padding: 16px; border-radius: 14px;
      background: var(--ion-card-background, white);
      border-left: 4px solid var(--ion-color-primary);
    }
    .scraping-banner p { margin: 4px 0 0; font-size: 0.85rem; color: var(--ion-color-medium); }

    .hero-card {
      display: flex;
      margin: 12px;
      border-radius: 16px;
      overflow: hidden;
      background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #43a047 100%);
      color: white;
      padding: 20px;
      gap: 16px;
    }
    .hero-left, .hero-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .hero-number { font-size: 2.2rem; font-weight: 800; }
    .hero-discount { font-size: 2.2rem; font-weight: 800; }
    .hero-label { font-size: 0.75rem; opacity: 0.85; text-align: center; margin-top: 2px; }

    .search-bar-shortcut {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 12px 12px;
      padding: 12px 16px;
      background: var(--ion-card-background, white);
      border-radius: 12px;
      text-decoration: none;
      color: var(--ion-color-medium);
      font-size: 0.9rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .search-bar-shortcut ion-icon { font-size: 1.2rem; }

    .section { margin-bottom: 8px; }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px 4px;
    }
    .section-header h2 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-header.expiring h2 { color: #e65100; }
    .see-all {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--ion-color-primary);
      text-decoration: none;
    }

    .deal-carousel {
      display: flex;
      gap: 10px;
      padding: 4px 12px 8px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      scroll-snap-type: x mandatory;
    }
    .deal-carousel::-webkit-scrollbar { display: none; }
    .carousel-item {
      flex-shrink: 0;
      width: 145px;
      scroll-snap-align: start;
    }

    .deal-grid-small {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding: 4px 12px 8px;
    }

    .retailer-scroll {
      display: flex;
      gap: 16px;
      padding: 8px 16px 12px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .retailer-scroll::-webkit-scrollbar { display: none; }
    .retailer-bubble {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      text-decoration: none;
      color: var(--ion-text-color);
      flex-shrink: 0;
    }
    .retailer-avatar {
      width: 52px; height: 52px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 700;
      color: white;
    }
    .retailer-avatar.carrefour { background: var(--retailer-carrefour); }
    .retailer-avatar.lidl { background: var(--retailer-lidl); }
    .retailer-avatar.delhaize { background: var(--retailer-delhaize); }
    .retailer-avatar.colruyt { background: var(--retailer-colruyt); }
    .retailer-avatar.aldi { background: var(--retailer-aldi); }
    .retailer-avatar.kruidvat { background: var(--retailer-kruidvat); }
    .retailer-avatar.albert-heijn { background: var(--retailer-albert-heijn); }
    .retailer-avatar.jumbo { background: var(--retailer-jumbo); color: #333; }
    .retailer-avatar.spar { background: var(--retailer-spar); }
    .retailer-avatar.carrefour-market { background: var(--retailer-carrefour-market); }
    .retailer-avatar.intermarche { background: var(--retailer-intermarche); }
    .retailer-avatar.gamma { background: var(--retailer-gamma); }
    .retailer-avatar.brico-bricoplanit { background: var(--retailer-brico-bricoplanit); }
    .retailer-name {
      font-size: 0.65rem; font-weight: 500; text-align: center;
      max-width: 56px; overflow: hidden; text-overflow: ellipsis;
      display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;
    }
    .retailer-bubble ion-badge {
      font-size: 0.6rem;
      --padding-start: 5px; --padding-end: 5px;
      --padding-top: 1px; --padding-bottom: 1px;
    }

    .quick-links {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      padding: 8px 12px;
    }
    .quick-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px 4px;
      background: var(--ion-card-background, white);
      border-radius: 14px;
      text-decoration: none;
      color: var(--ion-text-color);
      font-size: 0.72rem;
      font-weight: 500;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .ql-icon { font-size: 1.6rem; }
  `]
})
export class HomePage implements OnInit {
  dealService = inject(DealService);
  shoppingList = inject(ShoppingListService);

  topFoodDeals = computed(() =>
    [...this.dealService.deals()]
      .filter(d => d.categorySlug && FOOD_SLUGS.has(d.categorySlug))
      .sort((a, b) => b.discountPercentage - a.discountPercentage)
      .slice(0, 8)
  );

  recentDeals = computed(() => {
    const topIds = new Set(this.topFoodDeals().map(d => d.id));
    return [...this.dealService.deals()]
      .filter(d => !topIds.has(d.id))
      .slice(0, 4);
  });

  activeRetailers = computed(() =>
    this.dealService.retailers().filter(r => r.dealCount > 0)
      .sort((a, b) => b.dealCount - a.dealCount)
  );

  expiringDeals = computed(() =>
    this.dealService.deals()
      .filter(d => d.expiringSoon && d.categorySlug && FOOD_SLUGS.has(d.categorySlug))
      .sort((a, b) => (a.validUntil ?? '').localeCompare(b.validUntil ?? ''))
      .slice(0, 6)
  );

  avgDiscount = computed(() => {
    const deals = this.dealService.deals();
    if (deals.length === 0) return 0;
    const sum = deals.reduce((acc, d) => acc + (d.discountPercentage || 0), 0);
    return Math.round(sum / deals.length);
  });

  constructor() {
    addIcons({ arrowForward, sparkles, syncOutline, timerOutline, searchOutline });
  }

  private pollInterval: any;

  ngOnInit() {
    this.loadData();
    this.startPollingIfEmpty();
  }

  loadData() {
    this.dealService.loadDeals().subscribe();
    this.dealService.loadRetailers().subscribe();
  }

  private startPollingIfEmpty() {
    this.pollInterval = setInterval(() => {
      if (this.dealService.totalDeals() === 0) {
        this.dealService.loadDeals().subscribe();
        this.dealService.loadRetailers().subscribe();
      } else {
        clearInterval(this.pollInterval);
      }
    }, 10000);
  }

  doRefresh(event: any) {
    this.dealService.loadDeals().subscribe({
      complete: () => event.target.complete()
    });
    this.dealService.loadRetailers().subscribe();
  }
}
