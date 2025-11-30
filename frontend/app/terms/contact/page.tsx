"use client";

import Link from 'next/link';
import { ArrowLeft, Mail, ExternalLink } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-2">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">お問い合わせ</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 mb-4">お問い合わせについて</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">
            不具合の報告や、機能のご要望、その他ご質問は以下のフォームより受け付けております。<br/>
            お気軽にご連絡ください。
          </p>

          {/* Googleフォーム等のURLが決まったら href を書き換えてください */}
          <a 
            href="https://forms.google.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
          >
            お問い合わせフォームを開く <ExternalLink size={16} />
          </a>
          
          <p className="text-xs text-slate-400 mt-6">
            ※Googleフォームへ移動します。
          </p>
        </div>
      </main>
    </div>
  );
}