import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { PosthogService } from './posthog.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private posthog = inject(PosthogService);

  currentUser = signal<User | null>(null);
  isLoggedIn = computed(() => this.currentUser() !== null);
  displayName = computed(() => this.currentUser()?.displayName ?? 'Gast');
  photoURL = computed(() => this.currentUser()?.photoURL ?? null);

  constructor() {
    onAuthStateChanged(this.auth, user => {
      this.currentUser.set(user);
      if (user) {
        this.posthog.posthog.identify(user.uid, {
          email: user.email,
          name: user.displayName,
        });
      } else {
        this.posthog.posthog.reset();
      }
    });
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    this.posthog.posthog.capture('user_signed_in', {
      provider: 'google',
    });
    return result;
  }

  async logout() {
    this.posthog.posthog.capture('user_signed_out');
    return signOut(this.auth);
  }
}
