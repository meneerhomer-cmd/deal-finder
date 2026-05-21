import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon,
  IonBadge, IonSpinner, IonChip, IonLabel, IonToast, IonFooter
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, arrowForward, cartOutline, checkmarkCircleOutline, openOutline, pricetagOutline, shareOutline, trendingDown, trendingUp, checkmarkCircle, trophyOutline, swapHorizontalOutline, flagOutline } from 'ionicons/icons';
import { environment } from '@env/environment';
import { DealService } from '../../services/deal.service';
import { ShoppingListService } from '../../services/shopping-list.service';
import { Deal, ProductResponse, getCategoryEmoji, getDiscountClass, CATEGORIES } from '../../models/deal.model';
import { CategoryAttributesComponent } from '../../components/category-attributes/category-attributes.component';
import { PosthogService } from '../../services/posthog.service';
import { HapticsService } from '../../services/haptics.service';

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
    DatePipe, DecimalPipe, RouterLink, CategoryAttributesComponent,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon,
    IonBadge, IonSpinner, IonChip, IonLabel, IonFooter
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home" text="Terug"></ion-back-button>
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
            @if (deal.expiringSoon && daysLeft() !== null) {
              <span class="expiring-tag">{{ daysLeft() === 1 ? 'NOG 1 DAG' : 'NOG ' + daysLeft() + ' DAGEN' }}</span>
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
            @if (deal.derivedUnitPrice != null && deal.derivedUnitLabel) {
              <span class="price-unit">€{{ deal.derivedUnitPrice | number:'1.2-2' }} {{ deal.derivedUnitLabel }}</span>
            }
            @if (deal.atLowestPrice && deal.lowestPriceSeen != null) {
              <span class="price-lowest">
                <ion-icon name="trending-down"></ion-icon>
                Beste prijs sinds we deze deal volgen
              </span>
            }
          </div>


          @if (crossRetailer(); as cr) {
            <a class="cross-retailer-banner" [routerLink]="['/product', cr.fingerprint]">
              <ion-icon name="trophy-outline"></ion-icon>
              <span class="crb-text">
                @if (cr.thisIsCheapest) {
                  <strong>Jij zit hier goedkoopst</strong> — vergelijk {{ cr.retailerCount }} winkels
                } @else {
                  <strong>Goedkoper elders</strong> — €{{ cr.cheapestPrice | number:'1.2-2' }} bij {{ cr.cheapestRetailer }}, bespaar €{{ cr.saving | number:'1.2-2' }}
                }
              </span>
              <ion-icon name="arrow-forward" class="crb-arrow"></ion-icon>
            </a>
          }

          @if (substitute(); as sub) {
            <div class="substitute-section">
              <h3><ion-icon name="swap-horizontal-outline"></ion-icon> Bespaar meer met een vergelijkbare optie</h3>
              <a class="substitute-card" [routerLink]="['/deal', sub.id]">
                <div class="sub-thumb">
                  @if (sub.imageUrl) {
                    <img [src]="sub.imageUrl" [alt]="sub.productName" />
                  } @else {
                    <span class="sub-emoji">{{ getCategoryEmoji(sub.categorySlug) }}</span>
                  }
                </div>
                <div class="sub-info">
                  <span class="sub-name">{{ sub.productName }}</span>
                  <span class="sub-meta">{{ sub.brand ? sub.brand + ' · ' : '' }}{{ sub.retailerName }}</span>
                  @if (sub.derivedUnitPrice != null && sub.derivedUnitLabel) {
                    <span class="sub-unit">€{{ sub.derivedUnitPrice | number:'1.2-2' }} {{ sub.derivedUnitLabel }}</span>
                  }
                </div>
                <div class="sub-price">
                  <span class="sub-current">€{{ sub.currentPrice | number:'1.2-2' }}</span>
                  <ion-icon name="arrow-forward"></ion-icon>
                </div>
              </a>
              @if (substituteSaving() !== null) {
                <span class="sub-saving">Bespaar €{{ substituteSaving() | number:'1.2-2' }} t.o.v. deze deal</span>
              }
              <button type="button" class="wrong-match" (click)="reportWrong(sub)">
                <ion-icon name="flag-outline"></ion-icon> Verkeerde match?
              </button>
            </div>
          }

          @if (productSummary()?.product?.categoryAttributesJson) {
            <app-category-attributes
              [category]="productSummary()!.product.category"
              [attributesJson]="productSummary()!.product.categoryAttributesJson">
            </app-category-attributes>
          }

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

          @if (priceSignal(); as sig) {
            <div class="price-signal" [class]="sig.direction">
              <ion-icon [name]="sig.direction === 'down' ? 'trending-down' : 'trending-up'"></ion-icon>
              <span>
                €{{ sig.amount | number:'1.2-2' }} {{ sig.direction === 'down' ? 'gedaald' : 'gestegen' }}
                sinds {{ sig.sinceDate | date:'d MMM' }}
              </span>
            </div>
          }
        </div>
      }
    </ion-content>

    @if (deal) {
      <ion-footer class="action-footer">
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
          <ion-button fill="outline" (click)="shareDeal()" aria-label="Delen">
            <ion-icon name="share-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </div>
      </ion-footer>
    }
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
    .price-lowest {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      margin-left: 6px;
      font-family: 'Space Mono', monospace;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--retro-yellow);
      background: var(--retro-ink);
      padding: 3px 8px 2px;
      border: 1.5px solid var(--retro-ink);
    }
    .price-lowest ion-icon { font-size: 0.95rem; }
    .price-unit {
      display: block;
      margin-top: 8px;
      font-family: 'Space Mono', monospace;
      font-size: 0.78rem;
      color: var(--retro-ink-soft);
      font-variant-numeric: tabular-nums;
    }

    .substitute-section {
      margin-bottom: 16px;
    }
    .substitute-section h3 {
      margin: 0 0 8px;
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      font-size: 1rem;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--retro-ink);
      display: flex; align-items: center; gap: 6px;
    }
    .substitute-section h3 ion-icon { font-size: 1.1rem; }
    .substitute-card {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px;
      background: var(--retro-newsprint-bright);
      border: 2px solid var(--retro-ink);
      box-shadow: 3px 3px 0 0 var(--retro-ink);
      text-decoration: none;
      color: var(--retro-ink);
      transition: transform 0.05s ease;
    }
    .substitute-card:active { transform: translate(1px, 1px); box-shadow: 2px 2px 0 0 var(--retro-ink); }
    .sub-thumb {
      width: 52px; height: 52px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border: 1.5px solid var(--retro-ink);
      background: var(--retro-newsprint);
      overflow: hidden;
    }
    .sub-thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .sub-emoji { font-size: 1.6rem; opacity: 0.6; }
    .sub-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .sub-name {
      font-family: 'Newsreader', Georgia, serif;
      font-size: 0.95rem; font-weight: 500;
      line-height: 1.2;
      color: var(--retro-ink);
    }
    .sub-meta {
      font-family: 'Archivo Narrow', sans-serif;
      font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.04em;
      color: var(--retro-ink-soft);
    }
    .sub-unit {
      font-family: 'Space Mono', monospace;
      font-size: 0.72rem; color: var(--retro-ink-soft);
      font-variant-numeric: tabular-nums;
    }
    .sub-price { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .sub-current {
      font-family: 'Anton', sans-serif;
      font-size: 1.5rem; line-height: 1;
      color: var(--retro-ink);
      font-variant-numeric: tabular-nums;
    }
    .sub-price ion-icon { font-size: 1rem; color: var(--retro-ink-soft); }
    .sub-saving {
      display: inline-block;
      margin-top: 8px;
      font-family: 'Space Mono', monospace;
      font-size: 0.72rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--retro-ink);
      background: var(--retro-yellow);
      padding: 3px 8px 2px;
      border: 1.5px solid var(--retro-ink);
    }
    .wrong-match {
      display: inline-flex; align-items: center; gap: 4px;
      margin: 8px 0 0 8px;
      background: transparent; border: none;
      font-family: 'Space Mono', monospace;
      font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em;
      color: var(--retro-ink-soft);
      text-decoration: underline;
      cursor: pointer;
      padding: 4px;
    }
    .wrong-match ion-icon { font-size: 0.85rem; }

    .action-footer {
      background: var(--retro-newsprint);
      border-top: 2px solid var(--retro-ink);
    }
    .action-buttons {
      display: flex; gap: 8px;
      padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
    }
    .action-buttons ion-button { --min-height: 48px; min-height: 48px; margin: 0; }
    .action-buttons ion-button:first-child { flex: 1; }

    .cross-retailer-banner {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 14px;
      padding: 12px 14px;
      background: var(--retro-yellow);
      border: 2px solid var(--retro-ink);
      box-shadow: 3px 3px 0 0 var(--retro-ink);
      text-decoration: none;
      color: var(--retro-ink);
      font-family: 'Archivo Narrow', sans-serif;
      font-size: 0.95rem;
      min-height: 44px;
      transition: transform 0.05s ease;
    }
    .cross-retailer-banner:active { transform: translate(1px, 1px); box-shadow: 2px 2px 0 0 var(--retro-ink); }
    .cross-retailer-banner ion-icon { font-size: 1.3rem; flex-shrink: 0; }
    .cross-retailer-banner .crb-text { flex: 1; }
    .cross-retailer-banner .crb-arrow { font-size: 1.1rem; }

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

    .price-signal {
      display: inline-flex; align-items: center; gap: 8px;
      margin: 4px 16px 16px;
      padding: 8px 12px;
      border: 2px solid var(--retro-ink);
      box-shadow: 3px 3px 0 0 var(--retro-ink);
      font-family: 'Space Mono', monospace;
      font-size: 0.82rem;
      font-weight: 700;
    }
    .price-signal ion-icon { font-size: 1.1rem; }
    .price-signal.down { background: var(--retro-yellow); color: var(--retro-ink); }
    .price-signal.up { background: var(--retro-red); color: white; }
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
  private haptics = inject(HapticsService);

  deal: Deal | undefined;
  imageError = false;
  priceHistory = signal<PriceHistoryEntry[]>([]);
  productSummary = signal<ProductResponse | null>(null);
  substitute = signal<Deal | null>(null);
  private static JSONLD_ID = 'deal-jsonld';

  // Fingerprint-based cross-retailer summary for the deal-detail banner.
  // Null (banner hidden) when the deal has no fingerprint or the product is
  // only at this one retailer.
  crossRetailer = computed(() => {
    const fp = this.deal?.fingerprint;
    const summary = this.productSummary();
    const thisPrice = this.deal?.currentPrice;
    if (!fp || !summary || thisPrice == null) return null;
    if (summary.product.retailerCount < 2) return null;
    const ds = summary.deals.filter(d => d.currentPrice != null);
    if (ds.length < 2) return null;
    const cheapest = ds.reduce((a, b) => (a.currentPrice! <= b.currentPrice! ? a : b));
    return {
      fingerprint: fp,
      retailerCount: summary.product.retailerCount,
      cheapestPrice: cheapest.currentPrice!,
      cheapestRetailer: cheapest.retailerName,
      saving: Math.max(0, thisPrice - cheapest.currentPrice!),
      thisIsCheapest: thisPrice <= cheapest.currentPrice!,
    };
  });

  getCategoryEmoji = getCategoryEmoji;
  getDiscountClass = getDiscountClass;

  // Savings of the substitute vs the current deal (savings-first framing).
  substituteSaving = computed<number | null>(() => {
    const sub = this.substitute();
    const current = this.deal?.currentPrice;
    if (!sub || sub.currentPrice == null || current == null) return null;
    const diff = current - sub.currentPrice;
    return diff > 0 ? diff : null;
  });

  // Whole days until the deal expires (for the "NOG X DAGEN" honesty tag).
  daysLeft = computed<number | null>(() => {
    if (!this.deal?.validUntil) return null;
    const until = new Date(this.deal.validUntil);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.ceil((until.getTime() - today.getTime()) / 86400000);
    return days >= 0 ? days : null;
  });

  constructor() {
    addIcons({ arrowBack, arrowForward, cartOutline, checkmarkCircleOutline, openOutline, pricetagOutline, shareOutline, trendingDown, trendingUp, trophyOutline, swapHorizontalOutline, flagOutline });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const existing = this.dealService.deals().find(d => d.id === id);
    if (existing) {
      this.setDeal(existing, id);
    } else {
      this.dealService.loadDeals().subscribe(deals => {
        const found = deals.find(d => d.id === id);
        if (found) {
          this.setDeal(found, id);
        } else {
          // Deal not in the (discount-filtered) list — fetch it directly.
          // Covers deals excluded from the default list: cashback deals
          // (discountPercentage 0), expired deals, and deep-linked/shared URLs.
          this.http.get<Deal>(`${environment.apiUrl}/deals/${id}`).subscribe({
            next: d => this.setDeal(d, id),
            error: () => {}
          });
        }
      });
    }
    if (this.shoppingList.items().length === 0) {
      this.shoppingList.loadItems().subscribe();
    }
  }

  private setDeal(deal: Deal, id: number) {
    this.deal = deal;
    this.loadPriceHistory(id);
    this.loadProductSummary(deal);
    this.loadSubstitute(id);
    this.trackDealViewed(deal);
  }

  private loadSubstitute(dealId: number) {
    this.substitute.set(null);
    this.dealService.getSubstitute(dealId).subscribe(sub => this.substitute.set(sub));
  }

  async reportWrong(sub: Deal) {
    if (!this.deal) return;
    this.dealService.reportWrongMatch(this.deal.id, sub.id).subscribe();
    this.substitute.set(null);
    const toast = await this.toastCtrl.create({
      message: 'Bedankt — we bekijken deze match.',
      duration: 2000,
      position: 'bottom',
      color: 'medium',
    });
    await toast.present();
  }

  // Single price-movement signal vs the oldest recorded price. Returns null
  // (section hidden) when stable or when there's no valid history. €0 entries
  // are filtered out — they're cashback/extraction artifacts, not real past prices.
  priceSignal = computed<{ direction: 'down' | 'up'; amount: number; sinceDate: string } | null>(() => {
    const current = this.deal?.currentPrice;
    if (current == null) return null;
    const valid = this.priceHistory().filter(h => h.price != null && h.price > 0);
    if (valid.length === 0) return null;
    const oldest = valid[valid.length - 1];
    const diff = oldest.price - current;
    if (Math.abs(diff) < 0.01) return null;
    return { direction: diff > 0 ? 'down' : 'up', amount: Math.abs(diff), sinceDate: oldest.recordedAt };
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
      this.haptics.success();
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

  private loadProductSummary(deal: Deal) {
    this.productSummary.set(null);
    if (!deal.fingerprint) return;
    this.http.get<ProductResponse>(`${environment.apiUrl}/products/${encodeURIComponent(deal.fingerprint)}?lang=nl`)
      .subscribe({
        next: r => this.productSummary.set(r),
        error: () => {} // silently hide banner on error
      });
  }
}
