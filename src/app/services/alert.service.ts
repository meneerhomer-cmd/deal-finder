import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';
import { UserDataService } from './user-data.service';

export interface PriceAlert {
  productName: string;
  previousPrice: number;
  currentPrice: number;
  retailer: string;
  discount: number;
  priceDrop: number;
  seen: boolean;
}

interface StoredPrices {
  [productName: string]: { price: number; retailer: string; checkedAt: string };
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private http = inject(HttpClient);
  private firestore = inject(Firestore);
  private auth = inject(AuthService);
  private userData = inject(UserDataService);

  alerts = signal<PriceAlert[]>([]);
  unseenCount = computed(() => this.alerts().filter(a => !a.seen).length);

  async checkForAlerts() {
    const products = this.userData.watchlist();
    if (products.length === 0) return;

    const storedPrices = await this.loadStoredPrices();
    const newAlerts: PriceAlert[] = [];
    const updatedPrices: StoredPrices = { ...storedPrices };

    let completed = 0;
    const total = products.length;

    for (const name of products) {
      try {
        const data = await this.http.get<any>(
          `${environment.apiUrl}/search`, { params: { q: name, limit: '3' } }
        ).toPromise();

        const best = data?.results?.[0];
        if (!best?.currentPrice) {
          completed++;
          continue;
        }

        const stored = storedPrices[name];
        if (stored && best.currentPrice < stored.price) {
          newAlerts.push({
            productName: name,
            previousPrice: stored.price,
            currentPrice: best.currentPrice,
            retailer: best.retailerName || 'Onbekend',
            discount: best.discountPercentage || 0,
            priceDrop: Math.round((1 - best.currentPrice / stored.price) * 100),
            seen: false
          });
        }

        updatedPrices[name] = {
          price: best.currentPrice,
          retailer: best.retailerName || '',
          checkedAt: new Date().toISOString()
        };

        completed++;
        if (completed === total) {
          this.alerts.set(newAlerts);
          await this.saveStoredPrices(updatedPrices);
        }
      } catch {
        completed++;
        if (completed === total) {
          this.alerts.set(newAlerts);
          await this.saveStoredPrices(updatedPrices);
        }
      }
    }
  }

  markAllSeen() {
    this.alerts.update(alerts => alerts.map(a => ({ ...a, seen: true })));
  }

  private async loadStoredPrices(): Promise<StoredPrices> {
    const user = this.auth.currentUser();
    if (user) {
      const ref = doc(this.firestore, `users/${user.uid}/preferences/priceHistory`);
      const snap = await getDoc(ref);
      if (snap.exists()) return snap.data() as StoredPrices;
    }

    const local = localStorage.getItem('price-history');
    return local ? JSON.parse(local) : {};
  }

  private async saveStoredPrices(prices: StoredPrices) {
    localStorage.setItem('price-history', JSON.stringify(prices));

    const user = this.auth.currentUser();
    if (user) {
      const ref = doc(this.firestore, `users/${user.uid}/preferences/priceHistory`);
      await setDoc(ref, prices);
    }
  }
}
