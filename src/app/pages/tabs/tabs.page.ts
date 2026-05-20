import { Component, inject, computed } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, pricetag, search, ellipsisHorizontal } from 'ionicons/icons';
import { ShoppingListService } from '../../services/shopping-list.service';
import { AlertService } from '../../services/alert.service';
import { HapticsService } from '../../services/haptics.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
  template: `
    <ion-tabs (ionTabsWillChange)="haptics.selection()">
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home">
          <ion-icon name="home"></ion-icon>
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="deals">
          <ion-icon name="pricetag"></ion-icon>
          <ion-label>Deals</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="search">
          <ion-icon name="search"></ion-icon>
          <ion-label>Zoek</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="more">
          <ion-icon name="ellipsis-horizontal"></ion-icon>
          <ion-label>Meer</ion-label>
          @if (totalBadge() > 0) {
            <ion-badge color="danger">{{ totalBadge() }}</ion-badge>
          }
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  private shoppingList = inject(ShoppingListService);
  private alertService = inject(AlertService);
  haptics = inject(HapticsService);

  totalBadge = computed(() => this.shoppingList.activeCount() + this.alertService.unseenCount());

  constructor() {
    addIcons({ home, pricetag, search, ellipsisHorizontal });
  }
}
