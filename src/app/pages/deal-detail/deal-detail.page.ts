import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon,
  IonBadge, IonSpinner, IonChip, IonLabel, IonToast
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, cartOutline, checkmarkCircleOutline, openOutline, pricetagOutline, shareOutline, trendingDown, trendingUp, checkmarkCircle } from 'ionicons/icons';
import { environment } from '@env/environment';
import { DealService } from '../../services/deal.service';
import { ShoppingListService } from '../../services/shopping-list.service';
import { Deal, getCategoryEmoji, getDiscountClass, CATEGORIES } from '../../models/deal.model';
import { PosthogService } from '../../services/posthog.service';

interface PriceHistoryEntry {
  id: number;
  price: number;
  originalPrice: number | null;
  discountPercentage: number | null;
  recordedAt: string;
}

@Component({
  selector: 'app-deal-detail',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon,
    IonBadge, IonSpinner, IonChip, IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ deal?.productName || 'Deal' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (!deal) {
        <div class="loading">
          <ion-spinner></ion-spinner>
          <p>Deal laden...</p>
        </div>
      } @else {
        <div class="hero">
          @if (deal.imageUrl && !imageError) {
            <img [src]="deal.imageUrl" [alt]="deal.productName" class="hero-image" (error)="imageError = true" />
          } @else {
            <span class="hero-emoji">{{ getCategoryEmoji(deal.categorySlug) }}</span>
          }
          @if (deal.discountPercentage) {
            <span class="hero-discount">-{{ deal.discountPercentage }}%</span>
          }
        </div>

        <div class="detail-body">
          <div class="meta-row">
            <span class="retailer-badge {{ deal.retailerSlug }}">{{ deal.retailerName }}</span>
            @if (deal.dealType) {
              <span class="deal-type-tag">{{ deal.dealType }}</span>
            }
            @if (deal.expiringSoon) {
              <span class="expiring-tag">Bijna verlopen!</span>
            }
          </div>

          <h1 class="product-name">{{ deal.productName }}</h1>
          @if (deal.brand) {
            <p class="brand-name">{{ deal.brand }}</p>
          }

          <div class="price-block">
            <div class="price-row">
              @if (deal.currentPrice === 0) {
                <span class="price-current price-free">GRATIS</span>
              } @else if (deal.currentPrice != null) {
                <span class="price-current">€{{ deal.currentPrice | number:'1.2-2' }}</span>
              }
              @if (deal.originalPrice != null && deal.originalPrice !== deal.currentPrice) {
                <span class="price-original">€{{ deal.originalPrice | number:'1.2-2' }}</span>
              }
            </div>
            @if (deal.discountPercentage && deal.currentPrice != null && deal.originalPrice != null) {
              <span class="price-saving">Je bespaart €{{ (deal.originalPrice - deal.currentPrice) | number:'1.2-2' }}</span>
            }
          </div>

          <div class="action-buttons">
            @if (isInList()) {
              <ion-button expand="block" color="success" disabled>
                <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                Op je lijst
              </ion-button>
            } @else {
              <ion-button expand="block" (click)="addToShoppingList()">
                <ion-icon name="cart-outline" slot="start"></ion-icon>
                Toevoegen aan lijst
              </ion-button>
            }
            <ion-button expand="block" fill="outline" (click)="shareDeal()">
              <ion-icon name="share-outline" slot="start"></ion-icon>
              Delen
            </ion-button>
          </div>

          @if (deal.quantity || deal.unitPrice || deal.conditions || deal.loyaltyCard || deal.validUntil || deal.categorySlug) {
            <div class="info-section">
              <h3>Details</h3>
              <div class="info-grid">
                @if (deal.quantity) {
                  <div class="info-row"><span class="info-label">Hoeveelheid</span><span class="info-value">{{ deal.quantity }}</span></div>
                }
                @if (deal.unitPrice) {
                  <div class="info-row"><span class="info-label">Eenheidsprijs</span><span class="info-value">{{ deal.unitPrice }}</span></div>
                }
                @if (deal.conditions) {
                  <div class="info-row"><span class="info-label">Voorwaarden</span><span class="info-value">{{ deal.conditions }}</span></div>
                }
                @if (deal.loyaltyCard) {
                  <div class="info-row"><span class="info-label">Klantenkaart</span><span class="info-value loyalty">{{ deal.loyaltyCard }}</span></div>
                }
                @if (deal.validUntil) {
                  <div class="info-row"><span class="info-label">Geldig tot</span><span class="info-value">{{ deal.validUntil | date:'d MMM yyyy' }}</span></div>
                }
                @if (deal.categorySlug) {
                  <div class="info-row"><span class="info-label">Categorie</span><span class="info-value">{{ getCategoryName(deal.categorySlug!) }}</span></div>
                }
              </div>
            </div>
          }

          @if (priceHistory().length > 1) {
            <div class="info-section">
              <h3><ion-icon name="trending-down"></ion-icon> Prijsgeschiedenis</h3>
              <div class="info-grid">
                @for (entry of priceHistory(); track entry.id) {
                  <div class="info-row">
                    <span class="info-label">{{ entry.recordedAt | date:'d MMM yyyy' }}</span>
                    <span class="info-value">
                      €{{ entry.price | number:'1.2-2' }}
                      @if (entry.discountPercentage) {
                        <span class="history-pct">-{{ entry.discountPercentage }}%</span>
                      }
                    </span>
                  </div>
                }
              </div>
              @if (priceTrend()) {
                <div class="trend-pill" [class]="priceTrend()">
                  <ion-icon [name]="priceTrend() === 'down' ? 'trending-down' : 'trending-up'"></ion-icon>
                  {{ priceTrend() === 'down' ? 'Prijs gedaald' : 'Prijs gestegen' }}
                </div>
              }
            </div>
          }
        </div>
      }
    </ion-content>
  `,
  styles: [`
    ion-content { --background: var(--retro-newsprint); }

    .loading {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px; color: var(--retro-ink-soft);
      font-family: 'Space Mono', monospace;
    }

    .hero {
      position: relative;
      display: flex; align-items: center; justify-content: center;
      background:
        radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 0.5px, transparent 0.5px) 0 0 / 5px 5px,
        var(--retro-newsprint-bright);
      min-height: 220px;
      padding: 24px;
      border-bottom: 2px solid var(--retro-ink);
    }
    .hero-image {
      max-width: 100%; max-height: 260px; object-fit: contain;
    }
    .hero-emoji { font-size: 5rem; opacity: 0.6; }
    .hero-discount {
      position: absolute; top: 14px; right: -6px;
      background: var(--retro-red);
      color: white;
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      font-weight: 400;
      font-size: 2rem;
      line-height: 1;
      padding: 10px 16px 8px;
      border: 2.5px solid var(--retro-ink);
      transform: rotate(-3deg);
      box-shadow: 3px 3px 0 0 var(--retro-ink);
      letter-spacing: -0.01em;
      font-variant-numeric: tabular-nums;
    }

    .detail-body { padding: 20px 16px 16px; }

    .meta-row {
      display: flex; flex-wrap: wrap; gap: 8px;
      align-items: center; margin-bottom: 14px;
    }
    .deal-type-tag {
      font-family: 'Space Mono', monospace;
      font-size: 0.7rem; font-weight: 700;
      padding: 3px 8px 2px;
      border: 1.5px solid var(--retro-ink);
      background: var(--retro-yellow);
      color: var(--retro-ink);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      box-shadow: 1.5px 1.5px 0 0 var(--retro-ink);
    }
    .expiring-tag {
      font-family: 'Space Mono', monospace;
      font-size: 0.7rem; font-weight: 700;
      padding: 3px 8px 2px;
      border: 1.5px solid var(--retro-ink);
      background: var(--retro-red);
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      box-shadow: 1.5px 1.5px 0 0 var(--retro-ink);
    }

    .product-name {
      margin: 0 0 4px;
      font-family: 'Newsreader', Georgia, serif;
      font-size: 1.5rem; font-weight: 500;
      line-height: 1.25;
      letter-spacing: -0.01em;
      color: var(--retro-ink);
    }
    .brand-name {
      display: inline-block;
      margin: 0 0 14px;
      font-family: 'Archivo Narrow', system-ui, sans-serif;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--retro-ink);
      background: linear-gradient(to top, var(--retro-yellow) 0%, var(--retro-yellow) 50%, transparent 50%);
      padding: 0 4px 1px;
    }

    .price-block {
      background: var(--retro-newsprint-bright);
      border-radius: 0;
      border: 2px solid var(--retro-ink);
      padding: 18px 18px 16px;
      margin-bottom: 16px;
      box-shadow: 3px 3px 0 0 var(--retro-ink);
    }
    .price-row {
      display: flex; align-items: baseline; gap: 12px;
      flex-wrap: wrap;
    }
    .price-current {
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      font-weight: 400;
      font-size: 2.6rem;
      line-height: 1;
      letter-spacing: -0.02em;
      color: var(--retro-ink);
      font-variant-numeric: tabular-nums;
    }
    .price-current.price-free {
      background: var(--retro-yellow);
      color: var(--retro-ink);
      padding: 4px 10px 2px;
      border: 2px solid var(--retro-ink);
      box-shadow: 2px 2px 0 0 var(--retro-ink);
      letter-spacing: 0.02em;
      font-size: 2.2rem;
    }
    .price-original {
      font-family: 'Newsreader', Georgia, serif;
      font-style: italic;
      font-size: 1.05rem;
      font-weight: 400;
      color: var(--retro-ink-soft);
      font-variant-numeric: tabular-nums;
      position: relative;
      padding: 0 2px;
      text-decoration: none;
    }
    .price-original::after {
      content: '';
      position: absolute;
      left: -2px; right: -2px;
      top: 52%;
      height: 2px;
      background: var(--retro-ink);
      transform: rotate(-6deg);
      transform-origin: center;
    }
    .price-saving {
      display: inline-block;
      margin-top: 10px;
      font-family: 'Space Mono', monospace;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--retro-ink);
      background: var(--retro-yellow);
      padding: 3px 8px 2px;
      border: 1.5px solid var(--retro-ink);
    }

    .action-buttons {
      display: flex; gap: 8px; margin-bottom: 18px;
    }
    .action-buttons ion-button { flex: 1; --min-height: 44px; min-height: 44px; }

    .info-section {
      background: var(--retro-newsprint-bright);
      border-radius: 0;
      border: 2px solid var(--retro-ink);
      padding: 16px 18px;
      margin-bottom: 14px;
      box-shadow: 3px 3px 0 0 var(--retro-ink);
    }
    .info-section h3 {
      margin: 0 0 12px;
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      font-size: 1rem;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--retro-ink);
      display: flex; align-items: center; gap: 8px;
      border-bottom: 1.5px solid var(--retro-ink);
      padding-bottom: 6px;
    }
    .info-grid { display: flex; flex-direction: column; gap: 0; }
    .info-row {
      display: flex; justify-content: space-between; align-items: baseline;
      padding: 8px 0;
      border-bottom: 1px solid var(--retro-ink-hairline);
    }
    .info-row:last-child { border-bottom: none; padding-bottom: 0; }
    .info-label {
      font-family: 'Space Mono', monospace;
      font-size: 0.72rem;
      font-weight: 400;
      color: var(--retro-ink-soft);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .info-value {
      font-family: 'Newsreader', Georgia, serif;
      font-size: 0.95rem;
      font-weight: 500;
      text-align: right;
      max-width: 60%;
      color: var(--retro-ink);
    }
    .info-value.loyalty { color: var(--retro-red); }
    .history-pct {
      color: var(--retro-red);
      margin-left: 8px;
      font-family: 'Space Mono', monospace;
      font-weight: 700;
      font-size: 0.78rem;
    }

    .trend-pill {
      display: inline-flex; align-items: center; gap: 6px;
      margin-top: 12px;
      padding: 4px 10px;
      border-radius: 0;
      border: 1.5px solid var(--retro-ink);
      font-family: 'Space Mono', monospace;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .trend-pill.down { background: var(--retro-yellow); color: var(--retro-ink); }
    .trend-pill.up { background: var(--retro-red); color: white; }
  `]
})
export class DealDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private dealService = inject(DealService);
  private shoppingList = inject(ShoppingListService);
  private toastCtrl = inject(ToastController);
  private posthog = inject(PosthogService);

  deal: Deal | undefined;
  imageError = false;
  priceHistory = signal<PriceHistoryEntry[]>([]);
  private static JSONLD_ID = 'deal-jsonld';

  getCategoryEmoji = getCategoryEmoji;
  getDiscountClass = getDiscountClass;

  constructor() {
    addIcons({ arrowBack, cartOutline, checkmarkCircleOutline, openOutline, pricetagOutline, shareOutline, trendingDown, trendingUp });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const existing = this.dealService.deals().find(d => d.id === id);
    if (existing) {
      this.deal = existing;
      this.loadPriceHistory(id);
      this.trackDealViewed(existing);
    } else {
      this.dealService.loadDeals().subscribe(deals => {
        this.deal = deals.find(d => d.id === id);
        if (this.deal) {
          this.loadPriceHistory(id);
          this.trackDealViewed(this.deal);
        }
      });
    }
    if (this.shoppingList.items().length === 0) {
      this.shoppingList.loadItems().subscribe();
    }
  }

  priceTrend = computed<'up' | 'down' | null>(() => {
    const history = this.priceHistory();
    if (history.length < 2) return null;
    const oldest = history[history.length - 1].price;
    const newest = history[0].price;
    if (newest < oldest) return 'down';
    if (newest > oldest) return 'up';
    return null;
  });

  getCategoryName(slug: string): string {
    const cat = CATEGORIES.find(c => c.slug === slug.toLowerCase());
    return cat ? `${cat.emoji} ${cat.name}` : slug;
  }

  isInList(): boolean {
    return this.deal ? this.shoppingList.isInList(this.deal.id) : false;
  }

  addToShoppingList() {
    if (!this.deal) return;
    const deal = this.deal;
    this.shoppingList.addDeal(deal.id).subscribe(async () => {
      this.posthog.posthog.capture('deal_added_to_shopping_list', {
        deal_id: deal.id,
        product_name: deal.productName,
        retailer: deal.retailerName,
        discount_percentage: deal.discountPercentage,
        current_price: deal.currentPrice,
        category: deal.categorySlug,
      });
      const toast = await this.toastCtrl.create({
        message: 'Toegevoegd aan je boodschappenlijst!',
        duration: 1500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle',
      });
      await toast.present();
    });
  }

  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/home']);
    }
  }

  async shareDeal() {
    if (!this.deal) return;
    const url = `${window.location.origin}/deal/${this.deal.id}`;
    const text = `${this.deal.productName} - ${this.deal.discountPercentage}% korting bij ${this.deal.retailerName}!`;
    const canShare = 'share' in navigator;
    const method = canShare ? 'native' : 'clipboard';
    if (canShare) {
      await navigator.share({ title: 'Deal Finder', text, url });
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
    }
    this.posthog.posthog.capture('deal_shared', {
      deal_id: this.deal.id,
      product_name: this.deal.productName,
      retailer: this.deal.retailerName,
      share_method: method,
    });
  }

  private trackDealViewed(deal: Deal) {
    this.posthog.posthog.capture('deal_viewed', {
      deal_id: deal.id,
      product_name: deal.productName,
      retailer: deal.retailerName,
      discount_percentage: deal.discountPercentage,
      current_price: deal.currentPrice,
      category: deal.categorySlug,
      expiring_soon: deal.expiringSoon,
    });
    this.injectProductJsonLd(deal);
  }

  /**
   * Inject schema.org/Product structured data so Google's rich-results crawler
   * can index the deal as a product with price + retailer. Replaces any
   * existing JSON-LD block when navigating between deals. Cleaned up on
   * component destroy so non-deal pages don't keep stale data.
   */
  private injectProductJsonLd(deal: Deal) {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById(DealDetailPage.JSONLD_ID);
    if (existing) existing.remove();

    const payload: Record<string, any> = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: deal.productName,
      image: deal.imageUrl || undefined,
      brand: deal.brand ? { '@type': 'Brand', name: deal.brand } : undefined,
      category: deal.categoryName || undefined,
      offers: {
        '@type': 'Offer',
        url: `https://promo-finder-be.web.app/deal/${deal.id}`,
        priceCurrency: 'EUR',
        price: deal.currentPrice != null ? String(deal.currentPrice) : undefined,
        priceValidUntil: deal.validUntil || undefined,
        availability: deal.expired ? 'https://schema.org/Discontinued' : 'https://schema.org/InStock',
        seller: deal.retailerName ? { '@type': 'Organization', name: deal.retailerName } : undefined,
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = DealDetailPage.JSONLD_ID;
    script.textContent = JSON.stringify(payload);
    document.head.appendChild(script);
  }

  ngOnDestroy() {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById(DealDetailPage.JSONLD_ID);
    if (existing) existing.remove();
  }

  private loadPriceHistory(dealId: number) {
    this.http.get<PriceHistoryEntry[]>(`${environment.apiUrl}/deals/${dealId}/price-history`)
      .subscribe({
        next: history => this.priceHistory.set(history),
        error: () => {} // silently ignore if no history
      });
  }
}
