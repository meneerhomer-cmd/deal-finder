import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonSpinner,
  IonItemSliding, IonItemOptions, IonItemOption, IonInput
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline, searchOutline } from 'ionicons/icons';
import { environment } from '@env/environment';
import { UserDataService } from '../../services/user-data.service';
import { AlertService } from '../../services/alert.service';

interface WatchItem {
  name: string;
  bestPrice: number | null;
  bestRetailer: string | null;
  discount: number;
  resultCount: number;
  lastChecked: string;
}

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [
    DecimalPipe, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonSpinner,
    IonItemSliding, IonItemOptions, IonItemOption, IonInput
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mijn Producten</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (alertService.alerts().length > 0) {
        <div class="alerts-section">
          <div class="alerts-header">
            <span>Prijsdalingen</span>
            <ion-button fill="clear" size="small" (click)="alertService.markAllSeen()">
              Markeer gelezen
            </ion-button>
          </div>
          @for (alert of alertService.alerts(); track alert.productName) {
            <div class="alert-card" [class.unseen]="!alert.seen">
              <div class="alert-info">
                <strong>{{ alert.productName }}</strong>
                <p>{{ alert.retailer }} &middot; -{{ alert.priceDrop }}% gedaald</p>
              </div>
              <div class="alert-prices">
                <span class="old-price">{{ alert.previousPrice | number:'1.2-2' }}</span>
                <span class="new-price">{{ alert.currentPrice | number:'1.2-2' }}</span>
              </div>
            </div>
          }
        </div>
      }

      <div class="add-bar">
        <ion-input
          placeholder="Product toevoegen (bv. Pampers, Coca-Cola...)"
          [(ngModel)]="newProduct"
          (keyup.enter)="addProduct()"
          fill="outline"
        ></ion-input>
        <ion-button (click)="addProduct()" [disabled]="!newProduct.trim()">
          <ion-icon name="add-outline" slot="icon-only"></ion-icon>
        </ion-button>
      </div>

      @if (loading()) {
        <div class="loading">
          <ion-spinner></ion-spinner>
          <p>Prijzen checken...</p>
        </div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <ion-icon name="search-outline" class="hero-icon"></ion-icon>
          <h2>Volg je favoriete producten</h2>
          <p>Voeg producten toe die je regelmatig koopt. We tonen de beste prijs bij alle winkels.</p>
        </div>
      } @else {
        <ion-list>
          @for (item of items(); track item.name) {
            <ion-item-sliding>
              <ion-item>
                <ion-label>
                  <h2>{{ item.name }}</h2>
                  @if (item.bestRetailer) {
                    <p>
                      Goedkoopst bij <strong>{{ item.bestRetailer }}</strong>
                      @if (item.discount > 0) {
                        <span class="watch-discount">-{{ item.discount }}%</span>
                      }
                    </p>
                  } @else {
                    <p class="not-found">Niet gevonden in huidige folders</p>
                  }
                </ion-label>
                @if (item.bestPrice) {
                  <span slot="end" class="watch-price">€{{ item.bestPrice | number:'1.2-2' }}</span>
                }
              </ion-item>
              <ion-item-options side="end">
                <ion-item-option color="danger" (click)="removeProduct(item.name)">
                  <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .add-bar {
      display: flex; gap: 8px; padding: 12px;
      border-bottom: 1px solid var(--ion-color-light);
    }
    .add-bar ion-input { flex: 1; }
    .loading {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px; color: var(--ion-color-medium);
    }
    .hero-icon { font-size: 4rem; margin-bottom: 16px; color: var(--ion-color-primary); }
    .watch-price { font-weight: 700; font-size: 1.1rem; color: var(--ion-color-success); }
    .watch-discount { color: var(--ion-color-danger); font-weight: 600; margin-left: 4px; }
    .not-found { color: var(--ion-color-medium); font-style: italic; }
    .alerts-section { padding: 12px; }
    .alerts-header {
      display: flex; justify-content: space-between; align-items: center;
      font-weight: 600; font-size: 0.85rem; text-transform: uppercase;
      color: var(--ion-color-medium); letter-spacing: 0.5px; margin-bottom: 8px;
    }
    .alert-card {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px; margin-bottom: 8px; border-radius: 10px;
      background: var(--ion-color-success-tint, #e8f5e9);
    }
    .alert-card.unseen { border-left: 3px solid var(--ion-color-success); }
    .alert-info p { margin: 2px 0 0; font-size: 0.8rem; color: var(--ion-color-medium); }
    .alert-prices { text-align: right; }
    .old-price { text-decoration: line-through; color: var(--ion-color-medium); font-size: 0.85rem; display: block; }
    .new-price { font-weight: 700; color: var(--ion-color-success); font-size: 1.1rem; }
  `]
})
export class WatchlistPage implements OnInit {
  private http = inject(HttpClient);
  userData = inject(UserDataService);
  alertService = inject(AlertService);

  items = signal<WatchItem[]>([]);
  loading = signal(false);
  newProduct = '';

  constructor() {
    addIcons({ addOutline, trashOutline, searchOutline });
    effect(() => {
      const products = this.userData.watchlist();
      if (products.length > 0 || this.items().length > 0) {
        this.refreshPrices(products);
      }
    });
  }

  ngOnInit() {
    this.refreshPrices(this.userData.watchlist());
  }

  async addProduct() {
    const name = this.newProduct.trim();
    if (!name) return;
    await this.userData.addToWatchlist(name);
    this.newProduct = '';
  }

  async removeProduct(name: string) {
    await this.userData.removeFromWatchlist(name);
    this.items.update(items => items.filter(i => i.name !== name));
  }

  private refreshPrices(products: string[]) {
    if (products.length === 0) {
      this.items.set([]);
      return;
    }

    this.loading.set(true);
    let completed = 0;
    const results: WatchItem[] = [];

    for (const name of products) {
      this.http.get<any>(`${environment.apiUrl}/search`, { params: { q: name, limit: '5' } })
        .subscribe({
          next: data => {
            const best = data.results?.[0];
            results.push({
              name,
              bestPrice: best?.currentPrice ?? null,
              bestRetailer: best?.retailerName ?? null,
              discount: best?.discountPercentage ?? 0,
              resultCount: data.count ?? 0,
              lastChecked: new Date().toISOString()
            });
          },
          error: () => {
            results.push({ name, bestPrice: null, bestRetailer: null, discount: 0, resultCount: 0, lastChecked: new Date().toISOString() });
          },
          complete: () => {
            completed++;
            if (completed === products.length) {
              this.items.set(results.sort((a, b) => a.name.localeCompare(b.name)));
              this.loading.set(false);
            }
          }
        });
    }
  }
}
