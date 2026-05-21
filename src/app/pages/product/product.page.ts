import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForward, storefront, pricetagOutline, trophyOutline, flagOutline } from 'ionicons/icons';
import { environment } from '@env/environment';
import { Deal, Product, ProductResponse, getCategoryEmoji } from '../../models/deal.model';
import { CategoryAttributesComponent } from '../../components/category-attributes/category-attributes.component';
import { DealService } from '../../services/deal.service';
import { HapticsService } from '../../services/haptics.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    DecimalPipe, RouterLink, CategoryAttributesComponent,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonIcon, IonSpinner
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home" text="Terug"></ion-back-button>
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
          @if (heroImage() && !imageError) {
            <img [src]="heroImage()" [alt]="product()!.canonicalName" class="hero-image" (error)="imageError = true" />
          } @else {
            <div class="hero-placeholder">
              <span class="hero-emoji">{{ getCategoryEmoji(product()!.category) }}</span>
              <span class="hero-noimg">Geen foto beschikbaar</span>
            </div>
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
          } @else if (sortedDeals().length > 1) {
            <div class="savings-headline same-price">
              <ion-icon name="storefront-outline"></ion-icon>
              <span>Zelfde prijs bij {{ sortedDeals().length }} winkels</span>
            </div>
          }

          @if (product()!.categoryAttributesJson) {
            <app-category-attributes
              [category]="product()!.category"
              [attributesJson]="product()!.categoryAttributesJson">
            </app-category-attributes>
          }

          <div class="retailer-list">
            @for (d of sortedDeals(); track d.id; let i = $index) {
              <div class="retailer-row">
                <a [routerLink]="['/deal', d.id]" class="retailer-card" [class.cheapest]="i === 0 && hasCheapest()" (click)="haptics.light()">
                  <div class="rc-top">
                    <span class="rc-retailer">{{ d.retailerName }}</span>
                    @if (i === 0 && hasCheapest()) {
                      <span class="rc-badge">GOEDKOOPST</span>
                    }
                  </div>
                  <div class="rc-bottom">
                    <span class="rc-price">€{{ d.currentPrice | number:'1.2-2' }}</span>
                    @if (d.derivedUnitPrice != null && d.derivedUnitLabel) {
                      <span class="rc-unit">€{{ d.derivedUnitPrice | number:'1.2-2' }} {{ d.derivedUnitLabel }}</span>
                    } @else if (d.unitPrice) {
                      <span class="rc-unit">{{ d.unitPrice }}</span>
                    }
                    @if (d.discountPercentage > 0) {
                      <span class="rc-discount">−{{ d.discountPercentage }}%</span>
                    }
                    <ion-icon name="arrow-forward" class="rc-arrow"></ion-icon>
                  </div>
                </a>
                @if (sortedDeals().length > 1) {
                  <button type="button" class="wrong-match" (click)="reportWrong(d)">
                    <ion-icon name="flag-outline"></ion-icon> Verkeerde match?
                  </button>
                }
              </div>
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
    .hero-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .hero-emoji { font-size: 84px; opacity: 0.55; }
    .hero-noimg {
      font-family: 'Space Mono', monospace; font-size: 0.72rem;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--retro-ink-soft);
    }

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
    .savings-headline.same-price { background: var(--retro-newsprint-bright); box-shadow: 3px 3px 0 0 var(--retro-ink-soft, #4a4540); }

    .retailer-list { display: flex; flex-direction: column; gap: 14px; }
    .retailer-row { display: flex; flex-direction: column; }
    .wrong-match {
      align-self: flex-end;
      display: inline-flex; align-items: center; gap: 4px;
      margin-top: 4px;
      background: transparent; border: none;
      font-family: 'Space Mono', monospace;
      font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.04em;
      color: var(--retro-ink-soft);
      text-decoration: underline;
      cursor: pointer; padding: 4px;
    }
    .wrong-match ion-icon { font-size: 0.8rem; }
    .retailer-card {
      display: block; text-decoration: none; color: var(--retro-ink);
      background: var(--retro-newsprint-bright);
      border: 2px solid var(--retro-ink); box-shadow: 3px 3px 0 0 var(--retro-ink);
      padding: 10px 12px;
    }
    .retailer-card.cheapest { box-shadow: 3px 3px 0 0 var(--retro-red); border-color: var(--retro-red); }
    .retailer-card { transition: transform 0.05s ease; }
    .retailer-card:active { transform: translate(1px, 1px); box-shadow: 2px 2px 0 0 var(--retro-ink); }
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
  private dealService = inject(DealService);
  private toastCtrl = inject(ToastController);
  haptics = inject(HapticsService);

  product = signal<Product | null>(null);
  deals = signal<Deal[]>([]);
  loading = signal(true);
  imageError = false;
  getCategoryEmoji = getCategoryEmoji;

  // Hero photo: prefer the canonical image, but if it's missing fall back to
  // ANY retailer deal in this group that has a flyer crop — beats a bare emoji.
  heroImage = computed<string | null>(() => {
    const canonical = this.product()?.canonicalImageUrl;
    if (canonical) return canonical;
    return this.deals().find(d => !!d.imageUrl)?.imageUrl ?? null;
  });

  sortedDeals = computed(() =>
    [...this.deals()].sort((a, b) => (a.currentPrice ?? Infinity) - (b.currentPrice ?? Infinity))
  );

  // True only when the first (sorted) deal is STRICTLY cheaper than the next —
  // so we don't badge "GOEDKOOPST" when every retailer has the same price.
  hasCheapest = computed(() => {
    const ds = this.sortedDeals();
    if (ds.length < 2) return false;
    return (ds[0].currentPrice ?? Infinity) < (ds[1].currentPrice ?? Infinity);
  });

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
    addIcons({ arrowForward, storefront, pricetagOutline, trophyOutline, flagOutline });
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

  /** Report that this retailer row was wrongly grouped with the rest. Pairs it
   *  with the cheapest deal as the anchor (or the next one if it IS cheapest). */
  async reportWrong(d: Deal) {
    const sorted = this.sortedDeals();
    const anchor = sorted[0].id === d.id ? sorted[1] : sorted[0];
    if (!anchor) return;
    this.dealService.reportWrongMatch(d.id, anchor.id).subscribe();
    this.deals.update(list => list.filter(x => x.id !== d.id));
    const toast = await this.toastCtrl.create({
      message: 'Bedankt — we bekijken deze match.',
      duration: 2000,
      position: 'bottom',
      color: 'medium',
    });
    await toast.present();
  }
}
