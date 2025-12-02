import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 本番URL（OGP画像のベースURLになります）
// .env.local に NEXT_PUBLIC_FRONTEND_URL がなければデフォルト値を使います
const BASE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "https://karteno.jp";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s | Karutto',
    default: 'Karutto - 医師に伝える、家族と備える。',
  },
  description: "AIが通院時の症状説明をサポート。家族で見守る医療サマリーアプリ。",
  manifest: "/manifest.json",
  themeColor: "#0D9488",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  // --- OGP設定 (SNSシェア用) ---
  openGraph: {
    title: 'Karutto (カルット)',
    description: '通院時の「伝え忘れ」を防ぐ。家族で共有できる医療サマリー作成アプリ。',
    url: BASE_URL,
    siteName: 'Karutto',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/ogp.png', // publicフォルダに配置した画像
        width: 1200,
        height: 630,
        alt: 'Karutto OGP Image',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Karutto (カルット)',
    description: '医師に伝える、家族と備える。AI医療サマリーアプリ。',
    images: ['/ogp.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Karutto",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {children}
        {/* Google Analytics (IDが設定されている場合のみ有効化) */}
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}