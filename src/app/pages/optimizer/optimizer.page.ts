import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonBadge, IonList, IonItem, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cartOutline, navigateOutline, checkmarkCircle } from 'ionicons/icons';
import { environment } from '@env/environment';
import { ShoppingListService } from '../../services/shopping-list.service';
import { PosthogService } from '../../services/posthog.service';

interface OptimizerResult {
  totalProducts: number;
  totalEstimate: number;
  stopsNeeded: number;
  retailerSummary: Array<{ retailerName: string; estimatedTotal: number; itemCount: number }>;
  shoppingRoute: Record<string, string[]>;
  items: Array<{
    searchTerm: string;
    resultCount: number;
    cheapest: { productName: string; retailerName: string; retailerSlug: string; currentPrice: number; discountPercent: number } | null;
  }>;
}

@Component({
  selector: 'app-optimizer',
  standalone: true,
  imports: [
    DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSpinner, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonBadge, IonList, IonItem, IonLabel
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
      @if (loading()) {
        <div class="loading">
          <ion-spinner></ion-spinner>
          <p>Prijzen vergelijken bij alle winkels...</p>
        </div>
      } @else if (!result()) {
        <div class="empty-state">
          <ion-icon name="cart-outline"></ion-icon>
          <h2>Geen items op je lijst</h2>
          <p>Voeg deals toe aan je boodschappenlijst en kom hier terug</p>
        </div>
      } @else {
        <!-- Summary -->
        <ion-card class="summary-card">
          <ion-card-content>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-value">{{ result()!.totalProducts }}</span>
                <span class="summary-label">Producten</span>
              </div>
              <div class="summary-item">
                <span class="summary-value">{{ result()!.stopsNeeded }}</span>
                <span class="summary-label">Winkels</span>
              </div>
              <div class="summary-item accent">
                <span class="summary-value">€{{ result()!.totalEstimate | number:'1.2-2' }}</span>
                <span class="summary-label">Geschat totaal</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Shopping route -->
        <h3 class="section-title">
          <ion-icon name="navigate-outline"></ion-icon>
          Je route
        </h3>

        @for (retailer of result()!.retailerSummary; track retailer.retailerName) {
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <span class="retailer-badge" [class]="slugify(retailer.retailerName)">
                  {{ retailer.retailerName }}
                </span>
                <ion-badge color="medium">{{ retailer.itemCount }} items</ion-badge>
                <span class="route-total">€{{ retailer.estimatedTotal | number:'1.2-2' }}</span>
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                @for (productName of result()!.shoppingRoute[retailer.retailerName] ?? []; track productName) {
                  <ion-item>
                    <ion-icon name="checkmark-circle" slot="start" color="success"></ion-icon>
                    <ion-label>{{ productName }}</ion-label>
                    @if (getItemPrice(productName); as price) {
                      <span slot="end" class="item-price">€{{ price | number:'1.2-2' }}</span>
                    }
                  </ion-item>
                }
              </ion-list>
            </ion-card-content>
          </ion-card>
        }

        <!-- Items without results -->
        @if (itemsNotFound().length > 0) {
          <ion-card class="not-found-card">
            <ion-card-header>
              <ion-card-title>Niet gevonden</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              @for (item of itemsNotFound(); track item) {
                <p>{{ item }}</p>
              }
            </ion-card-content>
          </ion-card>
        }
      }
    </ion-content>
  `,
  styles: [`
    .loading {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px; text-align: center;
      font-family: 'Space Mono', monospace;
      font-size: 0.8rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--retro-ink-soft);
    }

    .summary-card { margin-bottom: 16px; }

    .summary-grid {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center;
    }

    .summary-item { padding: 8px; }
    .summary-value { display: block; font-size: 1.6rem; font-weight: 700; color: var(--ion-color-primary); }
    .summary-item.accent .summary-value { color: var(--ion-color-success); }
    .summary-label { font-size: 0.75rem; color: var(--ion-color-medium); text-transform: uppercase; }

    .section-title {
      display: flex; align-items: center; gap: 8px;
      margin: 16px 0 8px; font-size: 1.1rem;
    }

    ion-card-title {
      display: flex; align-items: center; gap: 8px; font-size: 1rem;
    }

    .route-total {
      margin-left: auto; font-weight: 700; color: var(--ion-color-success);
    }

    .item-price { font-weight: 600; font-size: 0.9rem; }

    .not-found-card { border-left: 4px solid var(--ion-color-warning); }
    .not-found-card p { margin: 4px 0; color: var(--ion-color-medium); }
  `]
})
export class OptimizerPage {
  private http = inject(HttpClient);
  private shoppingList = inject(ShoppingListService);
  private posthog = inject(PosthogService);

  result = signal<OptimizerResult | null>(null);
  loading = signal(false);

  itemsNotFound = computed(() =>
    (this.result()?.items ?? []).filter(i => !i.cheapest).map(i => i.searchTerm)
  );

  constructor() {
    addIcons({ cartOutline, navigateOutline, checkmarkCircle });
    this.optimize();
  }

  slugify(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  }

  getItemPrice(searchTerm: string): number | null {
    const item = this.result()?.items.find(i => i.searchTerm === searchTerm);
    return item?.cheapest?.currentPrice ?? null;
  }

  private optimize() {
    const items = this.shoppingList.activeItems();
    if (items.length === 0) return;

    this.loading.set(true);
    const productNames = items.map(i => i.deal.productName);

    this.http.post<OptimizerResult>(`${environment.apiUrl}/optimizer`, productNames)
      .subscribe({
        next: result => {
          this.result.set(result);
          this.loading.set(false);
          this.posthog.posthog.capture('optimizer_viewed', {
            total_products: result.totalProducts,
            stops_needed: result.stopsNeeded,
            total_estimate: result.totalEstimate,
            items_not_found: result.items.filter(i => !i.cheapest).length,
          });
        },
        error: () => this.loading.set(false)
      });
  }
}
