import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Head from 'next/head'


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tapicuz - Café da Manhã",
  description: "Seu café da manhã saboroso e entregue na hora certa!",

  // 🖼️ Ícone e imagem para o APK
  icons: {
    icon: "/imagens/icon.png",
    apple: "/imagens/icon.png",
  },

  // 📱 Imagem de tela inicial/splash
  openGraph: {
    images: [{ url: "/imagens/splash.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      translate="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <Head>
  <link rel="icon" type="image/png" href="/imagens/icon.png" />
  <link rel="apple-touch-icon" href="/imagens/icon.png" />
</Head>
      <head>
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Language" content="pt-BR" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}