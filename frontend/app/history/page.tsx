"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

interface SummaryRecord {
  id: number;
  created_at: string;
  content: string; // JSON文字列
  departments: string; // JSON文字列
}

// ▼ テキスト整形コンポーネント（トップページと同じもの）
const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;
  return (
    <div className="whitespace-pre-wrap leading-relaxed text-sm">
      {text.split('\n').map((line, i) => {
        const trimmed = line.trim();
        // 見出し
        if (trimmed.startsWith('###') || trimmed.startsWith('■')) {
          const content = trimmed.replace(/^#+\s*/, '').replace(/^■\s*/, '');
          return <strong key={i} className="block mt-3 mb-1 text-blue-700">{content}</strong>;
        }
        // リスト
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 mb-1 ml-1">
              <span className="text-blue-400 font-bold">•</span>
              <span className="flex-1">
                {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j} className="text-slate-800 bg-slate-100 px-1 rounded">{part.slice(2, -2)}</strong>;
                  }
                  return part.substring(2);
                })}
              </span>
            </div>
          );
        }
        // 通常行（太字対応）
        return (
          <p key={i} className="min-h-[1em] mb-1">
            {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="text-slate-800 bg-slate-100 px-1 rounded">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};

export default function HistoryPage() {
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  // どのアコーディオンが開いているかを管理（IDを入れる）
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

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

  const toggleOpen = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32 text-slate-900">
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
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 mb-4">まだ履歴がありません。</p>
            <Link href="/" className="text-blue-600 font-bold hover:underline bg-blue-50 px-4 py-2 rounded-lg inline-block">
              最初の診断を作成する
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {summaries.map((item) => {
              // データ解析（エラー回避のためtry-catch）
              let summary, depts;
              try {
                summary = JSON.parse(item.content);
                depts = JSON.parse(item.departments || "[]");
              } catch (e) { return null; }

              const date = new Date(item.created_at).toLocaleDateString('ja-JP', {
                year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'
              });
              const time = new Date(item.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
              
              const isOpen = openId === item.id;

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
                  {/* ヘッダー部分（クリックで開閉） */}
                  <div 
                    onClick={() => toggleOpen(item.id)}
                    className="bg-white px-5 py-4 cursor-pointer flex justify-between items-start gap-4 active:bg-slate-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-1">
                        <span className="font-bold bg-slate-100 px-2 py-0.5 rounded">{date} {time}</span>
                        {depts.length > 0 && <span className="text-blue-600 font-bold">🏥 {depts[0]}</span>}
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 line-clamp-1">
                        {summary.chief_complaint || "主訴なし"}
                      </h3>
                    </div>
                    <div className="text-slate-400">
                      {isOpen ? '▲' : '▼'}
                    </div>
                  </div>
                  
                  {/* 詳細部分（アコーディオン） */}
                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50 p-5 animate-fade-in">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">現病歴</h4>
                          <FormattedText text={summary.history} />
                        </div>
                        {summary.symptoms && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">随伴症状</h4>
                            <FormattedText text={summary.symptoms} />
                          </div>
                        )}
                        {summary.background && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">既往歴・服薬</h4>
                            <FormattedText text={summary.background} />
                          </div>
                        )}
                      </div>
                      
                      {/* コピーボタン等は将来的にここに追加可能 */}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}