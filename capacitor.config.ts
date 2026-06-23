import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tapicuz.admin',
  appName: 'Tapicuz da Sul',
  webDir: 'out',
  server: {
    url: 'https://tapicuz-admin-gujb.vercel.app/admin',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: ['*']
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_notification", // O sistema vai usar a versão branca
      iconColor: "#F97316" // Cor laranja para ficar igual sua marca
    }
  }
};

export default config;