import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tapicuz.admin',
  appName: 'Tapicuz Admin',
  webDir: 'out',
  server: {
    url: 'https://tapicuz-admin-gujb.vercel.app/admin',
    cleartext: false,
    androidScheme: 'https'
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
