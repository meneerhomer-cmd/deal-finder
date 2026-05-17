// Firebase Cloud Messaging service worker.
// Served at /firebase-messaging-sw.js — registered by Firebase Messaging at that exact path.
// Compat builds used because service workers can't import ES modules cleanly.

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBiL65L3Hoo_yd3D5QzbkxSySzSHJTw5os',
  authDomain: 'promo-finder-be.firebaseapp.com',
  projectId: 'promo-finder-be',
  storageBucket: 'promo-finder-be.firebasestorage.app',
  messagingSenderId: '927801911058',
  appId: '1:927801911058:web:9c317fdaf36f5bbd48b5cb',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Deal Finder';
  const options = {
    body: payload.notification?.body || '',
    icon: '/assets/icon-192x192.png',
    badge: '/assets/icon-192x192.png',
    data: payload.data || {},
    tag: payload.data?.dealId || 'deal-finder-default',
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const dealId = event.notification.data?.dealId;
  const target = dealId ? `/deal/${dealId}` : '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
