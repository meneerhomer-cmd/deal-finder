import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonBadge, IonModal
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward, close, cartOutline } from 'ionicons/icons';
import { environment } from '@env/environment';
import { ShoppingListService } from '../../services/shopping-list.service';
import { PosthogService } from '../../services/posthog.service';

interface HotspotProduct {
  id: string;
  dealId: number | null;
  name: string;
  brandName: string | null;
  discountPercent: number;
  priceAfter: number | null;
  priceBefore: number | null;
  cropImage: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FlyerPage {
  pageId: string;
  pageIndex: number;
  imageUrl: string;
  products: HotspotProduct[];
}

@Component({
  selector: 'app-flyer-viewer',
  standalone: true,
  imports: [
    DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSpinner, IonBadge, IonModal
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/retailer/' + shopSlug"></ion-back-button>
        </ion-buttons>
        <ion-title>Folder</ion-title>
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
          <h2>Geen pagina's gevonden</h2>
        </div>
      } @else {
        <div class="page-nav">
          <ion-button fill="clear" size="small" [disabled]="currentIdx() === 0" (click)="prev()">
            <ion-icon name="chevron-back"></ion-icon>
          </ion-button>
          <span>Pagina {{ currentPage()?.pageIndex }} &middot; {{ currentPage()?.products?.length }} producten</span>
          <ion-button fill="clear" size="small" [disabled]="currentIdx() === pages().length - 1" (click)="next()">
            <ion-icon name="chevron-forward"></ion-icon>
          </ion-button>
        </div>

        <div class="flyer-container">
          <img [src]="currentPage()?.imageUrl" class="flyer-image" (load)="imageLoaded = true" />

          @if (imageLoaded) {
            @for (product of currentPage()?.products ?? []; track product.id) {
              <div class="hotspot"
                   [style.left.%]="product.x * 100"
                   [style.top.%]="product.y * 100"
                   [style.width.%]="product.width * 100"
                   [style.height.%]="product.height * 100"
                   (click)="selectProduct(product)">
                @if (product.discountPercent > 0) {
                  <span class="hotspot-badge">-{{ product.discountPercent }}%</span>
                }
              </div>
            }
          }
        </div>
      }

      <ion-modal [isOpen]="!!selectedProduct()" (didDismiss)="selectedProduct.set(null)">
        <ng-template>
          @if (selectedProduct(); as p) {
            <ion-header>
              <ion-toolbar>
                <ion-title>{{ p.name }}</ion-title>
                <ion-buttons slot="end">
                  <ion-button (click)="selectedProduct.set(null)">
                    <ion-icon name="close" slot="icon-only"></ion-icon>
                  </ion-button>
                </ion-buttons>
              </ion-toolbar>
            </ion-header>
            <ion-content class="ion-padding">
              @if (p.cropImage) {
                <img [src]="p.cropImage" class="product-crop" />
              }
              <h2>{{ p.name }}</h2>
              @if (p.brandName) {
                <p class="brand">{{ p.brandName }}</p>
              }
              <div class="modal-price">
                @if (p.priceAfter) {
                  <span class="price-big">€{{ p.priceAfter | number:'1.2-2' }}</span>
                }
                @if (p.priceBefore) {
                  <span class="price-old">€{{ p.priceBefore | number:'1.2-2' }}</span>
                }
                @if (p.discountPercent > 0) {
                  <span class="discount-badge">-{{ p.discountPercent }}%</span>
                }
              </div>
              @if (p.dealId) {
                <ion-button expand="block" (click)="addToList(p)">
                  <ion-icon name="cart-outline" slot="start"></ion-icon>
                  Toevoegen aan lijst
                </ion-button>
                @if (addFailed()) {
                  <p class="add-failed">Toevoegen mislukt. Probeer het opnieuw.</p>
                }
              } @else {
                <p class="add-unavailable">Dit product staat alleen in de folder — we kunnen het nog niet aan je lijst toevoegen.</p>
              }
            </ion-content>
          }
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    .add-unavailable, .add-failed {
      font-family: 'Space Mono', monospace; font-size: 0.8rem;
      text-align: center; opacity: 0.8; margin: 12px 0 0;
    }
    .add-failed { color: var(--retro-red, #e30613); }
    .loading, .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px; text-align: center; color: var(--ion-color-medium);
    }

    .page-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 4px 8px;
      background: var(--ion-toolbar-background, white);
      border-bottom: 1px solid var(--ion-color-light);
      position: sticky; top: 0; z-index: 10;
      font-size: 0.9rem; font-weight: 500;
    }

    .flyer-container {
      position: relative;
      width: 100%;
      line-height: 0;
    }

    .flyer-image {
      width: 100%;
      display: block;
    }

    .hotspot {
      position: absolute;
      border: 2px solid transparent;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover, &:active {
        border-color: var(--ion-color-primary);
        background: rgba(56, 128, 255, 0.15);
      }
    }

    .hotspot-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: var(--ion-color-danger);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 8px;
      pointer-events: none;
    }

    .product-crop {
      width: 100%;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .brand {
      color: var(--ion-color-medium);
      margin: 0 0 12px;
    }

    .modal-price {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 20px;
    }

    .price-big {
      font-size: 2rem;
      font-weight: 700;
      color: var(--ion-color-success);
    }

    .price-old {
      font-size: 1.1rem;
      text-decoration: line-through;
      color: var(--ion-color-medium);
    }
  `]
})
export class FlyerViewerPage implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private shoppingList = inject(ShoppingListService);
  private posthog = inject(PosthogService);

  shopSlug = '';
  imageLoaded = false;

  pages = signal<FlyerPage[]>([]);
  loading = signal(true);
  currentIdx = signal(0);
  selectedProduct = signal<HotspotProduct | null>(null);
  addFailed = signal(false);

  currentPage = computed(() => this.pages()[this.currentIdx()] ?? null);

  constructor() {
    addIcons({ chevronBack, chevronForward, close, cartOutline });
  }

  ngOnInit() {
    this.shopSlug = this.route.snapshot.paramMap.get('shopSlug') || '';
    const brochureId = this.route.snapshot.paramMap.get('brochureId') || '';
    this.loadPages(brochureId);
  }

  prev() {
    this.imageLoaded = false;
    this.currentIdx.update(i => Math.max(0, i - 1));
  }

  next() {
    this.imageLoaded = false;
    this.currentIdx.update(i => Math.min(this.pages().length - 1, i + 1));
  }

  selectProduct(product: HotspotProduct) {
    this.selectedProduct.set(product);
  }

  addToList(product: HotspotProduct) {
    if (product.dealId == null) return;

    this.posthog.posthog.capture('flyer_product_added_to_shopping_list', {
      product_name: product.name,
      brand_name: product.brandName,
      discount_percent: product.discountPercent,
      retailer_slug: this.shopSlug,
    });

    this.shoppingList.addDeal(product.dealId).subscribe({
      next: () => this.selectedProduct.set(null),
      error: () => this.addFailed.set(true)
    });
  }

  private loadPages(brochureId: string) {
    this.http.get<{ pages: FlyerPage[] }>(
      `${environment.apiUrl}/flyers/${this.shopSlug}/${brochureId}/pages`
    ).subscribe({
      next: data => {
        this.pages.set(data.pages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
