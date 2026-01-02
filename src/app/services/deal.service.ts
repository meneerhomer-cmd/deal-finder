import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import { Deal, Retailer, ScanStatus, PromoKind } from '../models/deal.model';

export interface DealFilters {
  retailer?: string;
  category?: string;
  promoKind?: PromoKind;
  minDiscount?: number;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DealService {
  private apiUrl = environment.apiUrl;
  
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
      if (f.category && deal.category?.toLowerCase() !== f.category.toLowerCase()) return false;
      if (f.promoKind && deal.promoKind !== f.promoKind) return false;
      if (f.minDiscount && deal.effectiveDiscount < f.minDiscount) return false;
      if (f.search) {
        const searchLower = f.search.toLowerCase();
        const matchesProduct = deal.productName.toLowerCase().includes(searchLower);
        const matchesBrand = deal.brand?.toLowerCase().includes(searchLower);
        if (!matchesProduct && !matchesBrand) return false;
      }
      return true;
    });
  });
  
  // Stats
  totalDeals = computed(() => this.deals().length);
  activeFiltersCount = computed(() => {
    const f = this.filters();
    let count = 0;
    if (f.retailer) count++;
    if (f.category) count++;
    if (f.promoKind) count++;
    if (f.minDiscount) count++;
    if (f.search) count++;
    return count;
  });

  constructor(private http: HttpClient) {}

  loadDeals(): Observable<Deal[]> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.http.get<Deal[]>(`${this.apiUrl}/deals`).pipe(
      tap(deals => {
        this.deals.set(deals);
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
    return this.http.get<Deal[]>(`${this.apiUrl}/deals/retailer/${slug}`).pipe(
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

  getStatus(): Observable<ScanStatus> {
    return this.http.get<ScanStatus>(`${this.apiUrl}/admin/status`);
  }

  triggerScan(retailerSlug?: string): Observable<{ message: string }> {
    const url = retailerSlug 
      ? `${this.apiUrl}/admin/scan/${retailerSlug}`
      : `${this.apiUrl}/admin/scan`;
    return this.http.post<{ message: string }>(url, {});
  }

  setFilter(key: keyof DealFilters, value: string | number | undefined) {
    this.filters.update(f => ({
      ...f,
      [key]: value || undefined
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
