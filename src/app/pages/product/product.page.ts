import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
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
            <img [src]="heroImage()" [alt]="product()!.canonicalName" class="hero-image" (error)="imageError = true" (click)="imageZoomed.set(true)" />
          } @else {
            <div class="hero-placeholder">
              <span class="hero-emoji">{{ getCategoryEmoji(product()!.category) }}</span>
              <span class="hero-noimg">Geen foto beschikbaar</span>
            </div>
          }
        </div>

        @if (imageZoomed() && heroImage()) {
          <div class="img-lightbox" (click)="imageZoomed.set(false)">
            <img [src]="heroImage()" [alt]="product()!.canonicalName" />
            <button type="button" class="lightbox-close" aria-label="Sluit">&times;</button>
          </div>
        }

        <div class="body">
          @if (product()!.brand) {
            <p class="brand">{{ product()!.brand }}</p>
          }
          <h1 class="name">{{ product()!.canonicalName }}</h1>
          <p class="availability">
            <ion-icon name="storefront"></ion-icon>
            Beschikbaar bij {{ product()!.retailerCount }} {{ product()!.retailerCount === 1 ? 'winkel' : 'winkels' }}
          </p>

          @if (unitCheapest(); as u) {
            <div class="savings-headline">
              <ion-icon name="trophy-outline"></ion-icon>
              <span>Goedkoopst per {{ u.word }}: <strong>{{ u.retailer }}</strong> — €{{ u.unitPrice | number:'1.2-2' }}/{{ u.word }}@if (u.pct > 0) {<span class="pct"> · {{ u.pct }}% goedkoper</span>}</span>
            </div>
          } @else if (absoluteSavings(); as s) {
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
                      <span class="rc-badge">{{ cheapestBadge() }}</span>
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
    .hero-image { max-height: 240px; max-width: 100%; object-fit: contain; cursor: zoom-in; }
    .img-lightbox {
      position: fixed; inset: 0; z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      background: rgba(10, 10, 10, 0.92); padding: 16px; cursor: zoom-out;
    }
    .img-lightbox img { max-width: 100%; max-height: 100%; object-fit: contain; border: 2px solid var(--retro-ink); background: #fff; }
    .lightbox-close {
      position: absolute; top: 12px; right: 16px;
      background: transparent; border: none; color: #fff;
      font-size: 2.4rem; line-height: 1; cursor: pointer; padding: 4px 10px;
    }
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
  private router = inject(Router);
  private http = inject(HttpClient);
  private dealService = inject(DealService);
  private toastCtrl = inject(ToastController);
  haptics = inject(HapticsService);

  product = signal<Product | null>(null);
  deals = signal<Deal[]>([]);
  loading = signal(true);
  imageError = false;
  imageZoomed = signal(false);
  getCategoryEmoji = getCategoryEmoji;

  // Hero photo: prefer the canonical image, but if it's missing fall back to
  // ANY retailer deal in this group that has a flyer crop — beats a bare emoji.
  heroImage = computed<string | null>(() => {
    const canonical = this.product()?.canonicalImageUrl;
    if (canonical) return canonical;
    return this.deals().find(d => !!d.imageUrl)?.imageUrl ?? null;
  });

  // The unit shared by most deals in this group (e.g. "€/wasbeurt"). Comparing by
  // unit price is the only fair way across different sizes/forms (a small liquid
  // vs a big pods bundle) — and the data is already extracted, so it costs nothing.
  // Needs ≥2 deals sharing a unit to be useful.
  private unitLabel = computed<string | null>(() => {
    const counts = new Map<string, number>();
    for (const d of this.deals()) {
      if (d.derivedUnitPrice != null && d.derivedUnitLabel) {
        counts.set(d.derivedUnitLabel, (counts.get(d.derivedUnitLabel) ?? 0) + 1);
      }
    }
    let best: string | null = null, n = 0;
    for (const [label, c] of counts) if (c > n) { best = label; n = c; }
    return n >= 2 ? best : null;
  });

  // Deals sharing the dominant unit, cheapest-per-unit first.
  unitComparable = computed<Deal[]>(() => {
    const label = this.unitLabel();
    if (!label) return [];
    return this.deals()
      .filter(d => d.derivedUnitLabel === label && d.derivedUnitPrice != null)
      .sort((a, b) => (a.derivedUnitPrice as number) - (b.derivedUnitPrice as number));
  });

  // Unit-comparable deals first (by €/unit), then any others by absolute price.
  sortedDeals = computed<Deal[]>(() => {
    const comp = this.unitComparable();
    if (comp.length >= 2) {
      const ids = new Set(comp.map(d => d.id));
      const rest = this.deals()
        .filter(d => !ids.has(d.id))
        .sort((a, b) => (a.currentPrice ?? Infinity) - (b.currentPrice ?? Infinity));
      return [...comp, ...rest];
    }
    return [...this.deals()].sort((a, b) => (a.currentPrice ?? Infinity) - (b.currentPrice ?? Infinity));
  });

  // GOEDKOOPST: a strict unit-price winner when we have unit data; otherwise the
  // strict absolute winner, but only when the spread is plausible (>2.2x usually
  // means mismatched sizes/forms, not a real saving).
  hasCheapest = computed(() => {
    const comp = this.unitComparable();
    if (comp.length >= 2) {
      return (comp[0].derivedUnitPrice as number) < (comp[1].derivedUnitPrice as number);
    }
    const ds = this.sortedDeals();
    if (ds.length < 2) return false;
    const lo = ds[0].currentPrice ?? Infinity, nextLo = ds[1].currentPrice ?? Infinity;
    const hi = ds[ds.length - 1].currentPrice ?? 0;
    return lo < nextLo && (lo > 0 ? hi / lo : 99) <= 2.2;
  });

  // Badge text reflects the comparison basis so a high-absolute-price winner
  // (cheapest *per wash*) doesn't read as a mistake.
  cheapestBadge = computed(() =>
    this.unitComparable().length >= 2
      ? 'BESTE €/' + this.unitWord(this.unitComparable()[0].derivedUnitLabel).toUpperCase()
      : 'GOEDKOOPST'
  );

  // Headline: cheapest per unit + how much cheaper than the dearest comparable.
  unitCheapest = computed<{ retailer: string; unitPrice: number; word: string; pct: number } | null>(() => {
    const comp = this.unitComparable();
    if (comp.length < 2) return null;
    const cheapest = comp[0], dearest = comp[comp.length - 1];
    const cp = cheapest.derivedUnitPrice as number, dp = dearest.derivedUnitPrice as number;
    if (dp - cp < 0.001) return null;
    return { retailer: cheapest.retailerName, unitPrice: cp, word: this.unitWord(cheapest.derivedUnitLabel), pct: Math.round((1 - cp / dp) * 100) };
  });

  // Absolute-price savings — only as a fallback when there's no unit data AND the
  // spread is plausible (so we never claim a bogus saving across mismatched sizes).
  absoluteSavings = computed<{ amount: number; cheapestRetailer: string } | null>(() => {
    if (this.unitComparable().length >= 2) return null;
    const ds = this.sortedDeals().filter(d => d.currentPrice != null);
    if (ds.length < 2) return null;
    const lo = ds[0].currentPrice as number, hi = ds[ds.length - 1].currentPrice as number;
    if (hi - lo < 0.01 || (lo > 0 && hi / lo > 2.2)) return null;
    return { amount: hi - lo, cheapestRetailer: ds[0].retailerName };
  });

  private unitWord(label: string | null | undefined): string {
    return (label ?? '').replace(/^€\s*\/\s*/, '');
  }

  constructor() {
    addIcons({ arrowForward, storefront, pricetagOutline, trophyOutline, flagOutline });
  }

  ngOnInit() {
    const fingerprint = this.route.snapshot.paramMap.get('fingerprint');
    if (!fingerprint) { this.loading.set(false); return; }
    this.http.get<ProductResponse>(`${environment.apiUrl}/products/${encodeURIComponent(fingerprint)}?lang=nl`)
      .subscribe({
        next: res => {
          // A single-retailer "comparison" is just one deal — send the user
          // straight to the richer, consistent deal-detail page instead of a
          // sparse one-row product page. replaceUrl keeps Back sensible.
          if (res.deals.length === 1) {
            this.router.navigate(['/deal', res.deals[0].id], { replaceUrl: true });
            return;
          }
          this.product.set(res.product); this.deals.set(res.deals); this.loading.set(false);
        },
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
