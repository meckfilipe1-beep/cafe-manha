import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tapicuz.admin',
  appName: 'Tapicuz da Sul',
  webDir: 'out',
  server: {
    url: 'https://tapicuz-admin-gujb.vercel.app/admin',
    cleartext: false,
    androidScheme: 'https',
    // ✅ Removido o 'https://wa.me/*' para permitir que o sistema abra o app nativo
    allowNavigation: ['tapicuz-admin-gujb.vercel.app'], 
    hostname: 'tapicuz-admin-gujb.vercel.app'
  },
  plugins: {
    AppLauncher: {},
    Browser: {},
    LocalNotifications: {
      smallIcon: "mipmap/ic_launcher",
      iconColor: "#F97316"
    
  }

  }
};

export default config;