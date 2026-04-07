import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);

  currentUser = signal<User | null>(null);
  isLoggedIn = computed(() => this.currentUser() !== null);
  displayName = computed(() => this.currentUser()?.displayName ?? 'Gast');
  photoURL = computed(() => this.currentUser()?.photoURL ?? null);

  constructor() {
    onAuthStateChanged(this.auth, user => {
      this.currentUser.set(user);
    });
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  async logout() {
    return signOut(this.auth);
  }
}
