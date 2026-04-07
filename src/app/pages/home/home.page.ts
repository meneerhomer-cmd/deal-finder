import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonButton, IonIcon, IonBadge, IonSkeletonText, IonSpinner, IonButtons,
  IonSearchbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForward, timerOutline, searchOutline, close,
         pricetagsOutline, heartOutline, eyeOutline, flashOutline } from 'ionicons/icons';
import { DealService } from '../../services/deal.service';
import { DealCardComponent } from '../../components/deal-card/deal-card.component';
import { Deal, FOOD_SLUGS } from '../../models/deal.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonButton, IonIcon, IonBadge, IonSkeletonText, IonSpinner, IonButtons,
    IonSearchbar, DealCardComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        @if (searchOpen()) {
          <ion-searchbar
            placeholder="Zoek een product of merk..."
            [debounce]="400"
            (ionInput)="onSearch($event)"
            (ionCancel)="searchOpen.set(false)"
            [showCancelButton]="'always'"
            cancelButtonText="X"
            animated
          ></ion-searchbar>
        } @else {
          <ion-title>Deal Finder</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="searchOpen.set(true)">
              <ion-icon name="search-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-buttons>
        }
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

      <!-- Retailers row (top) -->
      @if (activeRetailers().length > 0) {
        <div class="retailer-scroll">
          @for (retailer of activeRetailers(); track retailer.slug) {
            <a [routerLink]="['/retailer', retailer.slug]" class="retailer-bubble">
              <img [src]="getRetailerLogo(retailer.slug)" [alt]="retailer.name" class="retailer-logo" />
              <ion-badge>{{ retailer.dealCount }}</ion-badge>
            </a>
          }
        </div>
      }

      <!-- Top Food Deals -->
      @if (topFoodDeals().length > 0) {
        <div class="section">
          <div class="section-header">
            <h2>Beste deals</h2>
            <a routerLink="/deals" class="see-all">Alles <ion-icon name="arrow-forward"></ion-icon></a>
          </div>
          <div class="deal-carousel">
            @for (deal of topFoodDeals(); track deal.id) {
              <div class="carousel-item"><app-deal-card [deal]="deal"></app-deal-card></div>
            }
          </div>
        </div>
      }

      <!-- Recently added -->
      @if (recentDeals().length > 0) {
        <div class="section">
          <div class="section-header">
            <h2>Recent toegevoegd</h2>
            <a routerLink="/deals" class="see-all">Alles <ion-icon name="arrow-forward"></ion-icon></a>
          </div>
          <div class="deal-carousel">
            @for (deal of recentDeals(); track deal.id) {
              <div class="carousel-item"><app-deal-card [deal]="deal"></app-deal-card></div>
            }
          </div>
        </div>
      }

      <!-- Expiring soon -->
      @if (expiringDeals().length > 0) {
        <div class="section">
          <div class="section-header expiring">
            <h2><ion-icon name="timer-outline"></ion-icon> Bijna verlopen</h2>
          </div>
          <div class="deal-carousel">
            @for (deal of expiringDeals(); track deal.id) {
              <div class="carousel-item"><app-deal-card [deal]="deal"></app-deal-card></div>
            }
          </div>
        </div>
      }

      <!-- Quick links (compact icons) -->
      <div class="quick-row">
        <a routerLink="/categories" class="qr-item">
          <ion-icon name="pricetags-outline"></ion-icon>
          <span>Categorieën</span>
        </a>
        <a routerLink="/brands" class="qr-item">
          <ion-icon name="heart-outline"></ion-icon>
          <span>Merken</span>
        </a>
        <a routerLink="/watchlist" class="qr-item">
          <ion-icon name="eye-outline"></ion-icon>
          <span>Producten</span>
        </a>
        <a routerLink="/optimizer" class="qr-item">
          <ion-icon name="flash-outline"></ion-icon>
          <span>Route</span>
        </a>
      </div>

      <div style="height: 16px;"></div>
    </ion-content>
  `,
  styles: [`
    ion-content { --background: var(--ion-color-light, #f4f5f8); }

    ion-searchbar {
      --background: rgba(255,255,255,0.15);
      --color: white;
      --placeholder-color: rgba(255,255,255,0.7);
      --icon-color: rgba(255,255,255,0.8);
      --cancel-button-color: white;
    }

    .scraping-banner {
      display: flex; align-items: center; gap: 16px;
      margin: 12px; padding: 16px; border-radius: 14px;
      background: var(--ion-card-background, white);
      border-left: 4px solid var(--ion-color-primary);
    }
    .scraping-banner p { margin: 4px 0 0; font-size: 0.85rem; color: var(--ion-color-medium); }

    .retailer-scroll {
      display: flex;
      gap: 12px;
      padding: 12px 14px;
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
      flex-shrink: 0;
      position: relative;
    }
    .retailer-logo {
      width: 48px; height: 48px;
      border-radius: 50%;
      object-fit: contain;
      background: white;
      padding: 3px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    }
    .retailer-bubble ion-badge {
      position: absolute;
      top: -2px; right: -4px;
      font-size: 0.55rem;
      --padding-start: 4px; --padding-end: 4px;
      --padding-top: 1px; --padding-bottom: 1px;
    }

    .section { margin-bottom: 4px; }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 14px 2px;
    }
    .section-header h2 {
      margin: 0; font-size: 1rem; font-weight: 700;
      display: flex; align-items: center; gap: 6px;
    }
    .section-header.expiring h2 { color: #e65100; }
    .see-all {
      display: flex; align-items: center; gap: 3px;
      font-size: 0.78rem; font-weight: 600;
      color: var(--ion-color-primary); text-decoration: none;
    }

    .deal-carousel {
      display: flex;
      gap: 8px;
      padding: 6px 14px 10px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      scroll-snap-type: x mandatory;
    }
    .deal-carousel::-webkit-scrollbar { display: none; }
    .carousel-item {
      flex-shrink: 0;
      width: 140px;
      scroll-snap-align: start;
    }

    .quick-row {
      display: flex;
      justify-content: space-around;
      padding: 8px 12px;
      margin: 4px 12px;
      background: var(--ion-card-background, white);
      border-radius: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .qr-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      text-decoration: none;
      color: var(--ion-color-medium-shade);
      padding: 8px 4px;
    }
    .qr-item ion-icon { font-size: 1.3rem; color: var(--ion-color-primary); }
    .qr-item span { font-size: 0.62rem; font-weight: 500; }
  `]
})
export class HomePage implements OnInit {
  dealService = inject(DealService);
  private router = inject(Router);

  searchOpen = signal(false);

  private retailerLogos: Record<string, string> = {
    'lidl': 'https://cdn.jafolders.com/shops/3edf1b56-8ba7-4ae3-8a9f-91a482933067/small.png?v=63931455152',
    'kruidvat': 'https://cdn.jafolders.com/shops/6f42f980-41b1-4016-9b39-c2d668616e9f/small.png?v=63931455078',
    'carrefour': 'https://cdn.jafolders.com/shops/bee9decf-340a-4f48-8777-60335ad8cc57/small.png?v=63931453348',
    'delhaize': 'https://cdn.jafolders.com/shops/1898f67e-c834-4606-9f93-9f427df4468f/small.png?v=63931453833',
    'aldi': 'https://cdn.jafolders.com/shops/83bb328e-de66-47bc-8676-eb6a64ab1459/small.png?v=63931452771',
    'albert-heijn': 'https://cdn.jafolders.com/shops/74c1e78c-ac4c-48dc-84cc-a7ebb61be62a/small.png?v=63931452692',
    'jumbo': 'https://cdn.jafolders.com/shops/cafd54d7-c55b-4f09-8a61-81e1c5045c0c/small.png?v=63931454955',
    'spar': 'https://cdn.jafolders.com/shops/9d399cc4-dcfe-4f58-a666-a9fc239dfbc5/small.png?v=63931455726',
    'carrefour-market': 'https://cdn.jafolders.com/shops/f97d2dd4-27d6-4cb9-bc72-3d454a02e468/small.png?v=63931453359',
    'intermarche': 'https://cdn.jafolders.com/shops/64cf36b0-c448-4714-b197-8c88acb44c0e/small.png?v=63931454929',
    'gamma': 'https://cdn.jafolders.com/shops/102b4525-b46b-4095-b8ed-c8b831e09647/small.png?v=63931454094',
    'brico-bricoplanit': 'https://cdn.jafolders.com/shops/60b0026c-1f32-4b62-9a7d-dcac1ef05644/small.png?v=63931453056',
    'mediamarkt': 'https://cdn.jafolders.com/shops/21a3343f-b472-4bca-a2ca-76fe56258c4c/small.png?v=63931455331',
    'ikea': 'https://cdn.jafolders.com/shops/869aa8ce-3645-4223-bf66-65e82f01522c/small.png?v=63931454918',
    'renmans': 'https://cdn.jafolders.com/shops/b767e806-b139-4f31-893a-74bab5e6e7b9/small.png?v=63931455703',
    'bol-com': 'https://cdn.jafolders.com/shops/32c6e714-939e-4a51-b1cd-fba5989f889c/small.png?v=63931453081',
  };

  getRetailerLogo(slug: string): string {
    return this.retailerLogos[slug] || '';
  }

  topFoodDeals = computed(() =>
    [...this.dealService.deals()]
      .filter(d => d.categorySlug && FOOD_SLUGS.has(d.categorySlug))
      .sort((a, b) => b.discountPercentage - a.discountPercentage)
      .slice(0, 10)
  );

  recentDeals = computed(() => {
    const topIds = new Set(this.topFoodDeals().map(d => d.id));
    return [...this.dealService.deals()]
      .filter(d => !topIds.has(d.id))
      .slice(0, 8);
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

  constructor() {
    addIcons({ arrowForward, timerOutline, searchOutline, close,
               pricetagsOutline, heartOutline, eyeOutline, flashOutline });
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

  onSearch(event: CustomEvent) {
    const q = event.detail.value?.trim();
    if (q && q.length >= 2) {
      this.searchOpen.set(false);
      this.router.navigate(['/search'], { queryParams: { q } });
    }
  }
}
