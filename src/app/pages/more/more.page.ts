import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonIcon, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  storefrontOutline, cartOutline, pricetagsOutline, heartOutline,
  eyeOutline, bookOutline, sparklesOutline, informationCircleOutline
} from 'ionicons/icons';
import { ShoppingListService } from '../../services/shopping-list.service';

@Component({
  selector: 'app-more',
  standalone: true,
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonBadge],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Meer</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item routerLink="/shopping-list" [detail]="true">
          <ion-icon name="cart-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h2>Boodschappenlijst</h2>
            <p>Je opgeslagen deals</p>
          </ion-label>
          @if (shoppingList.activeCount() > 0) {
            <ion-badge slot="end" color="primary">{{ shoppingList.activeCount() }}</ion-badge>
          }
        </ion-item>

        <ion-item routerLink="/watchlist" [detail]="true">
          <ion-icon name="eye-outline" slot="start" color="tertiary"></ion-icon>
          <ion-label>
            <h2>Mijn Producten</h2>
            <p>Producten die je volgt</p>
          </ion-label>
        </ion-item>

        <ion-item routerLink="/optimizer" [detail]="true">
          <ion-icon name="sparkles-outline" slot="start" color="success"></ion-icon>
          <ion-label>
            <h2>Slimme Route</h2>
            <p>Goedkoopste boodschappenroute</p>
          </ion-label>
        </ion-item>

        <ion-item routerLink="/retailers" [detail]="true">
          <ion-icon name="storefront-outline" slot="start" color="warning"></ion-icon>
          <ion-label>
            <h2>Winkels</h2>
            <p>Alle winkels en hun deals</p>
          </ion-label>
        </ion-item>

        <ion-item routerLink="/categories" [detail]="true">
          <ion-icon name="pricetags-outline" slot="start" color="secondary"></ion-icon>
          <ion-label>
            <h2>Categorieën</h2>
            <p>Zoek per productcategorie</p>
          </ion-label>
        </ion-item>

        <ion-item routerLink="/brands" [detail]="true">
          <ion-icon name="heart-outline" slot="start" color="danger"></ion-icon>
          <ion-label>
            <h2>Merken</h2>
            <p>Favoriete merken volgen</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    ion-item h2 { font-weight: 600; }
    ion-icon[slot="start"] { font-size: 1.4rem; margin-right: 16px; }
  `]
})
export class MorePage {
  shoppingList = inject(ShoppingListService);

  constructor() {
    addIcons({
      storefrontOutline, cartOutline, pricetagsOutline, heartOutline,
      eyeOutline, bookOutline, sparklesOutline, informationCircleOutline
    });
  }
}
