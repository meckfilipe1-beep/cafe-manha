import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tapicuz.admin',
  appName: 'Tapicuz Admin',
  server: {
    url: 'https://tapicuz-admin-gujb.vercel.app/admin',
    cleartext: true,
    // Essa linha garante que não tente carregar arquivos locais
    androidScheme: 'https'
  }
};

export default config;