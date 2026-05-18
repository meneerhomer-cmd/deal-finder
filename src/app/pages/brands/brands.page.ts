import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonList, IonItem, IonLabel, IonBadge,
  IonSpinner, IonIcon, IonChip, IonButtons, IonBackButton, IonButton
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { heartOutline, heart, searchOutline } from 'ionicons/icons';
import { environment } from '@env/environment';
import { UserDataService } from '../../services/user-data.service';
import { AuthService } from '../../services/auth.service';
import { PosthogService } from '../../services/posthog.service';

interface Brand {
  name: string;
  retailers: string[];
  retailerCount: number;
}

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonSearchbar, IonList, IonItem, IonLabel, IonBadge,
    IonSpinner, IonIcon, IonChip, IonButtons, IonBackButton, IonButton
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/more"></ion-back-button>
        </ion-buttons>
        <ion-title>Merken</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          placeholder="Zoek een merk..."
          [debounce]="200"
          (ionInput)="onSearch($event)"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (loading()) {
        <div class="loading">
          <ion-spinner></ion-spinner>
        </div>
      } @else {
        @if (favoriteBrands().length > 0) {
          <div class="section-header">Favoriete merken</div>
          <ion-list>
            @for (brand of favoriteBrands(); track brand.name) {
              <ion-item (click)="searchBrand(brand.name)" [detail]="true">
                <ion-button
                  slot="start"
                  fill="clear"
                  class="fav-btn fav-btn--on"
                  (click)="toggleFavorite(brand.name, $event)"
                  [attr.aria-label]="'Verwijder ' + brand.name + ' uit favorieten'"
                >
                  <ion-icon name="heart" slot="icon-only"></ion-icon>
                </ion-button>
                <ion-label>
                  <h2>{{ brand.name }}</h2>
                  <p>{{ brand.retailerCount }} winkels</p>
                </ion-label>
              </ion-item>
            }
          </ion-list>
        }

        <div class="section-header">
          Alle merken
          <ion-badge>{{ filteredBrands().length }}</ion-badge>
        </div>
        <ion-list>
          @for (brand of filteredBrands(); track brand.name) {
            <ion-item (click)="searchBrand(brand.name)" [detail]="true">
              <ion-button
                slot="start"
                fill="clear"
                class="fav-btn"
                [class.fav-btn--on]="isFavorite(brand.name)"
                (click)="toggleFavorite(brand.name, $event)"
                [attr.aria-label]="(isFavorite(brand.name) ? 'Verwijder ' : 'Voeg ') + brand.name + (isFavorite(brand.name) ? ' uit favorieten' : ' toe aan favorieten')"
              >
                <ion-icon
                  [name]="isFavorite(brand.name) ? 'heart' : 'heart-outline'"
                  slot="icon-only"
                ></ion-icon>
              </ion-button>
              <ion-label>
                <h2>{{ brand.name }}</h2>
                <p>{{ brand.retailerCount }} winkels</p>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 16px 6px;
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      font-weight: 400;
      font-size: 1rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--retro-ink);
      border-bottom: 1.5px solid var(--retro-ink-hairline);
      margin-bottom: 2px;
    }

    ion-item h2 {
      font-family: 'Newsreader', Georgia, serif;
      font-weight: 600;
      font-size: 1.05rem;
    }

    .fav-btn {
      --padding-start: 8px;
      --padding-end: 8px;
      margin: 0 4px 0 0;
      --color: var(--retro-ink-soft);
      --background-hover: transparent;
      --background-activated: transparent;
      --background-focused: transparent;
      min-width: 44px;
      min-height: 44px;
    }
    .fav-btn ion-icon { font-size: 1.4rem; }
    .fav-btn--on { --color: var(--retro-red); }
  `]
})
export class BrandsPage implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private posthog = inject(PosthogService);
  private toastCtrl = inject(ToastController);
  userData = inject(UserDataService);
  auth = inject(AuthService);

  allBrands = signal<Brand[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  filteredBrands = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const brands = this.allBrands();
    if (!term) return brands;
    return brands.filter(b => b.name.toLowerCase().includes(term));
  });

  favoriteBrands = computed(() => {
    const favs = this.userData.favoriteBrands();
    return this.allBrands().filter(b => favs.has(b.name));
  });

  constructor() {
    addIcons({ heartOutline, heart, searchOutline });
  }

  ngOnInit() {
    this.http.get<{ brands: Brand[] }>(`${environment.apiUrl}/brands`).subscribe({
      next: data => {
        this.allBrands.set(data.brands);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(event: CustomEvent) {
    this.searchTerm.set(event.detail.value || '');
  }

  searchBrand(brandName: string) {
    this.posthog.posthog.capture('brand_searched', { brand_name: brandName });
    this.router.navigate(['/search'], { queryParams: { q: brandName } });
  }

  isFavorite(brandName: string): boolean {
    return this.userData.isFavoriteBrand(brandName);
  }

  toggleFavorite(brandName: string, event: Event) {
    event.stopPropagation();
    const wasFavorite = this.isFavorite(brandName);
    this.userData.toggleFavoriteBrand(brandName);
    this.posthog.posthog.capture('brand_favorited', {
      brand_name: brandName,
      action: wasFavorite ? 'removed' : 'added',
    });
  }
}
