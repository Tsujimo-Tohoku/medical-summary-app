"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

interface SummaryRecord {
  id: number;
  created_at: string;
  content: string; // JSON文字列として保存されている
  departments: string; // JSON文字列
}

export default function HistoryPage() {
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Supabaseから履歴を取得（新しい順）
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      if (data) setSummaries(data);
      setLoading(false);
    };

    fetchHistory();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-slate-800 hover:text-blue-600 transition flex items-center gap-2">
            <span className="text-xl">←</span> Back to Home
          </Link>
          <h1 className="font-bold text-slate-700">診断履歴</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {summaries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 mb-4">まだ履歴がありません。</p>
            <Link href="/" className="text-blue-600 font-bold hover:underline">
              最初の診断を作成する
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {summaries.map((item) => {
              // JSON文字列をオブジェクトに戻す
              const summary = JSON.parse(item.content);
              const depts = JSON.parse(item.departments || "[]");
              const date = new Date(item.created_at).toLocaleDateString('ja-JP', {
                year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
              });

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-bold">{date}</span>
                    <div className="flex gap-2">
                      {depts.map((d: string, i: number) => (
                        <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-blue-800 mb-2">{summary.chief_complaint}</h3>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                      {summary.history}
                    </p>
                    
                    {/* 詳細表示は今回は省略（アコーディオンなどで拡張可能） */}
                    <div className="text-xs text-slate-400 text-right">
                      ID: {item.id}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}