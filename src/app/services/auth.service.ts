import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  signInAnonymously,
  linkWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import { PosthogService } from './posthog.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private posthog = inject(PosthogService);

  currentUser = signal<User | null>(null);
  // Anonymous users count as "logged in" so existing gates degrade gracefully.
  // For features that genuinely need a real account (push notifications, sync),
  // gate on `isLinkedAccount()` instead.
  isLoggedIn = computed(() => this.currentUser() !== null);
  isAnonymous = computed(() => this.currentUser()?.isAnonymous ?? false);
  isLinkedAccount = computed(() => !!this.currentUser() && !this.isAnonymous());
  displayName = computed(() => this.currentUser()?.displayName ?? 'Gast');
  photoURL = computed(() => this.currentUser()?.photoURL ?? null);

  constructor() {
    onAuthStateChanged(this.auth, user => {
      this.currentUser.set(user);
      if (user && !user.isAnonymous) {
        // Only identify real (non-anonymous) users so PostHog funnels don't
        // get polluted by one synthetic person per anonymous visitor.
        this.posthog.posthog.identify(user.uid, {
          email: user.email,
          name: user.displayName,
        });
      } else if (!user) {
        // Cold start with no cached user — sign in anonymously so watchlist,
        // brand favorites, and Firestore writes work out of the box. Sign-in
        // becomes a "sync across devices" upgrade, not a gate.
        this.posthog.posthog.reset();
        signInAnonymously(this.auth).catch(e => {
          // If anon fails, the app falls back to session-id-only behavior
          // (shopping list still works via x-session-id header).
          console.warn('Anonymous Firebase sign-in failed:', e);
        });
      }
    });
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const current = this.currentUser();
    if (current?.isAnonymous) {
      // Upgrade the anonymous account in place — same UID, all existing
      // watchlist + brand-favorites data carries over.
      try {
        const result = await linkWithPopup(current, provider);
        this.posthog.posthog.capture('user_signed_in', {
          provider: 'google',
          upgraded_from_anonymous: true,
        });
        return result;
      } catch (e: any) {
        if (e?.code !== 'auth/credential-already-in-use') throw e;
        // The Google account already has a Firebase user elsewhere. Fall back
        // to plain sign-in — the anonymous UID's data is orphaned (we can ship
        // a merge flow if this becomes a real pain point).
      }
    }
    const result = await signInWithPopup(this.auth, provider);
    this.posthog.posthog.capture('user_signed_in', { provider: 'google' });
    return result;
  }

  async logout() {
    this.posthog.posthog.capture('user_signed_out');
    return signOut(this.auth);
    // onAuthStateChanged will fire with null → anon re-sign-in fires
    // automatically. Logout therefore becomes "switch to a fresh anonymous
    // account" rather than a fully signed-out state.
  }
}
