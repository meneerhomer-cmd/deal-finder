import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Deal, getCategoryEmoji } from '../../models/deal.model';

/**
 * Deal card — v2 (Pillar 3 iteration · May 17, 2026).
 *
 * v1 set the direction (editorial-poster, vertical stripe, asymmetric
 * radius, sticker discount). v2 refines:
 * - Discount is now bigger and flat (no rotation). The size IS the
 *   design — it doesn't need a tilt to feel intentional.
 * - Dropped mix-blend-mode on product images: it killed legibility for
 *   white-packaged products on the off-white image background.
 * - Brand stamp and retailer label now share one top row, same
 *   typographic treatment, separated by a thin slash. Two taps live
 *   in one visual line.
 * - Footer pill removed (redundant with stripe + retailer label).
 *   Expiring badge gets the footer to itself when present.
 * - Stripe widened 4 → 5 px and now caps the bottom of the card too
 *   (lifts into the rounded corner), so the retailer color tracks
 *   the silhouette rather than ending mid-card.
 * - Discount sticker now sits flush against the top-right of the
 *   image area with only inner corners rounded (visually anchored
 *   to the image, not floating over it).
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
        <div class="meta">
          @if (deal.brand) {
            <button type="button" class="meta-tap brand" (click)="onBrandTap($event)">{{ deal.brand }}</button>
            <span class="meta-sep" aria-hidden="true">/</span>
          }
          <button type="button" class="meta-tap retailer" (click)="onRetailerTap($event)">{{ deal.retailerName }}</button>
        </div>

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

        @if (deal.expiringSoon) {
          <div class="footer">
            <span class="expiring">Bijna verlopen</span>
          </div>
        }
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
        0 1px 2px rgba(15, 17, 21, 0.05),
        0 12px 30px -14px rgba(15, 17, 21, 0.16);
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
      width: 5px;
      background: var(--accent);
      z-index: 2;
      border-bottom-left-radius: 0; /* leave the asymmetric corner alone */
    }

    .image-area {
      position: relative;
      aspect-ratio: 5 / 4;
      max-height: 140px;
      background:
        radial-gradient(120% 100% at 50% 0%, rgba(255,255,255,0.65), rgba(255,255,255,0)),
        #f5f3ee;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-bottom: 1px solid rgba(15, 17, 21, 0.06);
    }
    .image-area img {
      max-width: 84%;
      max-height: 84%;
      object-fit: contain;
    }
    .emoji {
      font-size: 2.6rem;
      filter: saturate(0.85);
      opacity: 0.9;
    }

    .discount {
      position: absolute;
      top: 0;
      right: 0;
      background: var(--accent);
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      font-weight: 900;
      font-size: 1.75rem;
      line-height: 1;
      padding: 9px 11px 10px;
      letter-spacing: -0.04em;
      border-radius: 0 0 0 10px;
      font-variant-numeric: tabular-nums;
      z-index: 1;
      box-shadow: 0 6px 14px -4px rgba(0,0,0,0.25);
      text-shadow: 0 1px 0 rgba(0,0,0,0.06);
    }
    .discount .dash { margin-right: 1px; opacity: 0.9; }
    .discount .pct {
      font-size: 0.55em;
      vertical-align: 18%;
      margin-left: 2px;
      opacity: 0.85;
      letter-spacing: 0;
    }

    .body {
      padding: 11px 12px 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      flex: 1;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      line-height: 1;
    }
    .meta-tap {
      background: none;
      border: none;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      cursor: pointer;
      line-height: 1.2;
      transition: color 100ms ease;
    }
    .meta-tap.brand {
      color: var(--ion-text-color, #15171a);
    }
    .meta-tap.retailer {
      color: var(--accent);
    }
    .meta-tap:hover, .meta-tap:focus {
      outline: none;
      opacity: 0.7;
    }
    .meta-sep {
      font-size: 0.6rem;
      color: var(--ion-color-medium, #b8b8b6);
      font-weight: 400;
    }

    .title {
      margin: 4px 0 0;
      font-size: 0.93rem;
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
      padding-top: 2px;
    }

    .prices {
      display: flex;
      align-items: baseline;
      gap: 9px;
      margin-top: 4px;
    }
    .price-now {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      font-weight: 800;
      font-size: 1.32rem;
      letter-spacing: -0.028em;
      font-variant-numeric: tabular-nums;
      color: var(--ion-text-color, #15171a);
      line-height: 1;
    }
    .price-was {
      position: relative;
      font-size: 0.8rem;
      color: var(--ion-color-medium, #9a9a9a);
      font-variant-numeric: tabular-nums;
      font-weight: 500;
      padding: 0 2px;
      line-height: 1;
    }
    .price-was::after {
      content: '';
      position: absolute;
      left: -2px; right: -2px;
      top: 50%;
      height: 1.5px;
      background: currentColor;
      transform: rotate(-7deg);
      transform-origin: center;
      opacity: 0.85;
    }

    .footer {
      display: flex;
      align-items: center;
      margin-top: auto;
      padding-top: 6px;
    }
    .expiring {
      font-size: 0.6rem;
      font-weight: 700;
      color: #c0392b;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      line-height: 1;
      padding: 3px 6px;
      background: rgba(192, 57, 43, 0.1);
      border-radius: 3px;
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .card {
        background: #1a1c1f;
        color: #ececea;
        box-shadow:
          0 1px 2px rgba(0,0,0,0.4),
          0 14px 32px -16px rgba(0,0,0,0.65);
      }
      .image-area {
        background: #f5f3ee;
        border-bottom-color: transparent;
      }
      .meta-tap.brand { color: #ececea; }
      .meta-sep { color: #555; }
      .price-now { color: #fff; }
      .price-was { color: #777; }
      .expiring {
        background: rgba(192, 57, 43, 0.18);
      }
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
