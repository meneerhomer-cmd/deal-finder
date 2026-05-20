import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForward, storefront, pricetagOutline, trophyOutline } from 'ionicons/icons';
import { environment } from '@env/environment';
import { Deal, Product, ProductResponse, getCategoryEmoji } from '../../models/deal.model';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    DecimalPipe, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonIcon, IonSpinner
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ product()?.canonicalName || 'Product' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (loading()) {
        <div class="loading">
          <ion-spinner></ion-spinner>
          <p>Product laden...</p>
        </div>
      } @else if (!product()) {
        <div class="loading">
          <p>Dit product is niet gevonden.</p>
        </div>
      } @else {
        <div class="hero">
          @if (product()!.canonicalImageUrl && !imageError) {
            <img [src]="product()!.canonicalImageUrl" [alt]="product()!.canonicalName" class="hero-image" (error)="imageError = true" />
          } @else {
            <span class="hero-emoji">{{ getCategoryEmoji(product()!.category) }}</span>
          }
        </div>

        <div class="body">
          @if (product()!.brand) {
            <p class="brand">{{ product()!.brand }}</p>
          }
          <h1 class="name">{{ product()!.canonicalName }}</h1>
          <p class="availability">
            <ion-icon name="storefront"></ion-icon>
            Beschikbaar bij {{ product()!.retailerCount }} {{ product()!.retailerCount === 1 ? 'winkel' : 'winkels' }}
          </p>

          @if (savings(); as s) {
            <div class="savings-headline">
              <ion-icon name="trophy-outline"></ion-icon>
              <span>Goedkoopst bij <strong>{{ s.cheapestRetailer }}</strong> — bespaar €{{ s.amount | number:'1.2-2' }}</span>
            </div>
          }

          <!-- TODO #3-followup: per-category attribute renderer (item #5) slots here -->
          <!-- TODO #3-followup: unified price-history chart + Volg-dit-product button -->

          <div class="retailer-list">
            @for (d of sortedDeals(); track d.id; let i = $index) {
              <a [routerLink]="['/deal', d.id]" class="retailer-card" [class.cheapest]="i === 0 && sortedDeals().length > 1">
                <div class="rc-top">
                  <span class="rc-retailer">{{ d.retailerName }}</span>
                  @if (i === 0 && sortedDeals().length > 1) {
                    <span class="rc-badge">GOEDKOOPST</span>
                  }
                </div>
                <div class="rc-bottom">
                  <span class="rc-price">€{{ d.currentPrice | number:'1.2-2' }}</span>
                  @if (d.unitPrice) {
                    <span class="rc-unit">{{ d.unitPrice }}</span>
                  }
                  @if (d.discountPercentage > 0) {
                    <span class="rc-discount">−{{ d.discountPercentage }}%</span>
                  }
                  <ion-icon name="arrow-forward" class="rc-arrow"></ion-icon>
                </div>
              </a>
            }
          </div>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    :host {
      --retro-newsprint: #faf7f0;
      --retro-newsprint-bright: #fffdf7;
      --retro-ink: #0a0a0a;
      --retro-ink-soft: #4a4540;
      --retro-yellow: #ffd200;
      --retro-red: #e30613;
    }
    ion-content { --background: var(--retro-newsprint); }
    .loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; color: var(--retro-ink-soft); font-family: 'Archivo Narrow', sans-serif; }

    .hero {
      display: flex; align-items: center; justify-content: center;
      background: var(--retro-newsprint-bright);
      border-bottom: 2px solid var(--retro-ink);
      min-height: 220px; padding: 16px;
    }
    .hero-image { max-height: 240px; max-width: 100%; object-fit: contain; }
    .hero-emoji { font-size: 96px; }

    .body { padding: 16px; font-family: 'Archivo Narrow', system-ui, sans-serif; }
    .brand {
      display: inline-block; margin: 0 0 4px;
      background: var(--retro-yellow); color: var(--retro-ink);
      font-family: 'Space Mono', monospace; font-weight: 700; font-size: 0.78rem;
      padding: 2px 8px; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .name { font-family: 'Anton', sans-serif; font-weight: 400; font-size: 1.7rem; line-height: 1.1; margin: 4px 0 8px; color: var(--retro-ink); }
    .availability { display: flex; align-items: center; gap: 6px; color: var(--retro-ink-soft); font-size: 0.92rem; margin: 0 0 14px; }
    .availability ion-icon { font-size: 1.05rem; }

    .savings-headline {
      display: flex; align-items: center; gap: 8px;
      background: var(--retro-yellow); color: var(--retro-ink);
      border: 2px solid var(--retro-ink); box-shadow: 3px 3px 0 0 var(--retro-ink);
      padding: 10px 12px; margin: 0 0 18px;
      font-family: 'Archivo Narrow', sans-serif; font-size: 0.95rem;
    }
    .savings-headline ion-icon { font-size: 1.3rem; flex-shrink: 0; }

    .retailer-list { display: flex; flex-direction: column; gap: 10px; }
    .retailer-card {
      display: block; text-decoration: none; color: var(--retro-ink);
      background: var(--retro-newsprint-bright);
      border: 2px solid var(--retro-ink); box-shadow: 3px 3px 0 0 var(--retro-ink);
      padding: 10px 12px;
    }
    .retailer-card.cheapest { box-shadow: 3px 3px 0 0 var(--retro-red); border-color: var(--retro-red); }
    .rc-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .rc-retailer { font-family: 'Anton', sans-serif; font-size: 1.05rem; letter-spacing: 0.02em; }
    .rc-badge {
      background: var(--retro-red); color: #fff;
      font-family: 'Space Mono', monospace; font-weight: 700; font-size: 0.66rem;
      padding: 2px 6px; letter-spacing: 0.05em;
    }
    .rc-bottom { display: flex; align-items: baseline; gap: 10px; }
    .rc-price { font-family: 'Anton', sans-serif; font-size: 1.5rem; color: var(--retro-ink); }
    .rc-unit { font-family: 'Space Mono', monospace; font-size: 0.72rem; color: var(--retro-ink-soft); }
    .rc-discount { font-family: 'Space Mono', monospace; font-weight: 700; font-size: 0.8rem; color: var(--retro-red); }
    .rc-arrow { margin-left: auto; font-size: 1.1rem; color: var(--retro-ink-soft); }
  `]
})
export class ProductPage implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  product = signal<Product | null>(null);
  deals = signal<Deal[]>([]);
  loading = signal(true);
  imageError = false;
  getCategoryEmoji = getCategoryEmoji;

  sortedDeals = computed(() =>
    [...this.deals()].sort((a, b) => (a.currentPrice ?? Infinity) - (b.currentPrice ?? Infinity))
  );

  savings = computed<{ amount: number; cheapestRetailer: string } | null>(() => {
    const ds = this.sortedDeals().filter(d => d.currentPrice != null);
    if (ds.length < 2) return null;
    const cheapest = ds[0];
    const dearest = ds[ds.length - 1];
    const amount = (dearest.currentPrice ?? 0) - (cheapest.currentPrice ?? 0);
    if (amount < 0.01) return null;
    return { amount, cheapestRetailer: cheapest.retailerName };
  });

  constructor() {
    addIcons({ arrowForward, storefront, pricetagOutline, trophyOutline });
  }

  ngOnInit() {
    const fingerprint = this.route.snapshot.paramMap.get('fingerprint');
    if (!fingerprint) { this.loading.set(false); return; }
    this.http.get<ProductResponse>(`${environment.apiUrl}/products/${encodeURIComponent(fingerprint)}?lang=nl`)
      .subscribe({
        next: res => { this.product.set(res.product); this.deals.set(res.deals); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
  }
}
