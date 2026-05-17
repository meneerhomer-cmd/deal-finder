import { Component, OnInit, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonButtons,
  IonCheckbox, IonItemSliding, IonItemOptions, IonItemOption,
  IonBadge, IonSpinner, IonSegment, IonSegmentButton, IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, cartOutline, sparklesOutline } from 'ionicons/icons';
import { ShoppingListService, ShoppingListItem } from '../../services/shopping-list.service';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [
    RouterLink, DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonButtons,
    IonCheckbox, IonItemSliding, IonItemOptions, IonItemOption,
    IonBadge, IonSpinner, IonSegment, IonSegmentButton, IonBackButton
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/more"></ion-back-button>
        </ion-buttons>
        <ion-title>Boodschappenlijst</ion-title>
        @if (shoppingList.items().length > 0) {
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
            @if (shoppingList.activeCount() > 0) {
              <ion-badge color="primary">{{ shoppingList.activeCount() }}</ion-badge>
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

      @if (shoppingList.activeCount() > 0 && currentTab === 'active') {
        <div class="summary-bar">
          @if (totalSavings() > 0) {
            <div class="savings-hero">
              <span class="savings-amount">€{{ totalSavings() | number:'1.2-2' }}</span>
              <span class="savings-text">bespaard met {{ shoppingList.activeCount() }} deals</span>
            </div>
          }
          <div class="summary-stats">
            <div class="summary-item">
              <span class="summary-label">Te betalen</span>
              <span class="summary-value">€{{ totalPrice() | number:'1.2-2' }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Oorspronkelijk</span>
              <span class="summary-value original">€{{ (totalPrice() + totalSavings()) | number:'1.2-2' }}</span>
            </div>
          </div>
          <ion-button expand="block" fill="outline" routerLink="/optimizer" size="small">
            <ion-icon name="sparkles-outline" slot="start"></ion-icon>
            Goedkoopste route
          </ion-button>
        </div>
      }

      @if (shoppingList.loading()) {
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
              <ion-item [routerLink]="['/deal', item.deal.id]" [detail]="true">
                <ion-checkbox
                  slot="start"
                  [checked]="item.purchased"
                  (ionChange)="togglePurchased(item)"
                  (click)="$event.stopPropagation()"
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
    .summary-bar {
      padding: 12px 16px;
      border-bottom: 1px solid var(--ion-color-light);
      background: var(--ion-color-light);
    }
    .savings-hero {
      text-align: center; padding: 8px 0 12px;
    }
    .savings-amount {
      display: block; font-size: 2rem; font-weight: 800;
      color: var(--ion-color-success, #2dd36f);
    }
    .savings-text {
      font-size: 0.8rem; color: var(--ion-color-medium);
    }
    .summary-stats {
      display: flex; justify-content: space-around; margin-bottom: 8px;
    }
    .summary-item { text-align: center; }
    .summary-label { display: block; font-size: 0.75rem; color: var(--ion-color-medium); text-transform: uppercase; }
    .summary-value { display: block; font-size: 1.1rem; font-weight: 700; color: var(--ion-color-primary); }
    .summary-value.original { text-decoration: line-through; color: var(--ion-color-medium); font-weight: 500; }
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
  shoppingList = inject(ShoppingListService);
  currentTab: 'active' | 'purchased' = 'active';

  displayedItems = computed(() =>
    this.currentTab === 'active' ? this.shoppingList.activeItems() : this.shoppingList.purchasedItems()
  );

  totalPrice = computed(() =>
    this.shoppingList.activeItems().reduce((sum, i) => sum + (i.deal.currentPrice || 0), 0)
  );

  totalSavings = computed(() =>
    this.shoppingList.activeItems().reduce((sum, i) => {
      const orig = (i.deal.currentPrice || 0) / (1 - (i.deal.discountPercentage || 0) / 100);
      return sum + (orig - (i.deal.currentPrice || 0));
    }, 0)
  );

  constructor() {
    addIcons({ trashOutline, cartOutline, sparklesOutline });
  }

  ngOnInit() {
    this.shoppingList.loadItems().subscribe();
  }

  refresh(event: any) {
    this.shoppingList.loadItems().subscribe({
      complete: () => event.target.complete()
    });
  }

  togglePurchased(item: ShoppingListItem) {
    if (item.purchased) {
      this.shoppingList.markNotPurchased(item.deal.id).subscribe();
    } else {
      this.shoppingList.markPurchased(item.deal.id).subscribe();
    }
  }

  removeItem(item: ShoppingListItem) {
    this.shoppingList.removeDeal(item.deal.id).subscribe();
  }

  clearAll() {
    this.shoppingList.clearAll().subscribe();
  }

  onTabChange(event: CustomEvent) {
    this.currentTab = event.detail.value;
  }
}
