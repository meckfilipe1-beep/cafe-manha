import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tapicuz.admin',
  appName: 'Tapicuz Admin',
  
  // 📡 Usa diretamente o seu site no Vercel (já está funcionando)
  server: {
    url: 'https://tapicuz-admin-gujb.vercel.app/admin',
    cleartext: false, // Melhor usar falso para segurança com HTTPS
    androidScheme: 'https'
  },

  // 📂 Define a pasta, mas não vai usar pois está usando servidor
  webDir: 'out',

  // 🔔 Configuração das notificações que já adicionamos
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_notification",
      iconColor: "#F97316" // Cor laranja da sua marca
    }
  }
};

export default config;