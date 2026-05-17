import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
            <span class="retailer-badge" [class]="deal.retailerSlug">{{ deal.retailerName }}</span>
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
              @if (deal.currentPrice) {
                <span class="price-current">€{{ deal.currentPrice | number:'1.2-2' }}</span>
              }
              @if (deal.originalPrice && deal.originalPrice !== deal.currentPrice) {
                <span class="price-original">€{{ deal.originalPrice | number:'1.2-2' }}</span>
              }
            </div>
            @if (deal.discountPercentage && deal.currentPrice && deal.originalPrice) {
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
    ion-content { --background: var(--ion-color-light, #f4f5f8); }

    .loading {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px; color: var(--ion-color-medium);
    }

    .hero {
      position: relative;
      display: flex; align-items: center; justify-content: center;
      background: white;
      min-height: 200px;
      padding: 20px;
    }
    .hero-image {
      max-width: 100%; max-height: 250px; object-fit: contain;
    }
    .hero-emoji { font-size: 5rem; }
    .hero-discount {
      position: absolute; top: 12px; right: 12px;
      background: #e53935; color: white;
      font-weight: 800; font-size: 1.1rem;
      padding: 6px 14px; border-radius: 12px;
    }

    .detail-body { padding: 16px; }

    .meta-row {
      display: flex; flex-wrap: wrap; gap: 8px;
      align-items: center; margin-bottom: 10px;
    }
    .deal-type-tag {
      font-size: 0.75rem; font-weight: 600; padding: 3px 10px;
      border-radius: 8px;
      background: var(--ion-color-success-tint, #e8f5e9);
      color: var(--ion-color-success-shade, #1b9e4b);
    }
    .expiring-tag {
      font-size: 0.72rem; font-weight: 600; padding: 3px 10px;
      border-radius: 8px; background: #fff3e0; color: #e65100;
    }

    .product-name {
      margin: 0 0 2px; font-size: 1.3rem; font-weight: 700;
      line-height: 1.3;
    }
    .brand-name {
      margin: 0 0 12px; font-size: 0.9rem;
      color: var(--ion-color-medium);
    }

    .price-block {
      background: white; border-radius: 14px;
      padding: 16px; margin-bottom: 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .price-row {
      display: flex; align-items: baseline; gap: 10px;
    }
    .price-current {
      font-size: 2.2rem; font-weight: 800;
      color: var(--ion-color-success, #2dd36f);
    }
    .price-original {
      font-size: 1.1rem; text-decoration: line-through;
      color: var(--ion-color-medium);
    }
    .price-saving {
      display: block; margin-top: 4px;
      font-size: 0.85rem; font-weight: 500;
      color: var(--ion-color-success-shade, #1b9e4b);
    }

    .action-buttons {
      display: flex; gap: 8px; margin-bottom: 16px;
    }
    .action-buttons ion-button { flex: 1; }

    .info-section {
      background: white; border-radius: 14px;
      padding: 14px 16px; margin-bottom: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .info-section h3 {
      margin: 0 0 10px; font-size: 0.85rem; font-weight: 600;
      text-transform: uppercase; color: var(--ion-color-medium);
      letter-spacing: 0.3px;
      display: flex; align-items: center; gap: 6px;
    }
    .info-grid { display: flex; flex-direction: column; gap: 8px; }
    .info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 8px; border-bottom: 1px solid var(--ion-color-light);
    }
    .info-row:last-child { border-bottom: none; padding-bottom: 0; }
    .info-label { font-size: 0.88rem; color: var(--ion-color-medium); }
    .info-value { font-size: 0.88rem; font-weight: 500; text-align: right; max-width: 55%; }
    .info-value.loyalty { color: var(--ion-color-warning-shade); }
    .history-pct { color: var(--ion-color-danger); margin-left: 6px; font-weight: 600; }

    .trend-pill {
      display: inline-flex; align-items: center; gap: 6px;
      margin-top: 10px; padding: 6px 12px; border-radius: 8px;
      font-size: 0.82rem; font-weight: 500;
    }
    .trend-pill.down { background: #e8f5e9; color: #2e7d32; }
    .trend-pill.up { background: #fce4ec; color: #c62828; }
  `]
})
export class DealDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private dealService = inject(DealService);
  private shoppingList = inject(ShoppingListService);
  private toastCtrl = inject(ToastController);

  deal: Deal | undefined;
  imageError = false;
  priceHistory = signal<PriceHistoryEntry[]>([]);

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
    } else {
      this.dealService.loadDeals().subscribe(deals => {
        this.deal = deals.find(d => d.id === id);
        if (this.deal) this.loadPriceHistory(id);
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
    this.shoppingList.addDeal(this.deal.id).subscribe(async () => {
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
    if (navigator.share) {
      await navigator.share({ title: 'Deal Finder', text, url });
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
    }
  }

  private loadPriceHistory(dealId: number) {
    this.http.get<PriceHistoryEntry[]>(`${environment.apiUrl}/deals/${dealId}/price-history`)
      .subscribe({
        next: history => this.priceHistory.set(history),
        error: () => {} // silently ignore if no history
      });
  }
}
