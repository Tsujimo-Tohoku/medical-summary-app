"use client";

import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-2">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">プライバシーポリシー</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm prose prose-slate max-w-none">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 mb-6 border-b pb-4">
            <ShieldCheck className="text-teal-600" /> 個人情報保護方針
          </h2>

          <p className="text-sm text-slate-500 mb-8">
            KarteNo（以下「当サービス」といいます）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
          </p>

          <h3 className="text-lg font-bold text-slate-700 mt-8 mb-4">1. 収集する情報</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            当サービスは、以下の情報を取得・利用することがあります。
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1 ml-2">
            <li>ユーザー登録時のメールアドレス</li>
            <li>入力された症状やプロフィール情報（暗号化して保存されます）</li>
            <li>利用端末情報、Cookie、ログ情報</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-700 mt-8 mb-4">2. 入力データの扱い</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            ユーザーが入力した症状などのデータは、以下の目的でのみ利用されます。
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1 ml-2">
            <li>AIによるサマリー生成および翻訳処理</li>
            <li>ユーザー本人の履歴表示</li>
            <li>ユーザーが許可した家族グループ内での共有</li>
          </ul>
          <p className="text-sm text-slate-600 mt-2 font-bold">
            ※入力データがAIの学習データとして二次利用されることはありません（有料APIを利用しているため）。
          </p>

          <h3 className="text-lg font-bold text-slate-700 mt-8 mb-4">3. 広告について</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            当サービスでは、第三者配信の広告サービス（A8.net、ValueCommerce等）を利用しています。これらの広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、当サイトや他サイトへのアクセスに関する情報「Cookie」を使用することがあります。
          </p>

          <h3 className="text-lg font-bold text-slate-700 mt-8 mb-4">4. お問い合わせ</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            本ポリシーに関するお問い合わせは、お問い合わせページよりお願いいたします。
          </p>

          <p className="text-xs text-slate-400 mt-12 text-right">
            2025年11月30日 制定
          </p>
        </div>
      </main>
    </div>
  );
}