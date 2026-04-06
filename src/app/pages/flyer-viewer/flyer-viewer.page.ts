import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonButton, IonIcon, IonSpinner, IonBadge,
  IonSegment, IonSegmentButton, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward, cartOutline } from 'ionicons/icons';
import { environment } from '@env/environment';

interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageId: string;
  imageUrl: string | null;
}

interface FlyerProduct {
  id: string;
  name: string;
  brandName: string | null;
  discountPercent: number;
  priceAfterDiscount: number | null;
  priceBeforeDiscount: number | null;
  hotspot: Hotspot | null;
}

interface FlyerPage {
  pageIndex: number;
  products: FlyerProduct[];
}

interface FlyerResponse {
  brochureId: string;
  shopSlug: string;
  pageCount: number;
  totalProducts: number;
  pages: FlyerPage[];
}

interface Flyer {
  id: string;
  name: string;
  activeFrom: string;
  expireAfter: string;
  coverImage: string;
  retailerName: string;
}

@Component({
  selector: 'app-flyer-viewer',
  standalone: true,
  imports: [
    DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonButton, IonIcon, IonSpinner, IonBadge,
    IonSegment, IonSegmentButton, IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/retailer/' + shopSlug"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ flyer()?.retailerName || 'Folder' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (loading()) {
        <div class="loading">
          <ion-spinner></ion-spinner>
          <p>Folder laden...</p>
        </div>
      } @else if (pages().length === 0) {
        <div class="empty-state">
          <h2>Geen producten gevonden</h2>
          <p>Deze folder heeft geen getagde producten</p>
        </div>
      } @else {
        <div class="page-nav">
          <ion-button fill="clear" [disabled]="currentPage() === 0" (click)="prevPage()">
            <ion-icon name="chevron-back"></ion-icon>
          </ion-button>
          <span class="page-indicator">
            Pagina {{ currentPageData()?.pageIndex ?? 0 }} van {{ pages().length }}
            <ion-badge color="primary">{{ currentPageData()?.products?.length ?? 0 }} producten</ion-badge>
          </span>
          <ion-button fill="clear" [disabled]="currentPage() === pages().length - 1" (click)="nextPage()">
            <ion-icon name="chevron-forward"></ion-icon>
          </ion-button>
        </div>

        <div class="products-list">
          @for (product of currentPageData()?.products ?? []; track product.id) {
            <ion-card class="product-card">
              <ion-card-content>
                <div class="product-row">
                  <div class="product-info">
                    <h3>{{ product.name }}</h3>
                    @if (product.brandName) {
                      <span class="brand">{{ product.brandName }}</span>
                    }
                  </div>
                  <div class="product-price">
                    @if (product.priceAfterDiscount) {
                      <span class="price">€{{ product.priceAfterDiscount | number:'1.2-2' }}</span>
                    }
                    @if (product.discountPercent > 0) {
                      <span class="discount">-{{ product.discountPercent }}%</span>
                    }
                    @if (product.priceBeforeDiscount) {
                      <span class="original">€{{ product.priceBeforeDiscount | number:'1.2-2' }}</span>
                    }
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          }
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .loading, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      text-align: center;
      color: var(--ion-color-medium);
    }

    .page-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: var(--ion-card-background, white);
      border-bottom: 1px solid var(--ion-color-light);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .page-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .product-card {
      margin: 4px 8px;
    }

    .product-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .product-info {
      flex: 1;
      min-width: 0;

      h3 {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
      }

      .brand {
        font-size: 0.8rem;
        color: var(--ion-color-medium);
      }
    }

    .product-price {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      flex-shrink: 0;
    }

    .price {
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--ion-color-success);
    }

    .discount {
      font-size: 0.8rem;
      color: var(--ion-color-danger);
      font-weight: 600;
    }

    .original {
      font-size: 0.75rem;
      text-decoration: line-through;
      color: var(--ion-color-medium);
    }
  `]
})
export class FlyerViewerPage implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  shopSlug = '';
  brochureId = '';

  flyer = signal<Flyer | null>(null);
  pages = signal<FlyerPage[]>([]);
  loading = signal(true);
  currentPage = signal(0);

  currentPageData = () => this.pages()[this.currentPage()] ?? null;

  constructor() {
    addIcons({ chevronBack, chevronForward, cartOutline });
  }

  ngOnInit() {
    this.shopSlug = this.route.snapshot.paramMap.get('shopSlug') || '';
    this.brochureId = this.route.snapshot.paramMap.get('brochureId') || '';
    this.loadFlyerPages();
  }

  prevPage() {
    if (this.currentPage() > 0) this.currentPage.update(p => p - 1);
  }

  nextPage() {
    if (this.currentPage() < this.pages().length - 1) this.currentPage.update(p => p + 1);
  }

  private loadFlyerPages() {
    this.loading.set(true);
    this.http.get<FlyerResponse>(
      `${environment.apiUrl}/flyers/${this.shopSlug}/${this.brochureId}/pages`
    ).subscribe({
      next: data => {
        this.pages.set(data.pages);
        this.loading.set(false);
      },
      error: () => {
        this.pages.set([]);
        this.loading.set(false);
      }
    });
  }
}
