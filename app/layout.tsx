import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tapicuz - Café da Manhã",
  description: "Seu café da manhã saboroso e entregue na hora certa!",
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
      <head>
        {/* IMPEDIR CHROME DE PEDIR TRADUÇÃO */}
        <meta name="google" content="notranslate" />
        <meta http-equiv="Content-Language" content="pt-BR" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}