import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import { Deal, Retailer, ScanStatus, Opportunity, FOOD_SLUGS } from '../models/deal.model';

export interface DealFilters {
  retailer?: string;
  category?: string;
  brand?: string;
  minDiscount?: number;
  search?: string;
  foodOnly?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DealService {
  private apiUrl = environment.apiUrl;
  private static DEALS_CACHE_KEY = 'deals-cache-v1';
  private static OPP_CACHE_KEY = 'opportunity-cache-v1';
  
  // Signals for reactive state
  deals = signal<Deal[]>([]);
  retailers = signal<Retailer[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  filters = signal<DealFilters>({});
  
  // Computed filtered deals
  filteredDeals = computed(() => {
    const allDeals = this.deals();
    const f = this.filters();
    
    return allDeals.filter(deal => {
      if (f.retailer && deal.retailerSlug !== f.retailer) return false;
      if (f.category && deal.categorySlug?.toLowerCase() !== f.category.toLowerCase()) return false;
      if (f.brand && deal.brand?.toLowerCase() !== f.brand.toLowerCase()) return false;
      if (f.minDiscount && deal.discountPercentage < f.minDiscount) return false;
      if (f.search) {
        const searchLower = f.search.toLowerCase();
        if (!deal.productName.toLowerCase().includes(searchLower)) return false;
      }
      if (f.foodOnly && (!deal.categorySlug || !FOOD_SLUGS.has(deal.categorySlug))) return false;
      return true;
    });
  });

  availableBrands = computed(() => {
    const counts = new Map<string, number>();
    for (const d of this.deals()) {
      if (d.brand) counts.set(d.brand, (counts.get(d.brand) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  });

  // Stats
  totalDeals = computed(() => this.deals().length);
  activeFiltersCount = computed(() => {
    const f = this.filters();
    let count = 0;
    if (f.retailer) count++;
    if (f.category) count++;
    if (f.brand) count++;
    if (f.minDiscount) count++;
    if (f.search) count++;
    return count;
  });

  constructor(private http: HttpClient) {}

  loadDeals(): Observable<Deal[]> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.http.get<Deal[]>(`${this.apiUrl}/deals?lang=nl`).pipe(
      tap(deals => {
        this.deals.set(deals);
        this.cacheDeals(deals);
        this.loading.set(false);
      }),
      catchError(err => {
        this.error.set('Kon deals niet laden');
        this.loading.set(false);
        console.error('Error loading deals:', err);
        return of([]);
      })
    );
  }

  /**
   * Paint last-known deals from localStorage instantly on launch so the home
   * screen never opens to a spinner/blank while Cloud Run cold-starts — the
   * single most "website" moment. The live fetch overwrites this when it lands.
   */
  hydrateFromCache(): void {
    if (this.deals().length > 0) return;
    try {
      const raw = localStorage.getItem(DealService.DEALS_CACHE_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw) as Deal[];
      if (Array.isArray(cached) && cached.length > 0) this.deals.set(cached);
    } catch { /* corrupt cache — ignore, the fetch will repopulate */ }
  }

  readCachedOpportunity(): Opportunity | null {
    try {
      const raw = localStorage.getItem(DealService.OPP_CACHE_KEY);
      return raw ? (JSON.parse(raw) as Opportunity) : null;
    } catch { return null; }
  }

  private cacheDeals(deals: Deal[]): void {
    try {
      localStorage.setItem(DealService.DEALS_CACHE_KEY, JSON.stringify(deals.slice(0, 120)));
    } catch { /* quota / private mode — caching is best-effort */ }
  }

  private cacheOpportunity(opp: Opportunity | null): void {
    try {
      if (opp) localStorage.setItem(DealService.OPP_CACHE_KEY, JSON.stringify(opp));
      else localStorage.removeItem(DealService.OPP_CACHE_KEY);
    } catch { /* best-effort */ }
  }

  loadRetailers(): Observable<Retailer[]> {
    return this.http.get<Retailer[]>(`${this.apiUrl}/retailers`).pipe(
      tap(retailers => this.retailers.set(retailers)),
      catchError(err => {
        console.error('Error loading retailers:', err);
        return of([]);
      })
    );
  }

  loadDealsByRetailer(slug: string): Observable<Deal[]> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.get<Deal[]>(`${this.apiUrl}/deals/retailer/${slug}?lang=nl`).pipe(
      tap(deals => {
        this.deals.set(deals);
        this.loading.set(false);
      }),
      catchError(err => {
        this.error.set('Kon deals niet laden');
        this.loading.set(false);
        return of([]);
      })
    );
  }

  loadFlyers(shopSlug: string): Observable<{ flyers: Array<{ id: string; name: string; coverImage: string }> }> {
    return this.http.get<any>(`${this.apiUrl}/flyers/${shopSlug}`);
  }

  /** One cheaper same-style alternative from another brand, or null when none qualifies (backend 204). */
  getSubstitute(dealId: number): Observable<Deal | null> {
    return this.http.get<Deal>(`${this.apiUrl}/deals/${dealId}/substitute?lang=nl`).pipe(
      catchError(err => {
        console.error('Error loading substitute:', err);
        return of(null);
      })
    );
  }

  /** Today's single biggest savings opportunity (home banner), or null when none qualifies (backend 204). */
  getOpportunity(): Observable<Opportunity | null> {
    return this.http.get<Opportunity>(`${this.apiUrl}/products/opportunity?lang=nl`).pipe(
      tap(opp => this.cacheOpportunity(opp)),
      catchError(err => {
        console.error('Error loading opportunity:', err);
        return of(null);
      })
    );
  }

  /** Report that a cross-retailer / substitute suggestion is a wrong match. */
  reportWrongMatch(sourceDealId: number, targetDealId: number): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/deals/${sourceDealId}/wrong-match?targetId=${targetDealId}`, {}
    ).pipe(catchError(err => {
      console.error('Error reporting wrong match:', err);
      return of(null);
    }));
  }

  getStatus(): Observable<ScanStatus> {
    return this.http.get<ScanStatus>(`${this.apiUrl}/admin/status`);
  }

  triggerScan(retailerSlug?: string): Observable<{ message: string }> {
    const url = retailerSlug 
      ? `${this.apiUrl}/admin/scan/${retailerSlug}`
      : `${this.apiUrl}/admin/scan`;
    return this.http.post<{ message: string }>(url, {});
  }

  setFilter(key: keyof DealFilters, value: string | number | boolean | undefined) {
    this.filters.update(f => ({
      ...f,
      [key]: value ?? undefined
    }));
  }

  clearFilters() {
    this.filters.set({});
  }

  clearFilter(key: keyof DealFilters) {
    this.filters.update(f => {
      const newFilters = { ...f };
      delete newFilters[key];
      return newFilters;
    });
  }
}
