import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tapicuz.admin',
<<<<<<< HEAD
  appName: 'Tapicuz Admin',
  webDir: 'out',
  server: {
    url: 'https://tapicuz-admin-gujb.vercel.app/admin',
    cleartext: false,
    androidScheme: 'https'
  },
=======
  appName: 'Tapicuz da Sul',
  webDir: 'out',
<<<<<<< HEAD

  // Endereço correto que vai direto para a área de admin
  server: {
    url: 'https://tapicuz-admin-gujb.vercel.app/admin',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: ['*'],
    hostname: 'tapicuz-admin-gujb.vercel.app'
  },


>>>>>>> 3ef16fe (voltando aonde pegava)
=======
  server: {
    url: 'https://tapicuz-admin-gujb.vercel.app/admin',
    cleartext: false,
    androidScheme: 'https',
    // ✅ Removido o 'https://wa.me/*' para permitir que o sistema abra o app nativo
    allowNavigation: ['tapicuz-admin-gujb.vercel.app'], 
    hostname: 'tapicuz-admin-gujb.vercel.app'
  },
>>>>>>> 8f8b1c2 (ADMIN 100)
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
