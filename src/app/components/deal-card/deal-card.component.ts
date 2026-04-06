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
          <span class="category-icon">{{ getCategoryEmoji(deal.categorySlug) }}</span>
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
    ion-card { margin: 8px; cursor: pointer; }
    .card-header-row { display: flex; align-items: flex-start; gap: 12px; }
    .category-icon { font-size: 2rem; flex-shrink: 0; }
    .header-content { flex: 1; min-width: 0; }
    ion-card-title { font-size: 1rem; font-weight: 600; line-height: 1.3; }
    .discount-badge { flex-shrink: 0; }
    .deal-info { display: flex; flex-direction: column; gap: 12px; }
    .price-row { display: flex; align-items: baseline; gap: 12px; }
    .meta-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .valid-until { font-size: 0.8rem; color: var(--ion-color-medium); }
    .expiring-badge {
      font-size: 0.75rem; font-weight: 600;
      background: var(--ion-color-warning); padding: 2px 8px;
      border-radius: 8px; color: #000;
    }
  `]
})
export class DealCardComponent {
  @Input({ required: true }) deal!: Deal;
  getCategoryEmoji = getCategoryEmoji;
  getDiscountClass = getDiscountClass;
}
