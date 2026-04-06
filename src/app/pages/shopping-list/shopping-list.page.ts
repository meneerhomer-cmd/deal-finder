import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonButtons,
  IonCheckbox, IonItemSliding, IonItemOptions, IonItemOption,
  IonBadge, IonSpinner, IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, checkmarkCircle, cartOutline } from 'ionicons/icons';
import { environment } from '@env/environment';

interface ShoppingListItem {
  id: number;
  deal: {
    id: number;
    productName: string;
    retailerName: string;
    retailerSlug: string;
    currentPrice: number | null;
    discountPercentage: number;
    categorySlug: string | null;
  };
  addedAt: string;
  purchased: boolean;
  purchasedAt: string | null;
}

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonButtons,
    IonCheckbox, IonItemSliding, IonItemOptions, IonItemOption,
    IonBadge, IonSpinner, IonSegment, IonSegmentButton
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Boodschappenlijst</ion-title>
        @if (items().length > 0) {
          <ion-buttons slot="end">
            <ion-button (click)="clearAll()">
              <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="currentTab" (ionChange)="onTabChange($event)">
          <ion-segment-button value="active">
            Actief
            @if (activeItems().length > 0) {
              <ion-badge color="primary">{{ activeItems().length }}</ion-badge>
            }
          </ion-segment-button>
          <ion-segment-button value="purchased">Gekocht</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading()) {
        <div class="loading">
          <ion-spinner></ion-spinner>
        </div>
      } @else if (displayedItems().length === 0) {
        <div class="empty-state">
          <ion-icon name="cart-outline" class="empty-icon"></ion-icon>
          <h2>{{ currentTab === 'active' ? 'Je lijst is leeg' : 'Nog niets gekocht' }}</h2>
          <p>{{ currentTab === 'active' ? 'Voeg deals toe vanuit de Deals pagina' : 'Markeer items als gekocht' }}</p>
        </div>
      } @else {
        <ion-list>
          @for (item of displayedItems(); track item.id) {
            <ion-item-sliding>
              <ion-item>
                <ion-checkbox
                  slot="start"
                  [checked]="item.purchased"
                  (ionChange)="togglePurchased(item)"
                ></ion-checkbox>
                <ion-label [class.purchased]="item.purchased">
                  <h2>{{ item.deal.productName }}</h2>
                  <p>
                    <span class="retailer-badge" [class]="item.deal.retailerSlug">{{ item.deal.retailerName }}</span>
                    @if (item.deal.currentPrice) {
                      <span class="item-price">€{{ item.deal.currentPrice | number:'1.2-2' }}</span>
                    }
                    <span class="item-discount">-{{ item.deal.discountPercentage }}%</span>
                  </p>
                </ion-label>
              </ion-item>
              <ion-item-options side="end">
                <ion-item-option color="danger" (click)="removeItem(item)">
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
    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 16px;
      text-align: center;
      color: var(--ion-color-medium);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 16px;
    }

    .purchased h2 {
      text-decoration: line-through;
      opacity: 0.6;
    }

    .item-price {
      font-weight: 600;
      margin-left: 8px;
    }

    .item-discount {
      color: var(--ion-color-danger);
      font-weight: 500;
      margin-left: 8px;
    }

    ion-segment {
      padding: 4px 8px;
    }
  `]
})
export class ShoppingListPage implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  items = signal<ShoppingListItem[]>([]);
  loading = signal(false);
  currentTab: 'active' | 'purchased' = 'active';

  private sessionId = this.getOrCreateSessionId();

  activeItems = computed(() => this.items().filter(i => !i.purchased));
  purchasedItems = computed(() => this.items().filter(i => i.purchased));
  displayedItems = computed(() =>
    this.currentTab === 'active' ? this.activeItems() : this.purchasedItems()
  );

  constructor() {
    addIcons({ trashOutline, checkmarkCircle, cartOutline });
  }

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.loading.set(true);
    this.http.get<ShoppingListItem[]>(`${this.apiUrl}/shopping-list`, {
      headers: { 'X-Session-Id': this.sessionId }
    }).subscribe({
      next: items => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  refresh(event: any) {
    this.http.get<ShoppingListItem[]>(`${this.apiUrl}/shopping-list`, {
      headers: { 'X-Session-Id': this.sessionId }
    }).subscribe({
      next: items => {
        this.items.set(items);
        event.target.complete();
      },
      error: () => event.target.complete(),
    });
  }

  togglePurchased(item: ShoppingListItem) {
    if (item.purchased) {
      this.http.delete(`${this.apiUrl}/shopping-list/${item.deal.id}/purchased`, {
        headers: { 'X-Session-Id': this.sessionId }
      }).subscribe(() => this.loadItems());
    } else {
      this.http.patch(`${this.apiUrl}/shopping-list/${item.deal.id}/purchased`, {}, {
        headers: { 'X-Session-Id': this.sessionId }
      }).subscribe(() => this.loadItems());
    }
  }

  removeItem(item: ShoppingListItem) {
    this.http.delete(`${this.apiUrl}/shopping-list/${item.deal.id}`, {
      headers: { 'X-Session-Id': this.sessionId }
    }).subscribe(() => this.loadItems());
  }

  clearAll() {
    this.http.delete(`${this.apiUrl}/shopping-list`, {
      headers: { 'X-Session-Id': this.sessionId }
    }).subscribe(() => this.loadItems());
  }

  onTabChange(event: CustomEvent) {
    this.currentTab = event.detail.value;
  }

  private getOrCreateSessionId(): string {
    const key = 'deal-finder-session-id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  }
}
