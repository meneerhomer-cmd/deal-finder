import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'be.dealfinder.app',
  appName: 'Deal Finder',
  webDir: 'www/browser',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#e30613',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#e30613',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    // Capgo OTA: pull the latest web bundle from Capgo Cloud in the background
    // on launch, so web deploys reach the app without an APK rebuild. The app
    // keeps its bundled assets as the offline/first-run fallback. The native
    // app MUST call CapacitorUpdater.notifyAppReady() once loaded or the plugin
    // rolls the bundle back (crash-safety).
    CapacitorUpdater: {
      autoUpdate: true,
    },
  },
};

export default config;
