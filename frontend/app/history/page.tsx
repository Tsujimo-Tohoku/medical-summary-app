"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import { ArrowLeft, Calendar, FileText, ChevronRight, Activity } from 'lucide-react';

// 型定義
interface SummaryData {
  chief_complaint: string;
  history: string;
  symptoms: string;
  background: string;
}

interface SummaryRecord {
  id: string;
  created_at: string;
  content: string; // JSON文字列として返ってくる場合があるため
  departments: string;
}

export default function HistoryPage() {
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaries = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching summaries:', error);
      } else {
        setSummaries(data || []);
      }
      setLoading(false);
    };

    fetchSummaries();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // JSONパース用ヘルパー
  const parseContent = (content: any): SummaryData | null => {
    if (typeof content === 'string') {
      try {
        return JSON.parse(content);
      } catch (e) {
        return null;
      }
    }
    return content;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold tracking-tight">履歴一覧</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-slate-400">読み込み中...</div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="mb-4">まだ履歴がありません</p>
            <Link href="/" className="text-teal-600 font-bold hover:underline">
              新しく作成する
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {summaries.map((item) => {
              const content = parseContent(item.content);
              if (!content) return null;

              return (
                <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition cursor-pointer group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Calendar size={12} />
                      {formatDate(item.created_at)}
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-teal-600 transition" />
                  </div>
                  
                  <h3 className="font-bold text-slate-800 mb-2 line-clamp-1">
                    {content.chief_complaint || "主訴なし"}
                  </h3>
                  
                  <div className="text-sm text-slate-500 line-clamp-2">
                    {content.history}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-teal-50 text-teal-700">
                      詳細を確認
                    </span>
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