import { Component, OnInit, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonList, IonItem, IonLabel, IonBadge, IonIcon, IonSkeletonText, IonNote,
  IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { DealService } from '../../services/deal.service';
import { PosthogService } from '../../services/posthog.service';

@Component({
  selector: 'app-retailers',
  standalone: true,
  imports: [
    RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonList, IonItem, IonLabel, IonBadge, IonIcon, IonSkeletonText, IonNote,
    IonButtons, IonBackButton
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/more"></ion-back-button>
        </ion-buttons>
        <ion-title>Winkels</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (dealService.loading()) {
        <ion-list>
          @for (i of [1,2,3,4,5,6]; track i) {
            <ion-item>
              <ion-skeleton-text [animated]="true" style="width: 100%; height: 48px"></ion-skeleton-text>
            </ion-item>
          }
        </ion-list>
      } @else if (sortedRetailers().length === 0) {
        <div class="empty-state">
          <h2>Geen winkels beschikbaar</h2>
          <p>Probeer later opnieuw</p>
        </div>
      } @else {
        <div class="summary-bar">
          <span>{{ sortedRetailers().length }} winkels</span>
          <span>{{ totalDeals() }} actieve deals</span>
        </div>
        <ion-list>
          @for (retailer of sortedRetailers(); track retailer.slug) {
            <ion-item [routerLink]="['/retailer', retailer.slug]" [detail]="true" (click)="trackRetailerSelected(retailer)">
              <div class="retailer-logo" [class]="retailer.slug" slot="start">
                {{ retailer.name.charAt(0) }}
              </div>
              <ion-label>
                <h2>{{ retailer.name }}</h2>
                <p>{{ retailer.dealCount }} actieve deals</p>
              </ion-label>
              <ion-badge slot="end" [class]="retailer.slug">
                {{ retailer.dealCount }}
              </ion-badge>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .summary-bar {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      font-size: 0.85rem;
      color: var(--ion-color-medium);
      border-bottom: 1px solid var(--ion-color-light);
    }

    .retailer-logo {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
      margin-right: 16px;

      &.carrefour { background: var(--retailer-carrefour); }
      &.lidl { background: var(--retailer-lidl); }
      &.delhaize { background: var(--retailer-delhaize); }
      &.colruyt { background: var(--retailer-colruyt); }
      &.aldi { background: var(--retailer-aldi); }
      &.kruidvat { background: var(--retailer-kruidvat); }
    }

    ion-badge {
      font-size: 1rem;
      padding: 8px 12px;
      border-radius: 12px;

      &.carrefour { --background: var(--retailer-carrefour); }
      &.lidl { --background: var(--retailer-lidl); }
      &.delhaize { --background: var(--retailer-delhaize); }
      &.colruyt { --background: var(--retailer-colruyt); }
      &.aldi { --background: var(--retailer-aldi); }
      &.kruidvat { --background: var(--retailer-kruidvat); }
    }

    ion-item h2 {
      font-weight: 600;
    }
  `]
})
export class RetailersPage implements OnInit {
  dealService = inject(DealService);
  private posthog = inject(PosthogService);

  sortedRetailers = computed(() =>
    [...this.dealService.retailers()]
      .filter(r => r.dealCount > 0)
      .sort((a, b) => b.dealCount - a.dealCount)
  );

  totalDeals = computed(() =>
    this.dealService.retailers().reduce((sum, r) => sum + r.dealCount, 0)
  );

  ngOnInit() {
    if (this.dealService.retailers().length === 0) {
      this.dealService.loadRetailers().subscribe();
    }
  }

  refresh(event: any) {
    this.dealService.loadRetailers().subscribe({
      complete: () => event.target.complete()
    });
  }

  trackRetailerSelected(retailer: { slug: string; name: string; dealCount: number }) {
    this.posthog.posthog.capture('retailer_selected', {
      retailer_slug: retailer.slug,
      retailer_name: retailer.name,
      deal_count: retailer.dealCount,
    });
  }
}
