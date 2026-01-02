import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonBadge, IonChip, IonLabel } from '@ionic/angular/standalone';
import { Deal, getCategoryEmoji, getPromoKindClass } from '../../models/deal.model';

@Component({
  selector: 'app-deal-card',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonBadge, IonChip, IonLabel],
  template: `
    <ion-card>
      <ion-card-header>
        <div class="card-header-row">
          <span class="category-icon">{{ getCategoryEmoji(deal.category) }}</span>
          <div class="header-content">
            <ion-card-title>{{ deal.productName }}</ion-card-title>
            <ion-card-subtitle *ngIf="deal.brand">{{ deal.brand }}</ion-card-subtitle>
          </div>
          <span class="discount-badge" *ngIf="deal.effectiveDiscount">
            -{{ deal.effectiveDiscount }}%
          </span>
        </div>
      </ion-card-header>
      
      <ion-card-content>
        <div class="deal-info">
          <div class="deal-type">
            <span class="deal-type-chip" [ngClass]="getPromoKindClass(deal.promoKind)">
              {{ deal.dealType }}
            </span>
          </div>
          
          <div class="price-row">
            <span class="price" *ngIf="deal.price">€{{ deal.price | number:'1.2-2' }}</span>
            <span class="original-price" *ngIf="deal.originalPrice">€{{ deal.originalPrice | number:'1.2-2' }}</span>
            <span class="quantity" *ngIf="deal.quantity">{{ deal.quantity }}</span>
          </div>
          
          <div class="meta-row">
            <span class="retailer-badge" [ngClass]="deal.retailerSlug">
              {{ deal.retailerName }}
            </span>
            <span class="valid-until" *ngIf="deal.validUntil">
              t/m {{ deal.validUntil | date:'d MMM' }}
            </span>
          </div>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    ion-card {
      margin: 8px;
    }
    
    .card-header-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    
    .category-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }
    
    .header-content {
      flex: 1;
      min-width: 0;
    }
    
    ion-card-title {
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.3;
    }
    
    ion-card-subtitle {
      font-size: 0.85rem;
      margin-top: 4px;
    }
    
    .discount-badge {
      flex-shrink: 0;
    }
    
    .deal-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .price-row {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }
    
    .quantity {
      color: var(--ion-color-medium);
      font-size: 0.85rem;
    }
    
    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    
    .valid-until {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }
  `]
})
export class DealCardComponent {
  @Input({ required: true }) deal!: Deal;
  
  getCategoryEmoji = getCategoryEmoji;
  getPromoKindClass = getPromoKindClass;
}
