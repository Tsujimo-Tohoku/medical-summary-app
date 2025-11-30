"use client";

import { useEffect, useState } from 'react';

// ==========================================
// ★STEP 1: 本番環境（VS Code）では、以下の3行のコメントアウト( // )を外してください
// ==========================================
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
type LinkProps = any; // エラー回避用

// ==========================================
// ★STEP 2: 本番環境（VS Code）では、以下の「プレビュー用モック」ブロックをすべて削除またはコメントアウトしてください
// ==========================================
// --- [プレビュー用モック START] ---
// --- [プレビュー用モック END] ---


import { ArrowLeft, Calendar, FileText, ChevronRight, User, Filter, Clock, Lock, Eye, EyeOff } from 'lucide-react';

interface SummaryRecord {
  id: string;
  user_id: string;
  created_at: string;
  content: string; 
  departments: string;
  is_private: boolean; // 追加
  display_name?: string;
  is_me?: boolean;
}

export default function HistoryPage() {
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<SummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'me'>('all');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setUser(session.user);
      await fetchHistory(session.user.id);
    };
    init();
  }, []);

  useEffect(() => {
    if (filter === 'me') {
      setFilteredSummaries(summaries.filter(s => s.is_me));
    } else {
      setFilteredSummaries(summaries);
    }
  }, [filter, summaries]);

  const fetchHistory = async (myUserId: string) => {
    try {
      const { data: summaryData, error } = await supabase
        .from('summaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!summaryData || summaryData.length === 0) {
        setLoading(false);
        return;
      }

      const userIds = Array.from(new Set(summaryData.map((s: any) => s.user_id)));
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const combined = summaryData.map((item: any) => {
        const profile = profiles?.find((p: any) => p.id === item.user_id);
        return {
          ...item,
          display_name: profile?.display_name || "名無し",
          is_me: item.user_id === myUserId
        };
      });

      setSummaries(combined);
      setFilteredSummaries(combined);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ★追加: 公開設定の切り替え
  const togglePrivacy = async (e: React.MouseEvent, record: SummaryRecord) => {
    e.preventDefault(); // リンク遷移を防ぐ
    e.stopPropagation();

    const newStatus = !record.is_private;
    
    // UIを即時更新 (Optimistic Update)
    const updatedSummaries = summaries.map(s => 
      s.id === record.id ? { ...s, is_private: newStatus } : s
    );
    setSummaries(updatedSummaries);
    setFilteredSummaries(filter === 'me' ? updatedSummaries.filter(s => s.is_me) : updatedSummaries);

    // DB更新
    const { error } = await supabase
      .from('summaries')
      .update({ is_private: newStatus })
      .eq('id', record.id);

    if (error) {
      alert("更新に失敗しました");
      // 戻す
      setSummaries(summaries); 
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const datePart = d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' });
    const timePart = d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    
    return isToday ? `今日 ${timePart}` : `${datePart} ${timePart}`;
  };

  const parseContent = (content: any) => {
    if (typeof content === 'string') {
      try { return JSON.parse(content); } catch (e) { return null; }
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
            <h1 className="text-lg font-bold tracking-tight">家族の履歴</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        
        <div className="flex bg-slate-200 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${filter === 'all' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <User size={14} /> 全員
          </button>
          <button 
            onClick={() => setFilter('me')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${filter === 'me' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <User size={14} className="fill-current" /> 自分のみ
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm animate-pulse">データを読み込んでいます...</div>
        ) : filteredSummaries.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <FileText size={32} />
            </div>
            <p className="text-slate-400 text-sm mb-4">まだ履歴がありません</p>
            <Link href="/" className="inline-block bg-teal-600 text-white font-bold py-2 px-6 rounded-full text-sm hover:bg-teal-700 transition shadow-lg shadow-teal-200">
              作成する
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSummaries.map((item) => {
              const content = parseContent(item.content);
              if (!content) return null;

              return (
                <Link key={item.id} href={`/history/${item.id}`} className="block">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition group relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.is_me ? 'bg-teal-500' : 'bg-blue-400'}`}></div>

                    <div className="flex items-start justify-between mb-3 pl-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${item.is_me ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.display_name?.substring(0, 1) || "?"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            {item.display_name} 
                            {item.is_me && <span className="text-slate-400 font-normal">(あなた)</span>}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                            <Clock size={10} />
                            {formatDate(item.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      {/* 右上のアイコンエリア */}
                      <div className="flex gap-2 items-center">
                        {item.is_me && (
                          <button 
                            onClick={(e) => togglePrivacy(e, item)}
                            className={`p-1.5 rounded-full transition ${item.is_private ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-500'}`}
                            title={item.is_private ? "非公開" : "家族に公開中"}
                          >
                            {item.is_private ? <Lock size={14}/> : <Eye size={14}/>}
                          </button>
                        )}
                        <div className="flex gap-1">
                          {parseContent(item.departments)?.slice(0, 1).map((dept: string, i: number) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md border border-slate-200">
                              {dept}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pl-3">
                      <h3 className="font-bold text-slate-800 text-base mb-1 line-clamp-1">
                        {content.chief_complaint || "主訴なし"}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.is_private && !item.is_me 
                          ? "🔒 非公開の記録です" 
                          : content.history}
                      </p>
                    </div>

                    <div className="mt-4 pl-3 flex justify-end">
                      <span className="text-xs font-bold text-teal-600 flex items-center gap-1 group-hover:underline">
                        詳細を見る <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}