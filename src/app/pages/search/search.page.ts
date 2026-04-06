import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonList, IonItem, IonLabel, IonNote,
  IonBadge, IonSpinner, IonIcon, IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, trophyOutline } from 'ionicons/icons';
import { environment } from '@env/environment';

interface SearchResult {
  id: string;
  productName: string;
  brandName: string | null;
  retailerSlug: string;
  retailerName: string;
  currentPrice: number | null;
  originalPrice: number | null;
  discountPercentage: number;
}

interface SearchResponse {
  query: string;
  count: number;
  results: SearchResult[];
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonSearchbar, IonList, IonItem, IonLabel, IonNote,
    IonBadge, IonSpinner, IonIcon, IonChip
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Prijsvergelijker</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          placeholder="Zoek een product (bv. Coca-Cola, Pampers, Nutella...)"
          [debounce]="500"
          (ionInput)="onSearch($event)"
          enterkeyhint="search"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (!hasSearched()) {
        <div class="empty-state">
          <ion-icon name="search-outline" class="hero-icon"></ion-icon>
          <h2>Vergelijk prijzen</h2>
          <p>Zoek een product en ontdek waar het het goedkoopst is bij alle Belgische winkels.</p>
        </div>
      } @else if (loading()) {
        <div class="loading">
          <ion-spinner></ion-spinner>
          <p>Prijzen vergelijken...</p>
        </div>
      } @else if (results().length === 0) {
        <div class="empty-state">
          <h2>Geen resultaten</h2>
          <p>Probeer een andere zoekterm</p>
        </div>
      } @else {
        <div class="results-header">
          <span>{{ results().length }} resultaten voor "{{ lastQuery() }}"</span>
        </div>

        @if (cheapest()) {
          <div class="cheapest-banner">
            <ion-icon name="trophy-outline"></ion-icon>
            <div>
              <strong>Goedkoopste: {{ cheapest()!.retailerName }}</strong>
              <span>€{{ cheapest()!.currentPrice | number:'1.2-2' }}</span>
            </div>
          </div>
        }

        <ion-list>
          @for (result of results(); track result.id; let i = $index) {
            <ion-item [class.cheapest-item]="i === 0 && result.currentPrice">
              <div class="result-rank" slot="start">
                @if (i === 0 && result.currentPrice) {
                  <ion-icon name="trophy-outline" color="warning"></ion-icon>
                } @else {
                  <span class="rank-number">{{ i + 1 }}</span>
                }
              </div>
              <ion-label>
                <h2>{{ result.productName }}</h2>
                <p>
                  <span class="retailer-badge" [class]="result.retailerSlug">{{ result.retailerName }}</span>
                  @if (result.brandName) {
                    <span class="brand">{{ result.brandName }}</span>
                  }
                </p>
              </ion-label>
              <div class="price-column" slot="end">
                @if (result.currentPrice) {
                  <span class="result-price" [class.best-price]="i === 0">€{{ result.currentPrice | number:'1.2-2' }}</span>
                }
                @if (result.discountPercentage > 0) {
                  <span class="result-discount">-{{ result.discountPercentage }}%</span>
                }
                @if (result.originalPrice) {
                  <span class="result-original">€{{ result.originalPrice | number:'1.2-2' }}</span>
                }
              </div>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      text-align: center;
      color: var(--ion-color-medium);
    }

    .hero-icon {
      font-size: 4rem;
      margin-bottom: 16px;
      color: var(--ion-color-primary);
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: var(--ion-color-medium);
    }

    .results-header {
      padding: 12px 16px;
      font-size: 0.85rem;
      color: var(--ion-color-medium);
      border-bottom: 1px solid var(--ion-color-light);
    }

    .cheapest-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--chip-multi-buy-bg);
      color: var(--chip-multi-buy-text);
      font-size: 0.95rem;

      ion-icon { font-size: 1.5rem; }
      div { display: flex; flex-direction: column; }
      span { font-size: 1.2rem; font-weight: 700; }
    }

    .result-rank {
      width: 32px;
      text-align: center;
      margin-right: 8px;
    }

    .rank-number {
      font-size: 0.85rem;
      color: var(--ion-color-medium);
      font-weight: 600;
    }

    .cheapest-item {
      --background: var(--chip-multi-buy-bg);
    }

    .brand {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      margin-left: 8px;
    }

    .price-column {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .result-price {
      font-weight: 700;
      font-size: 1.1rem;
    }

    .best-price {
      color: var(--ion-color-success);
    }

    .result-discount {
      font-size: 0.8rem;
      color: var(--ion-color-danger);
      font-weight: 600;
    }

    .result-original {
      font-size: 0.75rem;
      text-decoration: line-through;
      color: var(--ion-color-medium);
    }
  `]
})
export class SearchPage {
  private http = inject(HttpClient);

  results = signal<SearchResult[]>([]);
  loading = signal(false);
  hasSearched = signal(false);
  lastQuery = signal('');

  constructor() {
    addIcons({ searchOutline, trophyOutline });
  }

  cheapest(): SearchResult | null {
    const r = this.results();
    if (r.length === 0) return null;
    const withPrice = r.filter(x => x.currentPrice != null);
    return withPrice.length > 0 ? withPrice[0] : null;
  }

  onSearch(event: CustomEvent) {
    const query = event.detail.value?.trim();
    if (!query || query.length < 2) {
      this.results.set([]);
      this.hasSearched.set(false);
      return;
    }

    this.loading.set(true);
    this.hasSearched.set(true);
    this.lastQuery.set(query);

    this.http.get<SearchResponse>(`${environment.apiUrl}/search`, {
      params: { q: query, limit: '50' }
    }).subscribe({
      next: response => {
        this.results.set(response.results);
        this.loading.set(false);
      },
      error: () => {
        this.results.set([]);
        this.loading.set(false);
      }
    });
  }
}
