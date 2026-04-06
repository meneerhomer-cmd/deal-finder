import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, pricetag, storefront, cart } from 'ionicons/icons';
import { ShoppingListService } from './services/shopping-list.service';

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
        <ion-tab-button routerLink="/retailers" routerLinkActive="tab-selected">
          <ion-icon name="storefront"></ion-icon>
          <ion-label>Winkels</ion-label>
        </ion-tab-button>
        <ion-tab-button routerLink="/shopping-list" routerLinkActive="tab-selected">
          <ion-icon name="cart"></ion-icon>
          <ion-label>Lijst</ion-label>
          @if (shoppingList.activeCount() > 0) {
            <ion-badge color="danger">{{ shoppingList.activeCount() }}</ion-badge>
          }
        </ion-tab-button>
      </ion-tab-bar>
    </ion-app>
  `,
  styles: [`
    ion-app {
      display: flex;
      flex-direction: column;
    }
    ion-router-outlet {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    ion-tab-bar {
      flex-shrink: 0;
    }
  `]
})
export class AppComponent implements OnInit {
  shoppingList = inject(ShoppingListService);

  constructor() {
    addIcons({ home, pricetag, storefront, cart });
  }

  ngOnInit() {
    this.shoppingList.loadItems().subscribe();
  }
}
