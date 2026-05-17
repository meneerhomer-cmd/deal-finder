import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Deal, getCategoryEmoji } from '../../models/deal.model';

/**
 * Deal card — redesigned May 17, 2026 (Pillar 3 starter).
 *
 * Aesthetic: editorial-poster. Borrowed visual language from Belgian retail
 * flyers (massive discount numerals, sharp colored stickers) and elevated
 * with magazine-style typography hierarchy and asymmetric corner radius.
 *
 * Design choices:
 * - Asymmetric corner radius (sharp top-left, rounded bottom-right) gives
 *   the card a torn-ticket silhouette that breaks Ionic's uniform-rounded
 *   look instantly.
 * - Retailer identity is a 4px vertical stripe along the left edge in the
 *   retailer's brand color. Reads faster across a grid than a coloured pill,
 *   doesn't compete with the discount.
 * - Discount is a slightly-rotated dark sticker top-right with a coloured
 *   left edge in the retailer accent — modeled on real Belgian flyer
 *   "actie" stickers but with tabular numerals and tighter spacing.
 * - Brand becomes a small monospace "stamp" with hairline underline, like
 *   a magazine section header. Still tappable for brand filter.
 * - Original price gets a real angled strikethrough rendered with a 2px
 *   bar rotated 8°, not the default horizontal text-decoration that
 *   never reads at small sizes.
 */
@Component({
  selector: 'app-deal-card',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <a [routerLink]="['/deal', deal.id]" class="card" [style.--accent]="accentVar()">
      <span class="stripe" aria-hidden="true"></span>

      <div class="image-area">
        @if (deal.imageUrl && !imgError) {
          <img [src]="deal.imageUrl" [alt]="deal.productName" loading="lazy" (error)="imgError = true" />
        } @else {
          <span class="emoji">{{ getCategoryEmoji(deal.categorySlug) }}</span>
        }
        @if (deal.discountPercentage > 0) {
          <div class="discount">
            <span class="dash">&minus;</span>{{ deal.discountPercentage }}<span class="pct">%</span>
          </div>
        }
      </div>

      <div class="body">
        @if (deal.brand) {
          <button type="button" class="brand" (click)="onBrandTap($event)">{{ deal.brand }}</button>
        }
        <h3 class="title">{{ deal.productName }}</h3>
        @if (deal.dealType) {
          <span class="deal-type">{{ deal.dealType }}</span>
        }
        <div class="prices">
          @if (deal.currentPrice !== null && deal.currentPrice !== undefined) {
            <span class="price-now">€{{ deal.currentPrice | number:'1.2-2' }}</span>
          }
          @if (deal.originalPrice && deal.originalPrice !== deal.currentPrice) {
            <span class="price-was">€{{ deal.originalPrice | number:'1.2-2' }}</span>
          }
        </div>
        <div class="footer">
          <button type="button" class="retailer" (click)="onRetailerTap($event)">
            {{ deal.retailerName }}
          </button>
          @if (deal.expiringSoon) {
            <span class="expiring">Bijna verlopen</span>
          }
        </div>
      </div>
    </a>
  `,
  styles: [`
    :host { display: block; }

    .card {
      --accent: var(--ion-color-primary, #1a1a1a);
      position: relative;
      display: flex;
      flex-direction: column;
      background: var(--ion-card-background, #fff);
      color: var(--ion-text-color, #161616);
      text-decoration: none;
      overflow: hidden;
      border-radius: 0 0 14px 0;
      box-shadow:
        0 1px 2px rgba(15, 17, 21, 0.06),
        0 10px 28px -12px rgba(15, 17, 21, 0.18);
      transition: transform 140ms cubic-bezier(.2,.7,.2,1), box-shadow 140ms ease;
      isolation: isolate;
    }
    .card:active {
      transform: translateY(1px);
      box-shadow: 0 1px 2px rgba(15, 17, 21, 0.05);
    }

    .stripe {
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 4px;
      background: var(--accent);
      z-index: 2;
    }

    .image-area {
      position: relative;
      aspect-ratio: 5 / 4;
      max-height: 130px;
      background:
        radial-gradient(120% 100% at 50% 0%, rgba(255,255,255,0.6), rgba(255,255,255,0)),
        #f5f3ee;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-bottom: 1px solid rgba(15, 17, 21, 0.06);
    }
    .image-area img {
      max-width: 82%;
      max-height: 82%;
      object-fit: contain;
      mix-blend-mode: multiply;
    }
    .emoji {
      font-size: 2.4rem;
      filter: saturate(0.85);
      opacity: 0.85;
    }

    .discount {
      position: absolute;
      top: 10px;
      right: 8px;
      background: #15171a;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      font-weight: 900;
      font-size: 1.35rem;
      line-height: 1;
      padding: 6px 9px 7px;
      letter-spacing: -0.03em;
      border-radius: 4px;
      border-left: 4px solid var(--accent);
      font-variant-numeric: tabular-nums;
      transform: rotate(-3deg);
      box-shadow: 0 4px 12px -2px rgba(0,0,0,0.25);
      z-index: 1;
    }
    .discount .dash { margin-right: 1px; }
    .discount .pct {
      font-size: 0.65em;
      vertical-align: 12%;
      margin-left: 1px;
      opacity: 0.82;
      letter-spacing: 0;
    }

    .body {
      padding: 12px 12px 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .brand {
      align-self: flex-start;
      background: none;
      border: none;
      padding: 0 0 2px 0;
      font-family: ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace;
      font-size: 0.6rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--ion-color-medium, #6b6b6b);
      border-bottom: 1px solid currentColor;
      cursor: pointer;
      line-height: 1;
      font-family: ui-monospace, monospace;
    }
    .brand:hover, .brand:focus {
      color: var(--ion-color-primary, #15171a);
      outline: none;
    }

    .title {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
      line-height: 1.25;
      letter-spacing: -0.005em;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .deal-type {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--accent);
      letter-spacing: 0.01em;
      line-height: 1;
    }

    .prices {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-top: 2px;
    }
    .price-now {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      font-weight: 800;
      font-size: 1.22rem;
      letter-spacing: -0.025em;
      font-variant-numeric: tabular-nums;
      color: var(--ion-text-color, #15171a);
    }
    .price-was {
      position: relative;
      font-size: 0.78rem;
      color: var(--ion-color-medium, #9a9a9a);
      font-variant-numeric: tabular-nums;
      font-weight: 500;
      padding: 0 2px;
    }
    .price-was::after {
      content: '';
      position: absolute;
      left: -2px; right: -2px;
      top: 50%;
      height: 1.5px;
      background: currentColor;
      transform: rotate(-8deg);
      transform-origin: center;
      opacity: 0.9;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: auto;
      padding-top: 2px;
    }
    .retailer {
      background: var(--accent);
      color: #fff;
      border: none;
      font-family: ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace;
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 8px 3px;
      border-radius: 2px;
      cursor: pointer;
      line-height: 1.2;
      max-width: 60%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .retailer:hover, .retailer:focus {
      filter: brightness(1.08);
      outline: none;
    }

    .expiring {
      font-size: 0.6rem;
      font-weight: 700;
      color: #c0392b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.55; }
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .card {
        background: #1a1c1f;
        color: #ececea;
        box-shadow:
          0 1px 2px rgba(0,0,0,0.4),
          0 12px 32px -16px rgba(0,0,0,0.6);
      }
      .image-area {
        background: #f5f3ee; /* keep light bg behind product photos */
        border-bottom-color: transparent;
      }
      .discount {
        background: #fff;
        color: #15171a;
      }
      .brand { color: #9a9a98; }
      .price-now { color: #fff; }
      .price-was { color: #6f6f6e; }
    }
  `]
})
export class DealCardComponent {
  @Input({ required: true }) deal!: Deal;
  imgError = false;
  getCategoryEmoji = getCategoryEmoji;
  private router = inject(Router);

  accentVar(): string {
    return `var(--retailer-${this.deal.retailerSlug}, var(--ion-color-primary))`;
  }

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
