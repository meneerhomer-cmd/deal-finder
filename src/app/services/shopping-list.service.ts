import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '@env/environment';

export interface ShoppingListItem {
  id: number;
  deal: {
    id: number;
    productName: string;
    retailerName: string;
    retailerSlug: string;
    currentPrice: number | null;
    discountPercentage: number;
    categorySlug: string | null;
  };
  addedAt: string;
  purchased: boolean;
  purchasedAt: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  items = signal<ShoppingListItem[]>([]);
  loading = signal(false);

  activeItems = computed(() => this.items().filter(i => !i.purchased));
  purchasedItems = computed(() => this.items().filter(i => i.purchased));
  activeCount = computed(() => this.activeItems().length);

  private get sessionId(): string {
    const key = 'deal-finder-session-id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  }

  private get headers() {
    return { 'X-Session-Id': this.sessionId };
  }

  loadItems(): Observable<ShoppingListItem[]> {
    this.loading.set(true);
    return this.http.get<ShoppingListItem[]>(`${this.apiUrl}/shopping-list`, {
      headers: this.headers
    }).pipe(
      tap(items => {
        this.items.set(items);
        this.loading.set(false);
      }),
      catchError(() => {
        this.loading.set(false);
        return of([]);
      })
    );
  }

  addDeal(dealId: number): Observable<ShoppingListItem> {
    return this.http.post<ShoppingListItem>(
      `${this.apiUrl}/shopping-list/${dealId}`, {},
      { headers: this.headers }
    ).pipe(
      tap(() => this.loadItems().subscribe())
    );
  }

  removeDeal(dealId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/shopping-list/${dealId}`,
      { headers: this.headers }
    ).pipe(
      tap(() => this.loadItems().subscribe())
    );
  }

  markPurchased(dealId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/shopping-list/${dealId}/purchased`, {},
      { headers: this.headers }
    ).pipe(
      tap(() => this.loadItems().subscribe())
    );
  }

  markNotPurchased(dealId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/shopping-list/${dealId}/purchased`,
      { headers: this.headers }
    ).pipe(
      tap(() => this.loadItems().subscribe())
    );
  }

  clearAll(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/shopping-list`, {
      headers: this.headers
    }).pipe(
      tap(() => this.loadItems().subscribe())
    );
  }

  isInList(dealId: number): boolean {
    return this.items().some(item => item.deal.id === dealId);
  }
}
