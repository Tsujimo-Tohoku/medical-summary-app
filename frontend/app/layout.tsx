import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Googleフォント（Inter）の設定
const inter = Inter({ subsets: ["latin"] });

// ▼ ここがSEO設定の本体です ▼
export const metadata: Metadata = {
  // ブラウザのタブに表示されるタイトル
  title: "症状伝え漏れ防止ツール | AIで医師提示用サマリーを作成",
  
  // 検索結果の下に表示される説明文
  description: "病院に行く前に症状をAIが整理。医師に見せるだけのサマリーを自動作成。伝え漏れを防ぎ、診察をスムーズにする無料ツールです。PDF出力対応。",
  
  // 検索キーワード（Googleなどが参考にするタグ）
  keywords: ["問診", "AI診断", "症状整理", "病院", "救急", "生成AI", "Gemini", "医療メモ"],
  
  // SNS（LINE, X, Facebookなど）でシェアされた時の表示設定
  openGraph: {
    title: "症状伝え漏れ防止ツール | 10秒で医師への説明メモを作成",
    description: "体調不良をうまく言葉にできない...そんな時はAIに任せてください。医師提示用のサマリーを無料で作成します。",
    type: "website",
    locale: "ja_JP",
    siteName: "症状伝え漏れ防止ツール",
  },
  
  // X (Twitter) でシェアされた時のカード設定
  twitter: {
    card: "summary_large_image", // 大きな画像で目立たせる
    title: "症状伝え漏れ防止ツール",
    description: "医師に症状を正しく伝えるAIツール。PDF出力対応。",
  },
  
  // スマホ対応設定
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
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
      </body>
    </html>
  );
}