import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tapicuz.admin',
  appName: 'Tapicuz da Sul',
  webDir: 'out', // Pasta vazia só para não dar erro de caminho

  server: {
    url: 'https://tapicuz-admin-gujb.vercel.app/admin', // Endereço exato do seu painel
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: ['*'] // Libera acesso a todo o domínio e subpáginas
  },

  android: {
    allowMixedContent: true,
    backgroundColor: '#FFFFFF',
    usesCleartextTraffic: true, // ✅ Resolve bloqueios de conexão
    defaultToWebView: true
  },

  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_notification",
      iconColor: "#F97316"
    }
  }
};

export default config;