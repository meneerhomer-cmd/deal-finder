import { Component, OnInit, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
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
      });
    }
    this.shoppingList.loadItems().subscribe();
    this.alertService.checkForAlerts();
    this.handleAppUpdates();
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
