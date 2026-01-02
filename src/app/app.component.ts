import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, pricetag, storefront, settings } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, RouterLink, RouterLinkActive],
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
export class AppComponent {
  constructor() {
    addIcons({ home, pricetag, storefront, settings });
  }
}
