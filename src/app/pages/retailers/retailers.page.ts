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
      font-family: 'Space Mono', monospace;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--retro-ink-soft);
      border-bottom: 2px solid var(--retro-ink);
      background: var(--retro-newsprint);
    }

    .retailer-logo {
      width: 44px;
      height: 44px;
      border-radius: 0;
      border: 2px solid var(--retro-ink);
      box-shadow: 2px 2px 0 0 var(--retro-ink);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      font-size: 1.4rem;
      font-weight: 400;
      color: white;
      background: var(--retro-ink-soft);
      margin-right: 16px;

      &.carrefour { background: var(--retailer-carrefour); }
      &.lidl { background: var(--retailer-lidl); }
      &.delhaize { background: var(--retailer-delhaize); }
      &.colruyt { background: var(--retailer-colruyt); color: var(--retro-ink); }
      &.aldi { background: var(--retailer-aldi); }
      &.kruidvat { background: var(--retailer-kruidvat); }
      &.albert-heijn { background: var(--retailer-albert-heijn); }
      &.jumbo { background: var(--retailer-jumbo); color: var(--retro-ink); }
      &.spar { background: var(--retailer-spar); }
      &.carrefour-market { background: var(--retailer-carrefour-market); }
      &.intermarche { background: var(--retailer-intermarche); }
      &.renmans { background: var(--retailer-renmans); }
      &.bol-com { background: var(--retailer-bol-com); }
      &.mediamarkt { background: var(--retailer-mediamarkt); }
      &.ikea { background: var(--retailer-ikea); }
      &.gamma { background: var(--retailer-gamma); }
      &.brico-bricoplanit { background: var(--retailer-brico-bricoplanit); }
    }

    ion-badge {
      font-family: 'Space Mono', monospace;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 0;
      border: 2px solid var(--retro-ink);
      box-shadow: 1.5px 1.5px 0 0 var(--retro-ink);
      --color: #fff;
      --background: var(--retro-ink-soft);

      &.carrefour { --background: var(--retailer-carrefour); }
      &.lidl { --background: var(--retailer-lidl); }
      &.delhaize { --background: var(--retailer-delhaize); }
      &.colruyt { --background: var(--retailer-colruyt); --color: var(--retro-ink); }
      &.aldi { --background: var(--retailer-aldi); }
      &.kruidvat { --background: var(--retailer-kruidvat); }
      &.albert-heijn { --background: var(--retailer-albert-heijn); }
      &.jumbo { --background: var(--retailer-jumbo); --color: var(--retro-ink); }
      &.spar { --background: var(--retailer-spar); }
      &.carrefour-market { --background: var(--retailer-carrefour-market); }
      &.intermarche { --background: var(--retailer-intermarche); }
      &.renmans { --background: var(--retailer-renmans); }
      &.bol-com { --background: var(--retailer-bol-com); }
      &.mediamarkt { --background: var(--retailer-mediamarkt); }
      &.ikea { --background: var(--retailer-ikea); }
      &.gamma { --background: var(--retailer-gamma); }
      &.brico-bricoplanit { --background: var(--retailer-brico-bricoplanit); }
    }

    ion-item h2 {
      font-family: 'Newsreader', Georgia, serif;
      font-weight: 600;
      font-size: 1.05rem;
      letter-spacing: -0.01em;
    }
    ion-item p {
      font-family: 'Space Mono', monospace;
      font-size: 0.7rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--retro-ink-soft);
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
