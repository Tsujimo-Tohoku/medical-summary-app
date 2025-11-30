"use client";

// ==========================================
// ★STEP 1: 本番環境（VS Code）では、以下の1行のコメントアウト( // )を外してください
// ==========================================
import Link from 'next/link';

// ==========================================
// ★STEP 2: 本番環境（VS Code）では、以下の「プレビュー用モック」ブロックをすべて削除またはコメントアウトしてください
// ==========================================
// --- [プレビュー用モック START] ---
// --- [プレビュー用モック END] ---

import { ArrowLeft, Coffee, User, Mail, ExternalLink, School, Heart } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-2">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">開発者について</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 animate-fade-in">
          
          {/* 開発ストーリー */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">開発ストーリー</h1>
            </div>
            
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm md:text-base space-y-4">
              <p>
                はじめまして。この「KarteNo (Smart Medical Summary)」を開発した、東北大学 電気情報物理工学科の学生です。
              </p>
              <p>
                このアプリを作ったきっかけは、私自身のコンプレックスにあります。
                私は昔から、とっさのコミュニケーションが得意ではなく、自分の状況を素早く正確に相手に伝えることに苦手意識がありました。
              </p>
              <p>
                特に体調が悪い時は、頭が回らず、医師や看護師の質問に焦ってしまい、後になって「あれも言えばよかった」と後悔することが何度もありました。
                「病院に行くのが億劫だ」と感じてしまうその気持ちを、技術の力で少しでも取り除きたい——そんな想いで、このアプリを個人で開発しました。
              </p>
              <p className="font-bold text-teal-700">
                AIがあなたの代わりに言葉を整理することで、安心して受診できる手助けになれば幸いです。
              </p>
            </div>
          </section>

          {/* 運営・支援のお願いエリア */}
          <section className="mb-12 bg-teal-50 border border-teal-100 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-teal-600 text-white p-2 rounded-lg">
                <Heart size={20} />
              </div>
              <h2 className="text-lg font-bold text-teal-900">運営へのご支援について</h2>
            </div>
            
            <p className="text-slate-700 mb-4 text-sm leading-relaxed">
              本アプリは、<strong>「必要な時に誰でも使えるように」</strong>という想いから、学生個人が開発し、<strong>完全無料</strong>で公開しています。
            </p>
            <p className="text-slate-700 mb-6 text-sm leading-relaxed">
              しかし、AIの利用料やサーバー維持費などの運営コストが発生しております。
              現在は広告収入等で賄っておりますが、もし「役に立った」「応援したい」と思っていただけましたら、温かいご支援をいただけますと幸いです。
              いただいたご支援は、全額をアプリの維持・機能開発に充てさせていただきます。
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* 寄付ボタン例 */}
              <a 
                href="https://www.buymeacoffee.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-sm hover:shadow-md text-sm"
              >
                <Coffee size={18} /> 開発者を支援する
              </a>
            </div>
          </section>

          <hr className="border-slate-100 my-8" />

          {/* プロフィール & リンク */}
          <section className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <School size={18} className="text-slate-400" /> Profile
              </h2>
              <ul className="space-y-3 text-slate-600 text-sm">
                <li className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="font-bold min-w-[4rem] text-slate-800">所属:</span>
                  <span>東北大学 工学部</span>
                </li>
                <li className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="font-bold min-w-[4rem] text-slate-800">専攻:</span>
                  <span>電気情報物理工学科</span>
                </li>
                <li className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="font-bold min-w-[4rem] text-slate-800">関心:</span>
                  <span>AI応用, Web・アプリ開発, ガジェット</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Mail size={18} className="text-slate-400" /> Contact
              </h2>
              <p className="text-slate-500 mb-4 text-xs">
                バグ報告、機能要望、その他お問い合わせは以下のリンクよりお願いいたします。
              </p>
              <div className="flex flex-col gap-3">
                <Link 
                  href="/contact" 
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-teal-200 text-teal-600 font-bold rounded-lg hover:bg-teal-50 transition shadow-sm text-sm"
                >
                  <ExternalLink size={16} /> お問い合わせフォーム
                </Link>
                <a 
                  href="https://twitter.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition shadow-sm text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                  X (Twitter)
                </a>
              </div>
            </div>
          </section>

        </div>
      </main>

      <footer className="py-8 text-center text-sm text-slate-400">
        <p>© 2025 KarteNo.</p>
      </footer>
    </div>
  );
}