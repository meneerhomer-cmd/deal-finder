import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonList, IonItem, IonLabel, IonBadge, IonIcon, IonSkeletonText, IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForward } from 'ionicons/icons';
import { DealService } from '../../services/deal.service';

@Component({
  selector: 'app-retailers',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonList, IonItem, IonLabel, IonBadge, IonIcon, IonSkeletonText, IonNote
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>🏪 Winkels</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-list>
        @if (dealService.retailers().length === 0) {
          @for (i of [1,2,3,4,5,6]; track i) {
            <ion-item>
              <ion-skeleton-text [animated]="true" style="width: 100%; height: 48px"></ion-skeleton-text>
            </ion-item>
          }
        } @else {
          @for (retailer of dealService.retailers(); track retailer.slug) {
            <ion-item [routerLink]="['/retailer', retailer.slug]" [detail]="true">
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
        }
      </ion-list>
    </ion-content>
  `,
  styles: [`
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

  constructor() {
    addIcons({ chevronForward });
  }

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
}
