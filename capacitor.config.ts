import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tapicuz.admin',
  appName: 'Tapicuz da Sul',
  webDir: 'out',

  // Endereço correto que vai direto para a área de admin
  server: {
    url: 'https://tapicuz-admin-gujb.vercel.app/admin',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: ['*'],
    hostname: 'tapicuz-admin-gujb.vercel.app'
  },


  plugins: {
    LocalNotifications: {
      smallIcon: "mipmap/ic_launcher",
      iconColor: "#F97316"
    }
  }
};

export default config;