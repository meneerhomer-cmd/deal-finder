import { Injectable, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, setDoc, deleteDoc, serverTimestamp } from '@angular/fire/firestore';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private messaging = inject(Messaging);

  permission = signal<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  token = signal<string | null>(null);

  async enable(): Promise<string | null> {
    if (typeof Notification === 'undefined') return null;

    const result = await Notification.requestPermission();
    this.permission.set(result);
    if (result !== 'granted') return null;

    try {
      const fcmToken = await getToken(this.messaging, {
        vapidKey: environment.firebase.vapidKey,
      });
      if (!fcmToken) return null;
      this.token.set(fcmToken);
      await this.persistToken(fcmToken);
      this.listenForeground();
      return fcmToken;
    } catch (err) {
      console.error('Push registration failed', err);
      return null;
    }
  }

  async disable(): Promise<void> {
    const fcmToken = this.token();
    const uid = this.auth.currentUser?.uid;
    if (fcmToken && uid) {
      await deleteDoc(doc(this.firestore, `users/${uid}/fcmTokens/${fcmToken}`));
    }
    this.token.set(null);
  }

  private async persistToken(fcmToken: string): Promise<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;
    await setDoc(
      doc(this.firestore, `users/${uid}/fcmTokens/${fcmToken}`),
      {
        createdAt: serverTimestamp(),
        userAgent: navigator.userAgent,
        platform: 'web',
      }
    );
  }

  private listenForeground(): void {
    onMessage(this.messaging, (payload) => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const title = payload.notification?.title ?? 'Deal Finder';
      new Notification(title, {
        body: payload.notification?.body ?? '',
        icon: '/assets/icon-192x192.png',
        tag: payload.data?.['dealId'] ?? 'deal-finder-default',
      });
    });
  }
}
