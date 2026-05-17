import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Deal, getCategoryEmoji } from '../../models/deal.model';

/**
 * Deal card — v3 (Pillar 3, Brutalist-Utilitarian direction · May 17, 2026)
 *
 * Generated design system from Stitch's "Industrial Retail" spec, then
 * implemented as a drop-in Angular component. Opposite aesthetic to v2's
 * editorial-poster softness: this is supermarket flyer × dev tool.
 *
 * Design choices (all of them load-bearing — don't pick at one in isolation):
 * - **Sharp 90° corners everywhere.** No border-radius anywhere. The
 *   geometric rigidity does the differentiation work — it doesn't look
 *   like any default UI framework.
 * - **2px solid black border** on the card + every interactive chip.
 *   Borders are the depth indicator; no soft shadows.
 * - **Hard-offset solid-black shadow** (4px right + 4px down). Tactile,
 *   feels like a sticker on a flyer. On :active, the card shifts into
 *   the shadow (translate3d 4px,4px,0 + shadow shrinks to 0) — physical
 *   button-press feedback that you can't fake with a CSS transition library.
 * - **Discount = Sale Red block, top-right corner**, white Montserrat 900,
 *   45px on grid view. The price tag aesthetic of a Belgian flyer made
 *   literal. No rotation, no decoration — the size + color is enough.
 * - **Montserrat ExtraBold (900)** for the price, with tabular numerals.
 *   Cents are 0.55em superscripted for the supermarket-shelf-label feel.
 *   Original price strikethrough is a 2px solid black bar, not browser
 *   default — visible at 11px which is where most strikethroughs die.
 * - **Retailer chip** sits in the bottom-left corner of the image area,
 *   solid retailer-brand-color background, 2px black border, white
 *   Montserrat all-caps. Still tappable for /retailer/:slug.
 * - **Brand stamp** in Montserrat 800 above the product name, all-caps,
 *   tracked. Tappable for /deals?brand=X.
 * - **Deal type and "BIJNA VERLOPEN"** are chips with retailer-yellow or
 *   black backgrounds, 2px black borders. Both treated as data badges,
 *   not body copy.
 *
 * Same drop-in contract as v1/v2: same selector, same inputs, same click
 * destinations.
 */
@Component({
  selector: 'app-deal-card',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <a [routerLink]="['/deal', deal.id]" class="card">
      <div class="image-block">
        @if (deal.imageUrl && !imgError) {
          <img [src]="deal.imageUrl" [alt]="deal.productName" loading="lazy" (error)="imgError = true" />
        } @else {
          <span class="fallback">{{ emoji() }}</span>
        }

        @if (deal.discountPercentage > 0) {
          <span class="discount">
            <span class="sign">−</span>{{ deal.discountPercentage }}<span class="pct">%</span>
          </span>
        }

        <button
          type="button"
          class="retailer"
          [attr.data-retailer]="deal.retailerSlug"
          (click)="onRetailerTap($event)"
          [attr.aria-label]="'Toon ' + deal.retailerName + ' deals'"
        >{{ deal.retailerName }}</button>
      </div>

      <div class="body">
        @if (deal.brand) {
          <button
            type="button"
            class="brand"
            (click)="onBrandTap($event)"
            [attr.aria-label]="'Filter op merk ' + deal.brand"
          >{{ deal.brand }}</button>
        }

        <h3 class="title">{{ deal.productName }}</h3>

        <div class="price-row">
          @if (deal.currentPrice !== null) {
            <span class="price-now">
              <span class="euro">€</span>{{ wholePart(deal.currentPrice) }}<span class="cents">,{{ centsPart(deal.currentPrice) }}</span>
            </span>
          }
          @if (deal.originalPrice && deal.originalPrice !== deal.currentPrice) {
            <span class="price-was">€{{ deal.originalPrice | number:'1.2-2' }}</span>
          }
        </div>

        <div class="tag-row">
          @if (deal.dealType) {
            <span class="tag tag--deal">{{ deal.dealType }}</span>
          }
          @if (deal.expiringSoon) {
            <span class="tag tag--expiring">BIJNA VERLOPEN</span>
          }
        </div>
      </div>
    </a>
  `,
  styles: [`
    :host {
      --ink: #000000;
      --paper: #ffffff;
      --paper-warm: #fff8f0;
      --sale: #e30613;
      --signal-yellow: #ffd200;
      --shadow-offset: 4px;
    }

    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      background: var(--paper);
      color: var(--ink);
      text-decoration: none;
      border: 2px solid var(--ink);
      border-radius: 0;
      box-shadow: var(--shadow-offset) var(--shadow-offset) 0 0 var(--ink);
      transition: transform .08s ease, box-shadow .08s ease;
      font-family: 'Montserrat', system-ui, -apple-system, sans-serif;
      overflow: visible;
    }

    .card:active {
      transform: translate3d(var(--shadow-offset), var(--shadow-offset), 0);
      box-shadow: 0 0 0 0 var(--ink);
    }

    .image-block {
      position: relative;
      aspect-ratio: 4 / 3;
      max-height: 130px;
      background: var(--paper-warm);
      border-bottom: 2px solid var(--ink);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .image-block img {
      max-width: 82%;
      max-height: 82%;
      object-fit: contain;
    }
    .fallback {
      font-size: 2.4rem;
    }

    .discount {
      position: absolute;
      top: 0;
      right: 0;
      background: var(--sale);
      color: var(--paper);
      font-weight: 900;
      font-size: 1.5rem;
      line-height: 1;
      letter-spacing: -0.02em;
      padding: 7px 10px 8px;
      border-left: 2px solid var(--ink);
      border-bottom: 2px solid var(--ink);
      font-variant-numeric: tabular-nums;
    }
    .discount .sign { margin-right: 0; }
    .discount .pct { font-size: 0.65em; font-weight: 800; margin-left: 1px; opacity: 0.92; vertical-align: 10%; }

    .retailer {
      position: absolute;
      bottom: 0;
      left: 0;
      background: #1a1a1a;
      color: var(--paper);
      font-family: inherit;
      font-weight: 800;
      font-size: 0.6rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 4px 8px 4px 7px;
      border-top: 2px solid var(--ink);
      border-right: 2px solid var(--ink);
      cursor: pointer;
      line-height: 1.1;
      max-width: 70%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .retailer[data-retailer="carrefour"] { background: #0066cc; }
    .retailer[data-retailer="lidl"] { background: #fff200; color: #003399; }
    .retailer[data-retailer="delhaize"] { background: #e30613; }
    .retailer[data-retailer="colruyt"] { background: #f7941d; color: var(--ink); }
    .retailer[data-retailer="aldi"] { background: #00447c; }
    .retailer[data-retailer="kruidvat"] { background: #e91e8c; }
    .retailer[data-retailer="albert-heijn"] { background: #00b3e3; color: var(--ink); }
    .retailer[data-retailer="jumbo"] { background: #ffe500; color: var(--ink); }
    .retailer[data-retailer="spar"] { background: #009f3a; }
    .retailer[data-retailer="carrefour-market"] { background: #003399; }
    .retailer[data-retailer="intermarche"] { background: #e30613; }
    .retailer[data-retailer="gamma"] { background: #6d2077; }
    .retailer[data-retailer="brico-bricoplanit"] { background: #00853e; }
    .retailer[data-retailer="bol-com"] { background: #003399; }
    .retailer[data-retailer="mediamarkt"] { background: #df0000; }
    .retailer[data-retailer="ikea"] { background: #0058a3; }

    .body {
      padding: 10px 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .brand {
      align-self: flex-start;
      background: var(--paper);
      color: var(--ink);
      border: 1.5px solid var(--ink);
      font-family: inherit;
      font-weight: 800;
      font-size: 0.62rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 2px 6px 1px;
      cursor: pointer;
      line-height: 1.2;
    }
    .brand:active { background: var(--signal-yellow); }

    .title {
      margin: 2px 0 0;
      font-family: 'Montserrat', system-ui, -apple-system, sans-serif;
      font-size: 0.86rem;
      font-weight: 600;
      line-height: 1.22;
      letter-spacing: -0.005em;
      color: var(--ink);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .price-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-top: 4px;
    }

    .price-now {
      font-family: 'Montserrat', system-ui, sans-serif;
      font-weight: 900;
      font-size: 1.6rem;
      line-height: 1;
      letter-spacing: -0.04em;
      color: var(--ink);
      font-variant-numeric: tabular-nums;
      display: inline-flex;
      align-items: baseline;
    }
    .price-now .euro {
      font-size: 0.62em;
      font-weight: 900;
      margin-right: 1px;
      vertical-align: 32%;
    }
    .price-now .cents {
      font-size: 0.55em;
      font-weight: 900;
      vertical-align: 32%;
      margin-left: 1px;
      letter-spacing: 0;
    }

    .price-was {
      font-family: 'Montserrat', system-ui, sans-serif;
      font-weight: 600;
      font-size: 0.72rem;
      color: #4d4632;
      font-variant-numeric: tabular-nums;
      position: relative;
      white-space: nowrap;
    }
    .price-was::after {
      content: '';
      position: absolute;
      left: -2px; right: -2px;
      top: 50%;
      height: 2px;
      background: var(--ink);
      transform: rotate(-6deg);
      transform-origin: center;
    }

    .tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 2px;
    }
    .tag {
      font-family: inherit;
      font-weight: 800;
      font-size: 0.6rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 2px 6px;
      border: 1.5px solid var(--ink);
      line-height: 1.2;
    }
    .tag--deal { background: var(--signal-yellow); color: var(--ink); }
    .tag--expiring { background: var(--sale); color: var(--paper); }

    @media (prefers-color-scheme: dark) {
      :host {
        --paper: #fafaf7;
        --ink: #050505;
      }
      .card { box-shadow: var(--shadow-offset) var(--shadow-offset) 0 0 var(--ink); }
    }
  `]
})
export class DealCardComponent {
  @Input({ required: true }) deal!: Deal;
  imgError = false;
  private router = inject(Router);

  emoji(): string {
    return getCategoryEmoji(this.deal.categorySlug);
  }

  wholePart(price: number): string {
    return Math.floor(price).toString();
  }
  centsPart(price: number): string {
    const cents = Math.round((price - Math.floor(price)) * 100);
    return cents.toString().padStart(2, '0');
  }

  onBrandTap(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.deal.brand) {
      this.router.navigate(['/deals'], { queryParams: { brand: this.deal.brand } });
    }
  }

  onRetailerTap(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(['/retailer', this.deal.retailerSlug]);
  }
}
