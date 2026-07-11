import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonButtons,
  IonCheckbox, IonItemSliding, IonItemOptions, IonItemOption,
  IonSpinner, IonBackButton
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, cartOutline, sparklesOutline } from 'ionicons/icons';
import { ShoppingListService, ShoppingListItem } from '../../services/shopping-list.service';
import { PosthogService } from '../../services/posthog.service';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [
    RouterLink, DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonButtons,
    IonCheckbox, IonItemSliding, IonItemOptions, IonItemOption,
    IonSpinner, IonBackButton
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
        <div class="mode-toggle">
          <button class="mode-btn" [class.active]="currentTab() === 'active'" (click)="currentTab.set('active')">
            Actief
            @if (shoppingList.activeCount() > 0) {
              <span class="tab-count">{{ shoppingList.activeCount() }}</span>
            }
          </button>
          <button class="mode-btn" [class.active]="currentTab() === 'purchased'" (click)="currentTab.set('purchased')">Gekocht</button>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (shoppingList.activeCount() > 0 && currentTab() === 'active') {
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
          <h2>{{ currentTab() === 'active' ? 'Je lijst is leeg' : 'Nog niets gekocht' }}</h2>
          <p>{{ currentTab() === 'active' ? 'Voeg deals toe vanuit de Deals pagina' : 'Markeer items als gekocht' }}</p>
        </div>
      } @else {
        <ion-list>
          @for (item of displayedItems(); track item.id) {
            <ion-item-sliding>
              <ion-item [routerLink]="['/deal', item.deal.id]" [detail]="true">
                <ion-checkbox
                  slot="start"
                  [attr.aria-label]="'Markeer ' + item.deal.productName + ' als gekocht'"
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

    .mode-toggle {
      display: flex;
      background: var(--retro-newsprint);
      padding: 8px 12px 10px;
      gap: 0;
      border-bottom: 2px solid var(--retro-ink);
    }
    .mode-btn {
      flex: 1;
      padding: 8px 0 7px;
      border: 2px solid var(--retro-ink);
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      font-size: 0.95rem;
      font-weight: 400;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      cursor: pointer;
      background: var(--retro-newsprint-bright);
      color: var(--retro-ink);
      transition: background-color 0.1s ease;
    }
    .mode-btn + .mode-btn { border-left-width: 0; }
    .mode-btn.active {
      background: var(--retro-yellow);
      color: var(--retro-ink);
      box-shadow: inset 0 -4px 0 0 var(--retro-ink);
    }
    .tab-count {
      display: inline-block; margin-left: 6px; padding: 0 6px;
      background: var(--retro-red); color: #fff; font-size: 0.75rem;
    }
  `]
})
export class ShoppingListPage implements OnInit {
  shoppingList = inject(ShoppingListService);
  private posthog = inject(PosthogService);
  private alertController = inject(AlertController);
  currentTab = signal<'active' | 'purchased'>('active');

  displayedItems = computed(() =>
    this.currentTab() === 'active' ? this.shoppingList.activeItems() : this.shoppingList.purchasedItems()
  );

  totalPrice = computed(() =>
    this.shoppingList.activeItems().reduce((sum, i) => sum + (i.deal.currentPrice || 0), 0)
  );

  totalSavings = computed(() =>
    this.shoppingList.activeItems().reduce((sum, i) => {
      const current = i.deal.currentPrice ?? 0;
      const original = i.deal.originalPrice ?? current;
      return sum + Math.max(0, original - current);
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
      this.posthog.posthog.capture('shopping_list_item_purchased', {
        product_name: item.deal.productName,
        retailer: item.deal.retailerName,
        current_price: item.deal.currentPrice,
        discount_percentage: item.deal.discountPercentage,
      });
    }
  }

  removeItem(item: ShoppingListItem) {
    this.shoppingList.removeDeal(item.deal.id).subscribe();
  }

  async clearAll() {
    const count = this.shoppingList.activeCount();
    const alert = await this.alertController.create({
      header: 'Lijst wissen?',
      message: count === 1
        ? 'Je verwijdert 1 item van je lijst. Dit kan niet ongedaan gemaakt worden.'
        : `Je verwijdert ${count} items van je lijst. Dit kan niet ongedaan gemaakt worden.`,
      buttons: [
        { text: 'Annuleren', role: 'cancel' },
        {
          text: 'Wissen',
          role: 'destructive',
          handler: () => { this.shoppingList.clearAll().subscribe(); }
        }
      ]
    });
    await alert.present();
  }
}
