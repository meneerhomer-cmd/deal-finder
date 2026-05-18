import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Niet gevonden</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="not-found">
        <ion-icon name="alert-circle-outline" class="hero"></ion-icon>
        <h1>Pagina niet gevonden</h1>
        <p class="path">{{ attemptedPath }}</p>
        <p>Deze pagina bestaat niet (meer). Misschien is de link verouderd.</p>
        <ion-button (click)="goHome()" expand="block" class="home-btn">
          <ion-icon name="home-outline" slot="start"></ion-icon>
          Naar de homepage
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .not-found { text-align: center; padding: 48px 24px; max-width: 420px; margin: 0 auto; }
    .hero { font-size: 5rem; color: var(--retro-red, #e30613); margin-bottom: 16px; }
    h1 { font-family: var(--font-display, Anton), sans-serif; text-transform: uppercase; margin: 0 0 12px; }
    .path { font-family: var(--font-mono, 'Space Mono'), monospace; color: var(--ion-color-medium); word-break: break-all; margin: 4px 0 24px; }
    .home-btn { margin-top: 16px; }
  `],
})
export class NotFoundPage {
  private router = inject(Router);
  attemptedPath = this.router.url;

  goHome() {
    this.router.navigate(['/home']);
  }
}
