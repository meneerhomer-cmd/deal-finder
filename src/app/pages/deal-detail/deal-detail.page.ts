import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon,
  IonBadge, IonSpinner, IonChip, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cartOutline, checkmarkCircleOutline, openOutline, pricetagOutline } from 'ionicons/icons';
import { DealService } from '../../services/deal.service';
import { ShoppingListService } from '../../services/shopping-list.service';
import { Deal, getCategoryEmoji, getPromoKindClass, CATEGORIES } from '../../models/deal.model';

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
          @if (deal.pageNumber) {
            <ion-button expand="block" fill="outline" color="medium">
              <ion-icon name="pricetag-outline" slot="start"></ion-icon>
              Pagina {{ deal.pageNumber }} in folder
            </ion-button>
          }
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

    .hero-emoji {
      font-size: 4rem;
    }

    .hero-discount {
      font-size: 2rem;
      font-weight: 700;
      color: var(--ion-color-danger);
      background: var(--ion-color-danger-tint);
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

    .price-section {
      text-align: center;
    }

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

    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
    }

    .info-label {
      color: var(--ion-color-medium);
    }

    .info-value {
      font-weight: 500;
    }

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
  private dealService = inject(DealService);
  private shoppingList = inject(ShoppingListService);

  deal: Deal | undefined;

  getCategoryEmoji = getCategoryEmoji;
  getPromoKindClass = getPromoKindClass;

  constructor() {
    addIcons({ cartOutline, checkmarkCircleOutline, openOutline, pricetagOutline });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const existing = this.dealService.deals().find(d => d.id === id);
    if (existing) {
      this.deal = existing;
    } else {
      this.dealService.loadDeals().subscribe(deals => {
        this.deal = deals.find(d => d.id === id);
      });
    }
    if (this.shoppingList.items().length === 0) {
      this.shoppingList.loadItems().subscribe();
    }
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
}
