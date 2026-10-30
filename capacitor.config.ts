import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scoutfit.app',
  appName: 'ScoutFit',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  server: {
    androidScheme: 'https',
    // cleartext: true, // yalnızca geliştirme
  },
  android: {
    // allowMixedContent: true, // yalnızca geliştirme
    captureInput: true,
    webContentsDebuggingEnabled: false, // yayında kapalı
  },
};

export default config;