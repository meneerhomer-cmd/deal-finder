import { Component, OnInit, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { ShoppingListService } from './services/shopping-list.service';
import { AlertService } from './services/alert.service';
import { PosthogService } from './services/posthog.service';
import { environment } from '../environments/environment';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class AppComponent implements OnInit {
  private shoppingList = inject(ShoppingListService);
  private alertService = inject(AlertService);
  private posthog = inject(PosthogService);
  private swUpdate = inject(SwUpdate);

  ngOnInit() {
    if (environment.posthog.key) {
      this.posthog.init(environment.posthog.key, {
        api_host: environment.posthog.host,
        capture_exceptions: true,
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: '[data-private]',
        },
        disable_session_recording: false,
        autocapture: true,
      });
      this.captureReferral();
    }
    this.shoppingList.loadItems().subscribe();
    this.alertService.checkForAlerts();
    this.handleAppUpdates();
    this.confirmCapgoBundle();
  }

  // Friend-test attribution: a `?ref=dad` (etc.) on first visit is registered as
  // a PostHog super property so every subsequent event is tagged with who shared
  // the link, and stored so it survives navigation/return visits.
  private captureReferral() {
    if (typeof window === 'undefined') return;
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref) return;
    this.posthog.posthog.register({ referral_source: ref });
    this.posthog.posthog.capture('referral_visit', { ref });
  }

  // Tell Capgo this OTA bundle loaded successfully. Without this the plugin
  // assumes the update crashed and rolls back to the previous bundle. No-op on
  // web (the Capgo runtime only exists in the native shell).
  private confirmCapgoBundle() {
    if (!Capacitor.isNativePlatform()) return;
    CapacitorUpdater.notifyAppReady().catch(() => {});
  }

  private handleAppUpdates() {
    if (!this.swUpdate.isEnabled) return;
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is { type: 'VERSION_READY' } & any => evt.type === 'VERSION_READY'))
      .subscribe(async () => {
        await this.swUpdate.activateUpdate();
        location.reload();
      });
  }
}
