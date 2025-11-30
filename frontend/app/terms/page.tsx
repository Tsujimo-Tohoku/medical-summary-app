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

import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-2">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">利用規約</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm prose prose-slate max-w-none">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 mb-6 border-b pb-4">
            <FileText className="text-teal-600" /> KarteNo 利用規約
          </h2>

          <p className="text-sm text-slate-500 mb-8">
            この利用規約（以下「本規約」といいます）は、KarteNo（以下「当サービス」といいます）の利用条件を定めるものです。登録ユーザーの皆さま（以下「ユーザー」といいます）には、本規約に従って当サービスをご利用いただきます。
          </p>

          <h3 className="text-lg font-bold text-slate-700 mt-8 mb-4">第1条（適用）</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            本規約は、ユーザーと当サービス運営者との間の当サービスの利用に関わる一切の関係に適用されるものとします。
          </p>

          <h3 className="text-lg font-bold text-slate-700 mt-8 mb-4">第2条（免責事項・重要）</h3>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-sm text-red-700 leading-relaxed mb-4">
            <p className="font-bold mb-2">当サービスは医療行為を行うものではありません。</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>当サービスが生成するサマリーは、ユーザーの入力をAIが整理したものであり、医師による診断、治療、助言ではありません。</li>
              <li>生成された内容の正確性、完全性、有用性について、当サービスはいかなる保証も行いません。</li>
              <li>ユーザーは、生成された内容を自身の責任において利用し、必ず医師等の専門家の判断を仰ぐものとします。</li>
              <li>当サービスの利用により生じたいかなる損害（健康被害を含む）についても、運営者は一切の責任を負いません。</li>
            </ul>
          </div>

          <h3 className="text-lg font-bold text-slate-700 mt-8 mb-4">第3条（禁止事項）</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1 ml-2">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>当サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
            <li>他のユーザーに成りすます行為</li>
            <li>当サービスのサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-700 mt-8 mb-4">第4条（サービス内容の変更等）</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            運営者は、ユーザーに通知することなく、当サービスの内容を変更し、または当サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
          </p>

          <p className="text-xs text-slate-400 mt-12 text-right">
            2025年11月30日 制定
          </p>
        </div>
      </main>
    </div>
  );
}