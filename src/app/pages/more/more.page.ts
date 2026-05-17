import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonIcon, IonBadge, IonButton, IonToggle,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  storefrontOutline, cartOutline, pricetagsOutline, heartOutline,
  eyeOutline, bookOutline, sparklesOutline, logInOutline, logOutOutline,
  personCircleOutline, notificationsOutline
} from 'ionicons/icons';
import { ShoppingListService } from '../../services/shopping-list.service';
import { AuthService } from '../../services/auth.service';
import { PushNotificationService } from '../../services/push-notification.service';

@Component({
  selector: 'app-more',
  standalone: true,
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonBadge, IonButton, IonToggle],
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
          <ion-icon name="cart-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Boodschappenlijst</h2>
            <p>Je opgeslagen deals</p>
          </ion-label>
          @if (shoppingList.activeCount() > 0) {
            <ion-badge slot="end" color="primary">{{ shoppingList.activeCount() }}</ion-badge>
          }
        </ion-item>

        <ion-item routerLink="/watchlist" [detail]="true">
          <ion-icon name="eye-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Mijn Producten</h2>
            <p>Producten die je volgt</p>
          </ion-label>
        </ion-item>

        <ion-item routerLink="/optimizer" [detail]="true">
          <ion-icon name="sparkles-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Slimme Route</h2>
            <p>Goedkoopste boodschappenroute</p>
          </ion-label>
        </ion-item>

        <ion-item routerLink="/retailers" [detail]="true">
          <ion-icon name="storefront-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Winkels</h2>
            <p>Alle winkels en hun deals</p>
          </ion-label>
        </ion-item>

        <ion-item routerLink="/categories" [detail]="true">
          <ion-icon name="pricetags-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Categorieën</h2>
            <p>Zoek per productcategorie</p>
          </ion-label>
        </ion-item>

        <ion-item routerLink="/brands" [detail]="true">
          <ion-icon name="heart-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Merken</h2>
            <p>Favoriete merken volgen</p>
          </ion-label>
        </ion-item>
      </ion-list>

      @if (push.permission() !== 'denied' && pushSupported) {
        <ion-list>
          <ion-item>
            <ion-icon name="notifications-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Meldingen</h2>
              <p>{{ pushSubtitle() }}</p>
            </ion-label>
            <ion-toggle
              slot="end"
              [checked]="pushEnabled()"
              [disabled]="!auth.isLoggedIn() || working"
              (ionChange)="togglePush($event)"
            ></ion-toggle>
          </ion-item>
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .profile-section { padding: 14px 14px 6px; }
    .profile-card {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 14px;
      background: var(--retro-newsprint-bright);
      border: 2px solid var(--retro-ink);
      border-radius: 0;
      box-shadow: 2px 2px 0 0 var(--retro-ink);
    }
    .avatar {
      width: 44px; height: 44px;
      border-radius: 0;
      border: 2px solid var(--retro-ink);
      object-fit: cover;
    }
    .avatar-icon { font-size: 44px; color: var(--retro-ink); }
    .profile-card > div { flex: 1; }
    .profile-card strong {
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      font-weight: 400;
      font-size: 1.05rem;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: var(--retro-ink);
    }
    .profile-card p {
      margin: 2px 0 0;
      font-family: 'Space Mono', monospace;
      font-size: 0.7rem;
      letter-spacing: 0.02em;
      color: var(--retro-ink-soft);
    }
    .profile-card ion-button { margin-left: auto; }
    ion-item h2 {
      font-family: 'Newsreader', Georgia, serif;
      font-weight: 600;
      font-size: 1.05rem;
    }
    ion-icon[slot="start"] {
      font-size: 1.35rem;
      margin-right: 16px;
      color: var(--retro-ink);
    }
  `]
})
export class MorePage {
  shoppingList = inject(ShoppingListService);
  auth = inject(AuthService);
  push = inject(PushNotificationService);
  private toastCtrl = inject(ToastController);

  pushSupported = typeof Notification !== 'undefined';
  working = false;

  pushEnabled = computed(() =>
    this.push.permission() === 'granted' && this.push.token() !== null
  );

  pushSubtitle = computed(() => {
    if (!this.auth.isLoggedIn()) return 'Log in om meldingen aan te zetten';
    if (this.push.permission() === 'denied') return 'Geblokkeerd in browserinstellingen';
    if (this.pushEnabled()) return 'Aan — krijg alerts bij nieuwe deals';
    return 'Uit — tik om alerts te krijgen bij nieuwe deals van favoriete merken';
  });

  async togglePush(event: CustomEvent) {
    if (this.working) return;
    this.working = true;
    try {
      if (event.detail.checked) {
        const token = await this.push.enable();
        await this.showToast(
          token ? 'Meldingen ingeschakeld' : 'Toestemming geweigerd in browser',
          token ? 'success' : 'warning'
        );
      } else {
        await this.push.disable();
        await this.showToast('Meldingen uitgeschakeld', 'medium');
      }
    } finally {
      this.working = false;
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'medium') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  constructor() {
    addIcons({
      storefrontOutline, cartOutline, pricetagsOutline, heartOutline,
      eyeOutline, bookOutline, sparklesOutline, logInOutline, logOutOutline,
      personCircleOutline, notificationsOutline
    });
  }
}
