"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
// ディレクトリ構成: frontend/app/history/[id]/page.tsx -> frontend/lib/supabaseClient.ts
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';
// ディレクトリ構成: frontend/app/history/[id]/page.tsx -> frontend/components/NativeAds.tsx
import { NativeAds } from '../../../components/NativeAds';

import { ArrowLeft, FileText, Share2, Calendar, User, Download, Clock, Loader2, ShieldAlert } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://medical-backend-92rr.onrender.com";

export default function HistoryDetailPage() {
  const { id } = useParams();
  const [record, setRecord] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const { data, error } = await supabase
          .from('summaries')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setRecord(data);

        if (data.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', data.user_id)
            .single();
          setProfile(profileData);
        }

      } catch (err) {
        console.error(err);
        setError("データの取得に失敗しました。削除されたか、権限がありません。");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      window.open(`${BACKEND_URL}/api/pdf/${id}`, '_blank');
    } catch (e) {
      alert("PDFのダウンロードに失敗しました");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShare = async () => {
    if (!record) return;
    const text = `【通院サマリー】\n主訴: ${record.content.chief_complaint}\n作成日: ${new Date(record.created_at).toLocaleDateString()}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Karutto Medical Summary',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        // シェアキャンセル等は無視
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("URLをコピーしました");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );

  if (error || !record) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl text-center max-w-sm shadow-sm">
        <ShieldAlert size={48} className="mx-auto text-rose-500 mb-4" />
        <h2 className="text-lg font-bold text-slate-800 mb-2">エラーが発生しました</h2>
        <p className="text-slate-500 text-sm mb-6">{error || "データが見つかりませんでした"}</p>
        <Link href="/history" className="inline-block px-6 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm">
          履歴一覧に戻る
        </Link>
      </div>
    </div>
  );

  const content = record.content || {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/history" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold tracking-tight">サマリー詳細</h1>
          </div>
          <button onClick={handleShare} className="p-2 rounded-full hover:bg-slate-100 text-teal-600 transition">
            <Share2 size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Meta Info Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <User size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold mb-0.5">作成者</div>
              <div className="font-bold text-slate-800 text-sm">
                {profile?.display_name || "名無しさん"}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs text-slate-400 font-bold mb-0.5">
              <Calendar size={12} /> 作成日
            </div>
            <div className="font-bold text-slate-800 text-sm">
              {new Date(record.created_at).toLocaleDateString()}
            </div>
            <div className="text-[10px] text-slate-400">
              {new Date(record.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="h-2 bg-teal-600 w-full"></div>
          <div className="p-6 space-y-6">
            
            <div className="bg-teal-50 px-4 py-3 rounded-lg border border-teal-100 flex justify-between items-center">
              <span className="text-xs font-bold text-teal-600">推定診療科</span>
              <span className="font-bold text-teal-800">{content.departments || "---"}</span>
            </div>

            <div>
              <h3 className="text-xs font-bold text-teal-600 uppercase mb-1">主訴</h3>
              <p className="text-slate-800 leading-relaxed font-bold text-lg">{content.chief_complaint}</p>
            </div>
            <div className="border-t border-slate-100 my-4"></div>
            
            <div>
              <h3 className="text-xs font-bold text-teal-600 uppercase mb-1">現病歴</h3>
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">{content.history}</p>
            </div>
            
            <div>
              <h3 className="text-xs font-bold text-teal-600 uppercase mb-1">随伴症状</h3>
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">{content.symptoms}</p>
            </div>
            
            <div>
              <h3 className="text-xs font-bold text-teal-600 uppercase mb-1">既往歴・服薬</h3>
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">{content.background || "特になし"}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mb-8">
          <button 
            onClick={handleDownloadPDF} 
            disabled={pdfLoading}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {pdfLoading ? <Loader2 className="animate-spin" /> : <Download size={20} />}
            PDFをダウンロード
          </button>
        </div>

        {/* ★ ネイティブ広告コンポーネント ★ */}
        <NativeAds />

      </main>
    </div>
  );
}