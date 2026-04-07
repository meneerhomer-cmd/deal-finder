import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Deal, getCategoryEmoji, getDiscountClass } from '../../models/deal.model';

@Component({
  selector: 'app-deal-card',
  standalone: true,
  imports: [RouterLink, IonCard, IonCardHeader, IonCardTitle, IonCardContent, DatePipe, DecimalPipe],
  template: `
    <ion-card [routerLink]="['/deal', deal.id]" button>
      <ion-card-header>
        <div class="card-header-row">
          @if (deal.imageUrl) {
            <img [src]="deal.imageUrl" [alt]="deal.productName" class="deal-thumb" loading="lazy" />
          } @else {
            <span class="category-icon">{{ getCategoryEmoji(deal.categorySlug) }}</span>
          }
          <div class="header-content">
            <ion-card-title>{{ deal.productName }}</ion-card-title>
          </div>
          @if (deal.discountPercentage > 0) {
            <span class="discount-badge">
              -{{ deal.discountPercentage }}%
            </span>
          }
        </div>
      </ion-card-header>

      <ion-card-content>
        <div class="deal-info">
          @if (deal.discountPercentage > 0) {
            <div class="deal-type">
              <span class="deal-type-chip" [class]="getDiscountClass(deal.discountPercentage)">
                {{ deal.discountPercentage }}% korting
              </span>
              @if (deal.dealType) {
                <span class="deal-hint">{{ deal.dealType }}</span>
              }
            </div>
          }

          @if (deal.quantity || deal.conditions) {
            <div class="deal-extra">
              @if (deal.quantity) {
                <span>{{ deal.quantity }}</span>
              }
              @if (deal.conditions) {
                <span>{{ deal.conditions }}</span>
              }
            </div>
          }

          @if (deal.currentPrice || deal.originalPrice) {
            <div class="price-row">
              @if (deal.currentPrice) {
                <span class="price">€{{ deal.currentPrice | number:'1.2-2' }}</span>
              }
              @if (deal.originalPrice && deal.originalPrice !== deal.currentPrice) {
                <span class="original-price">€{{ deal.originalPrice | number:'1.2-2' }}</span>
              }
            </div>
          }

          <div class="meta-row">
            <span class="retailer-badge" [class]="deal.retailerSlug">
              {{ deal.retailerName }}
            </span>
            <span class="date-info">
              @if (deal.expiringSoon) {
                <span class="expiring-badge">Bijna verlopen!</span>
              } @else if (deal.validUntil) {
                <span class="valid-until">t/m {{ deal.validUntil | date:'d MMM' }}</span>
              }
            </span>
          </div>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    ion-card {
      margin: 8px 12px;
      border-radius: 14px;
      cursor: pointer;
      --background: var(--ion-card-background, white);
    }
    .card-header-row { display: flex; align-items: flex-start; gap: 12px; }
    .deal-thumb {
      width: 56px; height: 56px; border-radius: 10px;
      object-fit: cover; flex-shrink: 0;
      background: var(--ion-color-light);
    }
    .category-icon { font-size: 1.8rem; flex-shrink: 0; margin-top: 2px; }
    .header-content { flex: 1; min-width: 0; }
    ion-card-title {
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .discount-badge { flex-shrink: 0; font-size: 13px; padding: 4px 10px; }
    .deal-info { display: flex; flex-direction: column; gap: 8px; }
    .price-row { display: flex; align-items: baseline; gap: 10px; }
    .deal-type { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .deal-extra {
      display: flex;
      gap: 8px;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }
    .deal-hint {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      font-style: italic;
    }
    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 4px;
      border-top: 1px solid var(--ion-border-color, rgba(0,0,0,0.06));
    }
    .valid-until { font-size: 0.78rem; color: var(--ion-color-medium); }
    .expiring-badge {
      font-size: 0.72rem; font-weight: 600;
      background: var(--ion-color-warning); padding: 3px 8px;
      border-radius: 8px; color: #000;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `]
})
export class DealCardComponent {
  @Input({ required: true }) deal!: Deal;
  getCategoryEmoji = getCategoryEmoji;
  getDiscountClass = getDiscountClass;
}
