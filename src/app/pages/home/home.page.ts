import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon,
  IonList, IonItem, IonLabel, IonBadge, IonSkeletonText, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refresh, arrowForward, pricetag, storefront } from 'ionicons/icons';
import { DealService } from '../../services/deal.service';
import { DealCardComponent } from '../../components/deal-card/deal-card.component';
import { Deal, Retailer } from '../../models/deal.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon,
    IonList, IonItem, IonLabel, IonBadge, IonSkeletonText, IonSpinner,
    DealCardComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>🏷️ Deal Finder</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Welcome card -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Welkom!</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Vind de beste multi-buy promoties bij Belgische supermarkten.</p>
          <p class="stats" *ngIf="!dealService.loading()">
            <strong>{{ dealService.totalDeals() }}</strong> actieve deals beschikbaar
          </p>
        </ion-card-content>
      </ion-card>

      <!-- Retailers overview -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="storefront"></ion-icon>
            Winkels
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          @if (dealService.retailers().length === 0) {
            <ion-skeleton-text [animated]="true" style="height: 40px"></ion-skeleton-text>
          } @else {
            <div class="retailer-chips">
              @for (retailer of dealService.retailers(); track retailer.slug) {
                <a [routerLink]="['/retailer', retailer.slug]" class="retailer-chip" [class]="retailer.slug">
                  {{ retailer.name }}
                  <ion-badge color="light">{{ retailer.dealCount }}</ion-badge>
                </a>
              }
            </div>
          }
        </ion-card-content>
      </ion-card>

      <!-- Top deals -->
      <ion-card>
        <ion-card-header>
          <div class="section-header">
            <ion-card-title>
              <ion-icon name="pricetag"></ion-icon>
              Beste Deals
            </ion-card-title>
            <ion-button fill="clear" routerLink="/deals" size="small">
              Alles <ion-icon name="arrow-forward" slot="end"></ion-icon>
            </ion-button>
          </div>
        </ion-card-header>
        <ion-card-content class="deals-content">
          @if (dealService.loading()) {
            <div class="loading">
              <ion-spinner></ion-spinner>
              <p>Deals laden...</p>
            </div>
          } @else if (topDeals.length === 0) {
            <div class="empty">
              <p>Nog geen deals beschikbaar.</p>
              <ion-button fill="outline" (click)="triggerScan()">
                <ion-icon name="refresh" slot="start"></ion-icon>
                Scan starten
              </ion-button>
            </div>
          } @else {
            @for (deal of topDeals; track deal.id) {
              <app-deal-card [deal]="deal"></app-deal-card>
            }
          }
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .stats {
      margin-top: 12px;
      color: var(--ion-color-medium);
    }
    
    .retailer-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .retailer-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 20px;
      text-decoration: none;
      color: white;
      font-weight: 500;
      font-size: 0.9rem;
      
      &.carrefour { background: var(--retailer-carrefour); }
      &.lidl { background: var(--retailer-lidl); }
      &.delhaize { background: var(--retailer-delhaize); }
      &.colruyt { background: var(--retailer-colruyt); }
      &.aldi { background: var(--retailer-aldi); }
      &.kruidvat { background: var(--retailer-kruidvat); }
      
      ion-badge {
        --background: rgba(255,255,255,0.3);
        --color: white;
      }
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    ion-card-title ion-icon {
      margin-right: 8px;
      vertical-align: middle;
    }
    
    .deals-content {
      padding: 0;
    }
    
    .loading, .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      text-align: center;
      color: var(--ion-color-medium);
    }
  `]
})
export class HomePage implements OnInit {
  dealService = inject(DealService);
  
  get topDeals(): Deal[] {
    // Get top 5 deals sorted by discount
    return [...this.dealService.deals()]
      .sort((a, b) => b.effectiveDiscount - a.effectiveDiscount)
      .slice(0, 5);
  }

  constructor() {
    addIcons({ refresh, arrowForward, pricetag, storefront });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dealService.loadDeals().subscribe();
    this.dealService.loadRetailers().subscribe();
  }

  refresh(event: any) {
    this.dealService.loadDeals().subscribe({
      complete: () => event.target.complete()
    });
  }

  triggerScan() {
    this.dealService.triggerScan().subscribe({
      next: () => {
        setTimeout(() => this.loadData(), 2000);
      }
    });
  }
}
