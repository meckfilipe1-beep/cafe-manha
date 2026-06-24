import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tapicuz.admin',
  appName: 'Tapicuz da Sul',
  webDir: 'out',

  // ✅ Configuração do servidor: aponta direto para a página de admin
  server: {
    url: 'https://tapicuz-admin-gujb.vercel.app/admin',
    cleartext: false, // Melhor segurança, usa HTTPS
    androidScheme: 'https',
    allowNavigation: ['*'], // Permite abrir links externos
    hostname: 'tapicuz-admin-gujb.vercel.app'
  },

  // ✅ Configuração das notificações locais
  plugins: {
    LocalNotifications: {
      smallIcon: "mipmap/ic_launcher",
      iconColor: "#F97316"
    }
  }
};

export default config;