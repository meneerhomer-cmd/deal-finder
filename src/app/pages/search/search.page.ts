import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonSpinner, IonIcon, IonChip, IonButton, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, trophyOutline, timeOutline, informationCircleOutline } from 'ionicons/icons';
import { environment } from '@env/environment';
import { PosthogService } from '../../services/posthog.service';

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
  kind?: 'primary' | 'synonym' | 'intersection';
  synonymsUsed?: string[];
  results: SearchResult[];
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    DecimalPipe, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonSearchbar, IonSpinner, IonIcon, IonChip, IonButton, IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Zoek</ion-title>
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
        @if (recentSearches().length > 0) {
          <div class="recent-section">
            <div class="recent-header">
              <span>Recente zoekopdrachten</span>
              <ion-button fill="clear" size="small" (click)="clearRecent()">Wis</ion-button>
            </div>
            <div class="recent-chips">
              @for (term of recentSearches(); track term) {
                <ion-chip (click)="doSearch(term)">
                  <ion-icon name="time-outline"></ion-icon>
                  <ion-label>{{ term }}</ion-label>
                </ion-chip>
              }
            </div>
          </div>
          <div class="popular-section">
            <div class="recent-header"><span>Populair</span></div>
            <div class="recent-chips">
              @for (term of popularSearches; track term) {
                <ion-chip color="primary" (click)="doSearch(term)">
                  <ion-label>{{ term }}</ion-label>
                </ion-chip>
              }
            </div>
          </div>
        }
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
        @if (searchKind() === 'synonym') {
          <div class="synonym-banner">
            <ion-icon name="information-circle-outline"></ion-icon>
            <span>Geen <strong>{{ lastQuery() }}</strong> gevonden — dit lijkt er op:</span>
          </div>
        }
        <div class="results-header">
          {{ results().length }} resultaten voor "<strong>{{ lastQuery() }}</strong>"
        </div>

        <div class="results-list">
          @for (result of results(); track result.id; let i = $index) {
            <a class="result-row" [class.is-cheapest]="i === 0 && result.currentPrice" [routerLink]="['/deal', result.id]">
              <div class="result-info">
                @if (i === 0 && result.currentPrice) {
                  <span class="cheapest-stamp">★ Goedkoopst</span>
                }
                <span class="result-name">{{ result.productName }}</span>
                <span class="retailer-badge" [class]="result.retailerSlug">{{ result.retailerName }}</span>
              </div>
              <div class="result-prices">
                @if (result.currentPrice) {
                  <span class="result-price">€{{ result.currentPrice | number:'1.2-2' }}</span>
                }
                <span class="result-sub">
                  @if (result.discountPercentage > 0) {
                    <span class="result-discount">-{{ result.discountPercentage }}%</span>
                  }
                  @if (result.originalPrice) {
                    <span class="result-original">€{{ result.originalPrice | number:'1.2-2' }}</span>
                  }
                </span>
              </div>
            </a>
          }
        </div>
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
      color: var(--retro-ink-soft, #8a8580);
    }
    .empty-state h2 {
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      text-transform: uppercase; letter-spacing: 0.02em;
      color: var(--retro-ink); margin: 0 0 8px;
    }

    .hero-icon {
      font-size: 4rem;
      margin-bottom: 16px;
      color: var(--retro-red);
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: var(--retro-ink-soft, #8a8580);
    }

    .results-header {
      padding: 12px 16px;
      font-family: 'Archivo Narrow', system-ui, sans-serif;
      font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.04em;
      color: var(--retro-ink); background: var(--retro-newsprint);
      border-bottom: 2px solid var(--retro-ink);
    }
    .results-header strong { font-weight: 700; }

    .results-list { padding: 10px 12px 28px; display: flex; flex-direction: column; gap: 8px; }

    .result-row {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px 14px;
      background: var(--retro-newsprint-bright);
      border: 2px solid var(--retro-ink);
      box-shadow: 3px 3px 0 0 var(--retro-ink);
      text-decoration: none; color: var(--retro-ink);
      transition: transform 0.08s ease, box-shadow 0.08s ease;
    }
    .result-row:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 0 var(--retro-ink); }
    .result-row.is-cheapest { background: var(--retro-yellow); }

    .result-info { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
    .result-info .retailer-badge { align-self: flex-start; }
    .cheapest-stamp {
      align-self: flex-start;
      font-family: 'Archivo Narrow', system-ui, sans-serif; font-weight: 700;
      font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em;
      background: var(--retro-red); color: #fff; padding: 2px 8px;
      border: 2px solid var(--retro-ink);
    }
    .result-name {
      font-family: 'Newsreader', Georgia, serif; font-weight: 600; font-size: 1.05rem;
      line-height: 1.15; color: var(--retro-ink);
    }

    .result-prices { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
    .result-price { font-family: 'Anton', 'Archivo Narrow', sans-serif; font-size: 1.45rem; line-height: 0.95; color: var(--retro-ink); }
    .result-sub { display: flex; align-items: baseline; gap: 7px; }
    .result-discount { font-family: 'Archivo Narrow', sans-serif; font-weight: 700; font-size: 0.8rem; color: var(--retro-red); }
    .result-original { font-size: 0.75rem; text-decoration: line-through; color: var(--retro-ink-soft, #8a8580); }

    .recent-section, .popular-section { padding: 0 16px 12px; }
    .recent-header {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 0.85rem; font-weight: 600; color: var(--ion-color-medium);
      text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
    }
    .recent-chips {
      display: flex; flex-wrap: wrap; gap: 10px;
    }
    .recent-chips ion-chip {
      --min-height: 44px; min-height: 44px;
      padding-inline: 14px;
      font-size: 0.95rem;
    }
    .synonym-banner {
      display: flex; align-items: center; gap: 10px;
      background: var(--retro-yellow, #ffe14d); color: var(--retro-ink, #1a1a1a);
      padding: 12px 16px; margin: 0 12px 8px; border: 2px solid var(--retro-ink, #1a1a1a);
      box-shadow: 3px 3px 0 var(--retro-ink, #1a1a1a);
      font-family: var(--font-mono, 'Space Mono'), monospace; font-size: 0.85rem;
    }
    .synonym-banner ion-icon { font-size: 1.3rem; flex-shrink: 0; }
    .synonym-banner strong { font-family: var(--font-display, Anton), sans-serif; text-transform: uppercase; }
  `]
})
export class SearchPage implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private posthog = inject(PosthogService);

  results = signal<SearchResult[]>([]);
  loading = signal(false);
  hasSearched = signal(false);
  lastQuery = signal('');
  searchKind = signal<'primary' | 'synonym' | 'intersection' | null>(null);

  recentSearches = signal<string[]>(JSON.parse(localStorage.getItem('recent-searches') || '[]'));
  popularSearches = ['Coca-Cola', 'Pampers', 'Nutella', 'Dash', 'Pringles', 'Fairy'];

  constructor() {
    addIcons({ searchOutline, trophyOutline, timeOutline, informationCircleOutline });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const q = params['q'];
      if (q) this.doSearch(q);
    });
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
    this.doSearch(query);
  }

  doSearch(query: string) {
    this.loading.set(true);
    this.hasSearched.set(true);
    this.lastQuery.set(query);
    this.saveRecentSearch(query);

    this.http.get<SearchResponse>(`${environment.apiUrl}/search`, {
      params: { q: query, limit: '50' }
    }).subscribe({
      next: response => {
        const sorted = [...response.results].sort((a, b) => {
          if (a.currentPrice == null && b.currentPrice == null) return 0;
          if (a.currentPrice == null) return 1;
          if (b.currentPrice == null) return -1;
          return a.currentPrice - b.currentPrice;
        });
        this.results.set(sorted);
        this.searchKind.set(response.kind ?? 'primary');
        this.loading.set(false);
        this.posthog.posthog.capture('search_performed', {
          query,
          result_count: response.count,
          has_results: response.count > 0,
          search_kind: response.kind ?? 'primary',
        });
      },
      error: () => {
        this.results.set([]);
        this.loading.set(false);
      }
    });
  }

  clearRecent() {
    this.recentSearches.set([]);
    localStorage.removeItem('recent-searches');
  }

  private saveRecentSearch(query: string) {
    const updated = [query, ...this.recentSearches().filter(q => q !== query)].slice(0, 8);
    this.recentSearches.set(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  }
}
