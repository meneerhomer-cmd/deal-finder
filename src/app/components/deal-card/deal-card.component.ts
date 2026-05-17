import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Deal, getCategoryEmoji, getDiscountClass } from '../../models/deal.model';

@Component({
  selector: 'app-deal-card',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    <a [routerLink]="['/deal', deal.id]" class="deal-card">
      <div class="card-image">
        @if (deal.imageUrl && !imgError) {
          <img [src]="deal.imageUrl" [alt]="deal.productName" loading="lazy" (error)="imgError = true" />
        } @else {
          <span class="fallback-emoji">{{ getCategoryEmoji(deal.categorySlug) }}</span>
        }
        @if (deal.discountPercentage > 0) {
          <span class="discount-tag">-{{ deal.discountPercentage }}%</span>
        }
      </div>
      <div class="card-body">
        <button
          type="button"
          class="retailer-pill"
          [class]="deal.retailerSlug"
          (click)="onRetailerTap($event)"
        >{{ deal.retailerName }}</button>
        @if (deal.brand) {
          <button
            type="button"
            class="brand-label"
            (click)="onBrandTap($event)"
          >{{ deal.brand }}</button>
        }
        <h3 class="product-name">{{ deal.productName }}</h3>
        @if (deal.dealType) {
          <span class="deal-type-label">{{ deal.dealType }}</span>
        }
        <div class="price-area">
          @if (deal.currentPrice) {
            <span class="current-price">€{{ deal.currentPrice | number:'1.2-2' }}</span>
          }
          @if (deal.originalPrice && deal.originalPrice !== deal.currentPrice) {
            <span class="was-price">€{{ deal.originalPrice | number:'1.2-2' }}</span>
          }
        </div>
        @if (deal.expiringSoon) {
          <span class="expiring">Bijna verlopen!</span>
        }
      </div>
    </a>
  `,
  styles: [`
    .deal-card {
      display: flex;
      flex-direction: column;
      background: var(--ion-card-background, white);
      border-radius: 16px;
      overflow: hidden;
      text-decoration: none;
      color: var(--ion-text-color);
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: transform 0.15s ease;
    }
    .deal-card:active { transform: scale(0.97); }

    .card-image {
      position: relative;
      aspect-ratio: 4/3;
      max-height: 100px;
      background: var(--ion-color-light, #f4f5f8);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 6px;
    }
    .fallback-emoji {
      font-size: 2rem;
    }
    .discount-tag {
      position: absolute;
      top: 8px;
      left: 8px;
      background: #e53935;
      color: white;
      font-weight: 800;
      font-size: 0.8rem;
      padding: 3px 8px;
      border-radius: 8px;
    }

    .card-body {
      padding: 8px 10px 10px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .retailer-pill {
      align-self: flex-start;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border: none;
      cursor: pointer;
      font-family: inherit;
    }
    .retailer-pill:hover,
    .retailer-pill:focus {
      filter: brightness(1.1);
      outline: none;
    }
    .retailer-pill.carrefour { background: var(--retailer-carrefour); }
    .retailer-pill.lidl { background: var(--retailer-lidl); }
    .retailer-pill.delhaize { background: var(--retailer-delhaize); }
    .retailer-pill.colruyt { background: var(--retailer-colruyt); }
    .retailer-pill.aldi { background: var(--retailer-aldi); }
    .retailer-pill.kruidvat { background: var(--retailer-kruidvat); }
    .retailer-pill.albert-heijn { background: var(--retailer-albert-heijn); }
    .retailer-pill.jumbo { background: var(--retailer-jumbo); color: #333; }
    .retailer-pill.spar { background: var(--retailer-spar); }
    .retailer-pill.carrefour-market { background: var(--retailer-carrefour-market); }
    .retailer-pill.intermarche { background: var(--retailer-intermarche); }
    .retailer-pill.gamma { background: var(--retailer-gamma); }
    .retailer-pill.brico-bricoplanit { background: var(--retailer-brico-bricoplanit); }
    .retailer-pill.mediamarkt { background: var(--retailer-mediamarkt); }
    .retailer-pill.ikea { background: var(--retailer-ikea); }

    .brand-label {
      align-self: flex-start;
      background: none;
      border: none;
      padding: 2px 0;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--ion-color-medium);
      line-height: 1;
      cursor: pointer;
      font-family: inherit;
    }
    .brand-label:hover,
    .brand-label:focus {
      color: var(--ion-color-primary);
      outline: none;
    }
    .product-name {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 600;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .deal-type-label {
      font-size: 0.72rem;
      color: var(--ion-color-success-shade, #1b9e4b);
      font-weight: 600;
    }
    .price-area {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin-top: 2px;
    }
    .current-price {
      font-size: 1rem;
      font-weight: 800;
      color: var(--ion-color-success, #2dd36f);
    }
    .was-price {
      font-size: 0.78rem;
      text-decoration: line-through;
      color: var(--ion-color-medium);
    }
    .expiring {
      font-size: 0.68rem;
      font-weight: 600;
      color: #e65100;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `]
})
export class DealCardComponent {
  @Input({ required: true }) deal!: Deal;
  imgError = false;
  getCategoryEmoji = getCategoryEmoji;
  getDiscountClass = getDiscountClass;
  private router = inject(Router);

  onBrandTap(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.deal.brand) {
      this.router.navigate(['/deals'], { queryParams: { brand: this.deal.brand } });
    }
  }

  onRetailerTap(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(['/retailer', this.deal.retailerSlug]);
  }
}
