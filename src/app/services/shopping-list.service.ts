import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular/standalone';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import { UserDataService } from './user-data.service';
import { AuthService } from './auth.service';

export interface ShoppingListItem {
  id: number;
  deal: {
    id: number;
    productName: string;
    retailerName: string;
    retailerSlug: string;
    currentPrice: number | null;
    originalPrice: number | null;
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
  private userData = inject(UserDataService);
  private auth = inject(AuthService);
  private apiUrl = environment.apiUrl;

  items = signal<ShoppingListItem[]>([]);
  loading = signal(false);

  activeItems = computed(() => this.items().filter(i => !i.purchased));
  purchasedItems = computed(() => this.items().filter(i => i.purchased));
  activeCount = computed(() => this.activeItems().length);

  constructor() {
    // The session id flips from a random localStorage UUID to `firebase-<uid>`
    // once anonymous auth resolves (async). On a cold load loadItems() can run
    // against the wrong session and come back empty — so reload whenever the
    // authenticated user becomes available / changes.
    effect(() => {
      if (this.auth.currentUser()) this.loadItems().subscribe();
    }, { allowSignalWrites: true });
  }

  private get headers() {
    return { 'X-Session-Id': this.userData.getSessionId() };
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
      tap(() => {
        // No success toast here — deal-detail (the only caller) shows its own
        // toast + haptic, so toasting here too produced a double popup.
        this.loadItems().subscribe();
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
    // Only an ACTIVE (non-purchased) item counts as "on the list" — otherwise a
    // checked-off item leaves the deal stuck on "Op je lijst" and unable to be
    // re-added.
    return this.items().some(item => item.deal.id === dealId && !item.purchased);
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
