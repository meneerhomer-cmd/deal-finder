import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Deal, getCategoryEmoji } from '../../models/deal.model';

/**
 * Deal card — v4 Retro Belgian Flyer (Stitch design system)
 *
 * The 1980s Carrefour leaflet in your mailbox, made digital.
 * Newsprint warm bg, 2px black border, rotated red KORTING sticker,
 * Anton condensed display, Archivo Narrow body, Space Mono labels,
 * halftone dot texture, yellow highlighter for brand, double-line
 * strikethrough on original price.
 */
@Component({
  selector: 'app-deal-card',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <a [routerLink]="['/deal', deal.id]" class="card">
      <div class="image-wrap">
        @if (deal.imageUrl && !imgError) {
          <img [src]="deal.imageUrl" [alt]="deal.productName" loading="lazy" width="280" height="160" (error)="imgError = true" />
        } @else {
          <span class="fallback">{{ emoji() }}</span>
        }
        @if (deal.discountPercentage > 0) {
          <span class="sticker">
            <span class="sticker-label">KORTING</span>
            <span class="sticker-pct">−{{ deal.discountPercentage }}<span class="pct-sign">%</span></span>
          </span>
        }
        <button type="button" class="retailer" (click)="onRetailerTap($event)">{{ deal.retailerName }}</button>
      </div>

      <div class="body">
        @if (deal.brand) {
          <button type="button" class="brand-highlight" (click)="onBrandTap($event)">{{ deal.brand }}</button>
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
        @if (deal.derivedUnitPrice != null && deal.derivedUnitLabel) {
          <span class="unit-price">€{{ deal.derivedUnitPrice | number:'1.2-2' }} {{ deal.derivedUnitLabel }}</span>
        }

        <div class="tags">
          @if (deal.atLowestPrice) {
            <span class="stamp stamp--lowest" aria-label="Beste prijs sinds we deze deal volgen">BESTE PRIJS</span>
          }
          @if (deal.dealType) {
            <span class="stamp stamp--deal">{{ deal.dealType }}</span>
          }
          @if (deal.expiringSoon && daysLeft() !== null) {
            <span class="stamp stamp--expiring">{{ daysLeft() === 1 ? 'NOG 1 DAG' : 'NOG ' + daysLeft() + ' DAGEN' }}</span>
          }
        </div>
      </div>
    </a>
  `,
  styles: [`
    :host {
      --newsprint: #faf7f0;
      --ink: #0a0a0a;
      --ink-soft: #4a4540;
      --red: #e30613;
      --yellow: #ffd200;
      --blue: #0066cc;
      font-family: 'Archivo Narrow', system-ui, sans-serif;
    }

    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      background:
        radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 0.5px, transparent 0.5px) 0 0 / 4px 4px,
        var(--newsprint);
      color: var(--ink);
      text-decoration: none;
      border: 2px solid var(--ink);
      border-radius: 0;
      overflow: visible;
      transition: transform .1s ease;
      font-family: inherit;
    }
    .card:active { transform: translateY(1px); }

    .image-wrap {
      position: relative;
      aspect-ratio: 4 / 3;
      max-height: 135px;
      background:
        radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 0.5px, transparent 0.5px) 0 0 / 4px 4px,
        #fffaf0;
      border-bottom: 2px solid var(--ink);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .image-wrap img {
      max-width: 85%;
      max-height: 85%;
      object-fit: contain;
    }
    .fallback {
      font-size: 2.4rem;
    }

    .sticker {
      position: absolute;
      top: 6px;
      right: -4px;
      background: var(--red);
      color: white;
      padding: 6px 10px 5px;
      border: 2px solid var(--ink);
      transform: rotate(-4deg);
      box-shadow: 2px 2px 0 0 var(--ink);
      display: flex;
      flex-direction: column;
      align-items: center;
      line-height: 1;
    }
    .sticker-label {
      font-family: 'Space Mono', monospace;
      font-weight: 700;
      font-size: 0.55rem;
      color: #ffffff;
      letter-spacing: 0.1em;
      margin-bottom: 1px;
    }
    .sticker-pct {
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      font-weight: 400;
      font-size: 1.55rem;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
    }
    .pct-sign { font-size: 0.65em; margin-left: 1px; }

    .retailer {
      position: absolute;
      bottom: 0;
      left: 0;
      background: var(--blue);
      color: white;
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      font-weight: 400;
      font-size: 0.82rem;
      padding: 8px 12px 7px;
      min-height: 30px;
      border-top: 2px solid var(--ink);
      border-right: 2px solid var(--ink);
      cursor: pointer;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      line-height: 1.1;
      max-width: 70%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .body {
      padding: 10px 11px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .brand-highlight {
      align-self: flex-start;
      background: var(--yellow);
      color: var(--ink);
      border: none;
      font-family: 'Archivo Narrow', system-ui, sans-serif;
      font-weight: 700;
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 6px 9px 5px;
      min-height: 26px;
      cursor: pointer;
      line-height: 1.2;
      box-shadow: 0 0 0 1px var(--ink);
    }

    .title {
      margin: 2px 0 0;
      font-family: 'Archivo Narrow', system-ui, sans-serif;
      font-size: 0.92rem;
      font-weight: 600;
      line-height: 1.2;
      letter-spacing: 0.005em;
      color: var(--ink);
      text-transform: uppercase;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .price-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-top: 4px;
    }

    .price-now {
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      font-weight: 400;
      font-size: 1.95rem;
      line-height: 1;
      letter-spacing: -0.01em;
      color: var(--ink);
      font-variant-numeric: tabular-nums;
      display: inline-flex;
      align-items: baseline;
    }
    .price-now .euro {
      font-size: 0.55em;
      margin-right: 1px;
      vertical-align: 24%;
    }
    .price-now .cents {
      font-family: 'Space Mono', monospace;
      font-size: 0.4em;
      font-weight: 700;
      vertical-align: 60%;
      margin-left: 2px;
      letter-spacing: -0.02em;
    }

    .price-was {
      font-family: 'Archivo Narrow', system-ui, sans-serif;
      font-weight: 500;
      font-size: 0.8rem;
      color: var(--ink-soft);
      font-variant-numeric: tabular-nums;
      position: relative;
      padding: 1px 2px;
    }
    .price-was::before, .price-was::after {
      content: '';
      position: absolute;
      left: -1px; right: -1px;
      height: 1px;
      background: var(--ink);
    }
    .price-was::before { top: 45%; }
    .price-was::after { top: 60%; }

    .unit-price {
      font-family: 'Space Mono', monospace;
      font-size: 0.66rem;
      color: var(--ink-soft);
      font-variant-numeric: tabular-nums;
      margin-top: -2px;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 2px;
    }
    .stamp {
      font-family: 'Space Mono', monospace;
      font-weight: 700;
      font-size: 0.62rem;
      letter-spacing: 0.04em;
      padding: 2px 6px 1px;
      line-height: 1.3;
      border: 1px solid var(--ink);
    }
    .stamp--deal { background: var(--yellow); color: var(--ink); }
    .stamp--expiring { background: var(--red); color: var(--yellow); }
    .stamp--lowest {
      background: var(--ink);
      color: var(--yellow);
      letter-spacing: 0.06em;
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

  daysLeft(): number | null {
    if (!this.deal.validUntil) return null;
    const until = new Date(this.deal.validUntil);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.ceil((until.getTime() - today.getTime()) / 86400000);
    return days >= 0 ? days : null;
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
