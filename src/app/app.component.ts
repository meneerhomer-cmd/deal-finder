import { Component, OnInit, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, pricetag, search, ellipsisHorizontal } from 'ionicons/icons';
import { ShoppingListService } from './services/shopping-list.service';
import { AlertService } from './services/alert.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge, RouterLink, RouterLinkActive],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button routerLink="/home" routerLinkActive="tab-selected">
          <ion-icon name="home"></ion-icon>
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button routerLink="/deals" routerLinkActive="tab-selected">
          <ion-icon name="pricetag"></ion-icon>
          <ion-label>Deals</ion-label>
        </ion-tab-button>
        <ion-tab-button routerLink="/search" routerLinkActive="tab-selected">
          <ion-icon name="search"></ion-icon>
          <ion-label>Vergelijk</ion-label>
        </ion-tab-button>
        <ion-tab-button routerLink="/more" routerLinkActive="tab-selected">
          <ion-icon name="ellipsis-horizontal"></ion-icon>
          <ion-label>Meer</ion-label>
          @if (totalBadge() > 0) {
            <ion-badge color="danger">{{ totalBadge() }}</ion-badge>
          }
        </ion-tab-button>
      </ion-tab-bar>
    </ion-app>
  `,
  styles: [`
    ion-app { display: flex; flex-direction: column; }
    ion-router-outlet { flex: 1; display: flex; flex-direction: column; }
    ion-tab-bar { flex-shrink: 0; }
  `]
})
export class AppComponent implements OnInit {
  shoppingList = inject(ShoppingListService);
  alertService = inject(AlertService);

  totalBadge = computed(() => this.shoppingList.activeCount() + this.alertService.unseenCount());

  constructor() {
    addIcons({ home, pricetag, search, ellipsisHorizontal });
  }

  ngOnInit() {
    this.shoppingList.loadItems().subscribe();
    this.alertService.checkForAlerts();
  }
}
