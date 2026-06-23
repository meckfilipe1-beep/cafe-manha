import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tapicuz.admin',
  appName: 'Tapicuz da Sul',
  webDir: 'out', // Pasta vazia só para não dar erro

  server: {
     url: 'https://tapicuz-admin-gujb.vercel.app',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: ['*'],
    hostname: 'tapicuz-admin-gujb.vercel.app'
  },

  android: {
    allowMixedContent: true,
    backgroundColor: '#FFFFFF',
    usesCleartextTraffic: true,
    defaultToWebView: true,
    minSdkVersion: 24
  },

  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_notification",
      iconColor: "#F97316"
    }
  }
};

export default config;