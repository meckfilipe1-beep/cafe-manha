import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tapicuz.admin',
  appName: 'Tapicuz da Sul',
  webDir: 'out', // Deixa definido, mas não vai usar arquivos daqui
  server: {
    url: 'https://tapicuz-admin-gujb.vercel.app/admin', // ✅ Aponta direto para o seu site
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: ['*'] // ✅ Libera carregar tudo
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#FFFFFF' // ✅ Cor de fundo enquanto carrega
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_notification",
      iconColor: "#F97316"
    }
  }
};

export default config;