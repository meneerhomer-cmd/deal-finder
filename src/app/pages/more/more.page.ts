import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonIcon, IonBadge, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  storefrontOutline, cartOutline, pricetagsOutline, heartOutline,
  eyeOutline, bookOutline, sparklesOutline, logInOutline, logOutOutline, personCircleOutline
} from 'ionicons/icons';
import { ShoppingListService } from '../../services/shopping-list.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-more',
  standalone: true,
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonBadge, IonButton],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Meer</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Auth section -->
      <div class="profile-section">
        @if (auth.isLoggedIn()) {
          <div class="profile-card">
            @if (auth.photoURL()) {
              <img [src]="auth.photoURL()" class="avatar" />
            } @else {
              <ion-icon name="person-circle-outline" class="avatar-icon"></ion-icon>
            }
            <div>
              <strong>{{ auth.displayName() }}</strong>
              <p>{{ auth.currentUser()?.email }}</p>
            </div>
            <ion-button fill="clear" size="small" (click)="auth.logout()">
              <ion-icon name="log-out-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </div>
        } @else {
          <ion-button expand="block" (click)="auth.signInWithGoogle()">
            <ion-icon name="log-in-outline" slot="start"></ion-icon>
            Inloggen met Google
          </ion-button>
        }
      </div>

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
    .profile-section { padding: 16px; }
    .profile-card {
      display: flex; align-items: center; gap: 12px;
      padding: 12px; background: var(--ion-card-background, white);
      border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .avatar { width: 48px; height: 48px; border-radius: 50%; }
    .avatar-icon { font-size: 48px; color: var(--ion-color-medium); }
    .profile-card p { margin: 2px 0 0; font-size: 0.8rem; color: var(--ion-color-medium); }
    .profile-card ion-button { margin-left: auto; }
    ion-item h2 { font-weight: 600; }
    ion-icon[slot="start"] { font-size: 1.4rem; margin-right: 16px; }
  `]
})
export class MorePage {
  shoppingList = inject(ShoppingListService);
  auth = inject(AuthService);

  constructor() {
    addIcons({
      storefrontOutline, cartOutline, pricetagsOutline, heartOutline,
      eyeOutline, bookOutline, sparklesOutline, logInOutline, logOutOutline, personCircleOutline
    });
  }
}
