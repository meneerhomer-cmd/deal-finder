import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon,
  IonBadge, IonSpinner, IonChip, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cartOutline, checkmarkCircleOutline, openOutline, pricetagOutline, shareOutline, trendingDown, trendingUp } from 'ionicons/icons';
import { environment } from '@env/environment';
import { DealService } from '../../services/deal.service';
import { ShoppingListService } from '../../services/shopping-list.service';
import { Deal, getCategoryEmoji, getPromoKindClass, CATEGORIES } from '../../models/deal.model';

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
          <ion-back-button defaultHref="/deals"></ion-back-button>
        </ion-buttons>
        <ion-title>Deal Details</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (!deal) {
        <div class="loading">
          <ion-spinner></ion-spinner>
          <p>Deal laden...</p>
        </div>
      } @else {
        <div class="deal-hero">
          <span class="hero-emoji">{{ getCategoryEmoji(deal.category) }}</span>
          @if (deal.effectiveDiscount) {
            <span class="hero-discount">-{{ deal.effectiveDiscount }}%</span>
          }
        </div>

        <h1 class="deal-title">{{ deal.productName }}</h1>

        @if (deal.brand) {
          <p class="deal-brand">{{ deal.brand }}</p>
        }

        <div class="deal-meta">
          <span class="retailer-badge" [class]="deal.retailerSlug">{{ deal.retailerName }}</span>
          <span class="deal-type-chip" [class]="getPromoKindClass(deal.promoKind)">{{ deal.dealType }}</span>
          @if (deal.category) {
            <ion-chip>
              <ion-label>{{ getCategoryName(deal.category) }}</ion-label>
            </ion-chip>
          }
        </div>

        <ion-card>
          <ion-card-content>
            <div class="price-section">
              @if (deal.price) {
                <div class="current-price">€{{ deal.price | number:'1.2-2' }}</div>
              }
              @if (deal.originalPrice) {
                <div class="original-price-large">€{{ deal.originalPrice | number:'1.2-2' }}</div>
              }
              @if (deal.effectiveDiscount) {
                <div class="savings">
                  Je bespaart {{ deal.effectiveDiscount }}%
                </div>
              }
            </div>
          </ion-card-content>
        </ion-card>

        @if (priceHistory().length > 1) {
          <ion-card>
            <ion-card-header>
              <ion-card-title class="section-title">
                <ion-icon name="trending-down"></ion-icon>
                Prijsgeschiedenis
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="price-history">
                @for (entry of priceHistory(); track entry.id) {
                  <div class="history-row">
                    <span class="history-date">{{ entry.recordedAt | date:'d MMM yyyy' }}</span>
                    <span class="history-price">€{{ entry.price | number:'1.2-2' }}</span>
                    @if (entry.discountPercentage) {
                      <span class="history-discount">-{{ entry.discountPercentage }}%</span>
                    }
                  </div>
                }
              </div>
              @if (priceTrend()) {
                <div class="trend-summary" [class]="priceTrend()">
                  @if (priceTrend() === 'down') {
                    <ion-icon name="trending-down"></ion-icon>
                    Prijs is gedaald sinds eerste registratie
                  } @else {
                    <ion-icon name="trending-up"></ion-icon>
                    Prijs is gestegen sinds eerste registratie
                  }
                </div>
              }
            </ion-card-content>
          </ion-card>
        }

        <ion-card>
          <ion-card-content>
            <div class="info-grid">
              @if (deal.validUntil) {
                <div class="info-item">
                  <span class="info-label">Geldig tot</span>
                  <span class="info-value">{{ deal.validUntil | date:'d MMMM yyyy' }}</span>
                </div>
              }
              @if (deal.quantity) {
                <div class="info-item">
                  <span class="info-label">Hoeveelheid</span>
                  <span class="info-value">{{ deal.quantity }}</span>
                </div>
              }
            </div>
          </ion-card-content>
        </ion-card>

        <div class="actions">
          @if (isInList()) {
            <ion-button expand="block" color="success" disabled>
              <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
              Op je boodschappenlijst
            </ion-button>
          } @else {
            <ion-button expand="block" (click)="addToShoppingList()">
              <ion-icon name="cart-outline" slot="start"></ion-icon>
              Toevoegen aan boodschappenlijst
            </ion-button>
          }
          <ion-button expand="block" fill="outline" (click)="shareDeal()">
            <ion-icon name="share-outline" slot="start"></ion-icon>
            Deel deze deal
          </ion-button>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: var(--ion-color-medium);
    }

    .deal-hero {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px 0 16px;
    }

    .hero-emoji { font-size: 4rem; }

    .hero-discount {
      font-size: 2rem;
      font-weight: 700;
      background: var(--ion-color-danger);
      padding: 8px 16px;
      border-radius: 12px;
      color: white;
    }

    .deal-title {
      font-size: 1.4rem;
      font-weight: 700;
      text-align: center;
      margin: 0 0 4px;
    }

    .deal-brand {
      text-align: center;
      color: var(--ion-color-medium);
      margin: 0 0 16px;
    }

    .deal-meta {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .price-section { text-align: center; }

    .current-price {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--ion-color-success);
    }

    .original-price-large {
      font-size: 1.2rem;
      text-decoration: line-through;
      color: var(--ion-color-medium);
      margin-top: 4px;
    }

    .savings {
      margin-top: 8px;
      font-size: 1rem;
      color: var(--ion-color-success);
      font-weight: 500;
    }

    .section-title {
      font-size: 1rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .price-history {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .history-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 0;
      border-bottom: 1px solid var(--ion-color-light);
    }

    .history-row:last-child { border-bottom: none; }

    .history-date {
      flex: 1;
      font-size: 0.85rem;
      color: var(--ion-color-medium);
    }

    .history-price {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .history-discount {
      color: var(--ion-color-danger);
      font-weight: 500;
      font-size: 0.85rem;
    }

    .trend-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;

      &.down {
        background: var(--chip-multi-buy-bg);
        color: var(--chip-multi-buy-text);
      }

      &.up {
        background: var(--chip-price-drop-bg);
        color: var(--chip-price-drop-text);
      }
    }

    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
    }

    .info-label { color: var(--ion-color-medium); }
    .info-value { font-weight: 500; }

    .actions {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `]
})
export class DealDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private dealService = inject(DealService);
  private shoppingList = inject(ShoppingListService);

  deal: Deal | undefined;
  priceHistory = signal<PriceHistoryEntry[]>([]);

  getCategoryEmoji = getCategoryEmoji;
  getPromoKindClass = getPromoKindClass;

  constructor() {
    addIcons({ cartOutline, checkmarkCircleOutline, openOutline, pricetagOutline, shareOutline, trendingDown, trendingUp });
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

  priceTrend(): 'up' | 'down' | null {
    const history = this.priceHistory();
    if (history.length < 2) return null;
    const oldest = history[history.length - 1].price;
    const newest = history[0].price;
    if (newest < oldest) return 'down';
    if (newest > oldest) return 'up';
    return null;
  }

  getCategoryName(slug: string): string {
    const cat = CATEGORIES.find(c => c.slug === slug.toLowerCase());
    return cat ? `${cat.emoji} ${cat.name}` : slug;
  }

  isInList(): boolean {
    return this.deal ? this.shoppingList.isInList(this.deal.id) : false;
  }

  addToShoppingList() {
    if (!this.deal) return;
    this.shoppingList.addDeal(this.deal.id).subscribe();
  }

  async shareDeal() {
    if (!this.deal) return;
    const text = `${this.deal.productName} - ${this.deal.effectiveDiscount}% korting bij ${this.deal.retailerName}!`;
    if (navigator.share) {
      await navigator.share({ title: 'Deal Finder', text });
    } else {
      await navigator.clipboard.writeText(text);
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
