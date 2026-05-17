import { APP_INITIALIZER, enableProdMode, ErrorHandler, LOCALE_ID, isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Router, RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { registerLocaleData } from '@angular/common';
import localeNl from '@angular/common/locales/nl-BE';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import * as Sentry from '@sentry/capacitor';
import * as SentryAngular from '@sentry/angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

registerLocaleData(localeNl);

if (environment.production) {
  enableProdMode();
}

if (environment.sentry.dsn) {
  Sentry.init({
    dsn: environment.sentry.dsn,
    environment: environment.sentry.environment,
    integrations: [SentryAngular.browserTracingIntegration()],
    tracesSampleRate: environment.sentry.tracesSampleRate,
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/deal-finder-api-927801911058\.europe-west1\.run\.app/,
    ],
  }, SentryAngular.init);
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: LOCALE_ID, useValue: 'nl-BE' },
    {
      provide: ErrorHandler,
      useValue: SentryAngular.createErrorHandler({ showDialog: false }),
    },
    { provide: SentryAngular.TraceService, deps: [Router] },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [SentryAngular.TraceService],
      multi: true,
    },
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
}).catch(err => console.error(err));
