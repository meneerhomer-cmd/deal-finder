import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular/standalone';
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
  private toastCtrl = inject(ToastController);
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
      tap(item => {
        this.loadItems().subscribe();
        this.showToast('Toegevoegd aan je lijst', 'success');
      }),
      catchError(err => {
        this.showToast('Kon niet toevoegen', 'danger');
        return of(err);
      })
    );
  }

  removeDeal(dealId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/shopping-list/${dealId}`,
      { headers: this.headers }
    ).pipe(
      tap(() => {
        this.loadItems().subscribe();
        this.showToast('Verwijderd van je lijst', 'medium');
      })
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
      tap(() => {
        this.loadItems().subscribe();
        this.showToast('Lijst gewist', 'medium');
      })
    );
  }

  isInList(dealId: number): boolean {
    return this.items().some(item => item.deal.id === dealId);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1500,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
