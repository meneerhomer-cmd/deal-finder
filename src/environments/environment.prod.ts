export const environment = {
  production: true,
  apiUrl: 'https://deal-finder-api-927801911058.europe-west1.run.app/api/v1',
  firebase: {
    projectId: 'promo-finder-be',
    appId: '1:927801911058:web:9c317fdaf36f5bbd48b5cb',
    storageBucket: 'promo-finder-be.firebasestorage.app',
    apiKey: 'AIzaSyBiL65L3Hoo_yd3D5QzbkxSySzSHJTw5os',
    authDomain: 'promo-finder-be.firebaseapp.com',
    messagingSenderId: '927801911058',
    vapidKey: 'BCZNnEr6lon5SVgEOktCLr6NxwAqGfDRGtRbRNbdYPBoB1C7jYZzJJnpxxviKPMstLpIccqT-r7fPVQgRPuTtHc',
  },
  sentry: {
    dsn: 'https://37d1d536c86a2f3f455edcddc3eca461@o4511406547075072.ingest.de.sentry.io/4511406615756880',
    environment: 'production',
    tracesSampleRate: 1.0,
  },
  posthog: {
    key: 'phc_AucZH9tLHeHziAa5VpMM8BypdzapKWjs7k3w7DA3DAoL',
    host: 'https://eu.i.posthog.com',
  },
};
