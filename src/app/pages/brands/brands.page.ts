import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonList, IonItem, IonLabel, IonBadge,
  IonSpinner, IonIcon, IonChip, IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { heartOutline, heart, searchOutline } from 'ionicons/icons';
import { environment } from '@env/environment';
import { UserDataService } from '../../services/user-data.service';
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
    IonSpinner, IonIcon, IonChip, IonButtons, IonBackButton
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
                <ion-icon name="heart" slot="start" color="danger" (click)="toggleFavorite(brand.name, $event)"></ion-icon>
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
              <ion-icon
                [name]="isFavorite(brand.name) ? 'heart' : 'heart-outline'"
                slot="start"
                [color]="isFavorite(brand.name) ? 'danger' : 'medium'"
                (click)="toggleFavorite(brand.name, $event)"
              ></ion-icon>
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
      gap: 8px;
      padding: 12px 16px 4px;
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      color: var(--ion-color-medium);
      letter-spacing: 0.5px;
    }

    ion-item {
      cursor: pointer;
    }

    ion-item h2 {
      font-weight: 600;
    }

    ion-icon[slot="start"] {
      cursor: pointer;
      font-size: 1.3rem;
    }
  `]
})
export class BrandsPage implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private posthog = inject(PosthogService);
  userData = inject(UserDataService);

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
