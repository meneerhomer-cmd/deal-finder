import { Injectable, inject, signal, effect } from '@angular/core';
import {
  Firestore, doc, setDoc, getDoc, deleteDoc,
  collection, getDocs, writeBatch
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  watchlist = signal<string[]>([]);
  favoriteBrands = signal<Set<string>>(new Set());

  private initialized = false;

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user && !this.initialized) {
        this.initialized = true;
        this.migrateAndLoad(user.uid);
      } else if (!user) {
        this.initialized = false;
        this.loadFromLocalStorage();
      }
    });
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    const watchData = localStorage.getItem('product-watchlist');
    this.watchlist.set(watchData ? JSON.parse(watchData) : []);

    const brandData = localStorage.getItem('favorite-brands');
    this.favoriteBrands.set(brandData ? new Set(JSON.parse(brandData)) : new Set());
  }

  private async migrateAndLoad(uid: string) {
    const watchRef = doc(this.firestore, `users/${uid}/preferences/watchlist`);
    const brandsRef = doc(this.firestore, `users/${uid}/preferences/brands`);

    const [watchSnap, brandsSnap] = await Promise.all([
      getDoc(watchRef),
      getDoc(brandsRef)
    ]);

    if (watchSnap.exists()) {
      this.watchlist.set(watchSnap.data()['items'] || []);
    } else {
      const local = localStorage.getItem('product-watchlist');
      const items = local ? JSON.parse(local) : [];
      if (items.length > 0) {
        await setDoc(watchRef, { items });
      }
      this.watchlist.set(items);
    }

    if (brandsSnap.exists()) {
      this.favoriteBrands.set(new Set(brandsSnap.data()['items'] || []));
    } else {
      const local = localStorage.getItem('favorite-brands');
      const items = local ? JSON.parse(local) : [];
      if (items.length > 0) {
        await setDoc(brandsRef, { items });
      }
      this.favoriteBrands.set(new Set(items));
    }
  }

  async addToWatchlist(productName: string) {
    const current = this.watchlist();
    if (current.includes(productName)) return;

    const updated = [...current, productName];
    this.watchlist.set(updated);
    await this.persistWatchlist(updated);
  }

  async removeFromWatchlist(productName: string) {
    const updated = this.watchlist().filter(n => n !== productName);
    this.watchlist.set(updated);
    await this.persistWatchlist(updated);
  }

  async toggleFavoriteBrand(brandName: string) {
    const favs = new Set(this.favoriteBrands());
    if (favs.has(brandName)) {
      favs.delete(brandName);
    } else {
      favs.add(brandName);
    }
    this.favoriteBrands.set(favs);
    await this.persistBrands(favs);
  }

  isFavoriteBrand(brandName: string): boolean {
    return this.favoriteBrands().has(brandName);
  }

  private async persistWatchlist(items: string[]) {
    localStorage.setItem('product-watchlist', JSON.stringify(items));

    const user = this.auth.currentUser();
    if (user) {
      const ref = doc(this.firestore, `users/${user.uid}/preferences/watchlist`);
      await setDoc(ref, { items });
    }
  }

  private async persistBrands(favs: Set<string>) {
    const items = [...favs];
    localStorage.setItem('favorite-brands', JSON.stringify(items));

    const user = this.auth.currentUser();
    if (user) {
      const ref = doc(this.firestore, `users/${user.uid}/preferences/brands`);
      await setDoc(ref, { items });
    }
  }

  getSessionId(): string {
    const user = this.auth.currentUser();
    if (user) return `firebase-${user.uid}`;

    const key = 'deal-finder-session-id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  }
}
