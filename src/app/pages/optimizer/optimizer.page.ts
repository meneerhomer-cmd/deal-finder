import { Component, inject, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cartOutline, navigateOutline, checkmarkCircle } from 'ionicons/icons';
import { ShoppingListService } from '../../services/shopping-list.service';
import { PosthogService } from '../../services/posthog.service';

interface RouteStop {
  retailerName: string;
  retailerSlug: string;
  items: { name: string; price: number | null }[];
  subtotal: number;
}

@Component({
  selector: 'app-optimizer',
  standalone: true,
  imports: [
    DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonList, IonItem, IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/shopping-list"></ion-back-button>
        </ion-buttons>
        <ion-title>Slimme Boodschappenroute</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (totalProducts() === 0) {
        <div class="empty-state">
          <ion-icon name="cart-outline"></ion-icon>
          <h2>Geen items op je lijst</h2>
          <p>Voeg deals toe aan je boodschappenlijst en kom hier terug</p>
        </div>
      } @else {
        <ion-card class="summary-card">
          <ion-card-content>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-value">{{ totalProducts() }}</span>
                <span class="summary-label">Producten</span>
              </div>
              <div class="summary-item">
                <span class="summary-value">{{ stopsNeeded() }}</span>
                <span class="summary-label">Winkels</span>
              </div>
              <div class="summary-item accent">
                <span class="summary-value">€{{ totalEstimate() | number:'1.2-2' }}</span>
                <span class="summary-label">Totaal</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <h3 class="section-title">
          <ion-icon name="navigate-outline"></ion-icon>
          Je route — {{ stopsNeeded() }} {{ stopsNeeded() === 1 ? 'winkel' : 'winkels' }}
        </h3>

        @for (stop of route(); track stop.retailerSlug; let i = $index) {
          <ion-card class="route-card">
            <ion-card-header>
              <ion-card-title>
                <span class="stop-num">{{ i + 1 }}</span>
                <span class="retailer-badge" [class]="stop.retailerSlug">{{ stop.retailerName }}</span>
                <span class="route-total">€{{ stop.subtotal | number:'1.2-2' }}</span>
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                @for (item of stop.items; track item.name) {
                  <ion-item lines="none">
                    <ion-icon name="checkmark-circle" slot="start" color="success"></ion-icon>
                    <ion-label>{{ item.name }}</ion-label>
                    @if (item.price != null) {
                      <span slot="end" class="item-price">€{{ item.price | number:'1.2-2' }}</span>
                    } @else {
                      <span slot="end" class="item-price muted">prijs onbekend</span>
                    }
                  </ion-item>
                }
              </ion-list>
            </ion-card-content>
          </ion-card>
        }
      }
    </ion-content>
  `,
  styles: [`
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px 24px; text-align: center; color: var(--retro-ink-soft, #8a8580);
    }
    .empty-state ion-icon { font-size: 3.5rem; margin-bottom: 12px; color: var(--retro-red); }
    .empty-state h2 { font-family: 'Anton', sans-serif; text-transform: uppercase; color: var(--retro-ink); margin: 0 0 6px; }

    .summary-card { margin-bottom: 16px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center; }
    .summary-item { padding: 8px; }
    .summary-value { display: block; font-family: 'Anton', sans-serif; font-size: 1.7rem; color: var(--retro-ink); }
    .summary-item.accent .summary-value { color: var(--retro-red); }
    .summary-label { font-family: 'Archivo Narrow', sans-serif; font-size: 0.72rem; color: var(--retro-ink-soft, #8a8580); text-transform: uppercase; letter-spacing: 0.04em; }

    .section-title {
      display: flex; align-items: center; gap: 8px;
      margin: 16px 0 8px; font-family: 'Archivo Narrow', sans-serif;
      font-size: 1rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--retro-ink);
    }

    ion-card-title { display: flex; align-items: center; gap: 10px; font-size: 1rem; }
    .stop-num {
      flex-shrink: 0; width: 24px; height: 24px; border: 2px solid var(--retro-ink);
      display: inline-flex; align-items: center; justify-content: center;
      font-family: 'Anton', sans-serif; font-size: 0.85rem; background: var(--retro-yellow); color: var(--retro-ink);
    }
    .route-total { margin-left: auto; font-family: 'Anton', sans-serif; font-size: 1.15rem; color: var(--retro-ink); }
    .item-price { font-family: 'Archivo Narrow', sans-serif; font-weight: 700; font-size: 0.9rem; color: var(--retro-ink); }
    .item-price.muted { color: var(--retro-ink-soft, #8a8580); font-weight: 400; font-style: italic; }
  `]
})
export class OptimizerPage {
  private shoppingList = inject(ShoppingListService);
  private posthog = inject(PosthogService);

  // Route the deals the user actually added: group their chosen deals by
  // retailer (each deal keeps its real DB price, so cashback etc. are correct),
  // biggest-spend store first. No re-searching — these are *their* picks.
  route = computed<RouteStop[]>(() => {
    const stops = new Map<string, RouteStop>();
    for (const it of this.shoppingList.activeItems()) {
      const slug = it.deal.retailerSlug || this.slugify(it.deal.retailerName);
      let stop = stops.get(slug);
      if (!stop) {
        stop = { retailerName: it.deal.retailerName, retailerSlug: slug, items: [], subtotal: 0 };
        stops.set(slug, stop);
      }
      stop.items.push({ name: it.deal.productName, price: it.deal.currentPrice });
      stop.subtotal += it.deal.currentPrice ?? 0;
    }
    return [...stops.values()].sort((a, b) => b.subtotal - a.subtotal);
  });

  totalProducts = computed(() => this.shoppingList.activeItems().length);
  stopsNeeded = computed(() => this.route().length);
  totalEstimate = computed(() => this.route().reduce((sum, s) => sum + s.subtotal, 0));

  constructor() {
    addIcons({ cartOutline, navigateOutline, checkmarkCircle });
    this.posthog.posthog.capture('optimizer_viewed', {
      total_products: this.totalProducts(),
      stops_needed: this.stopsNeeded(),
      total_estimate: this.totalEstimate(),
    });
  }

  private slugify(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  }
}
