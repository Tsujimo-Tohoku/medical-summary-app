"use client";

import { useEffect, useState } from 'react';

// ==========================================
// ★STEP 1: 本番環境（VS Code）では、以下の4行のコメントアウト( // )を外してください
// ==========================================
import { useParams } from 'next/navigation'; // 追加
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';
type LinkProps = any;

// ==========================================
// ★STEP 2: 本番環境（VS Code）では、以下の「プレビュー用モック」ブロックをすべて削除またはコメントアウトしてください
// ==========================================
// --- [プレビュー用モック START] ---
// --- [プレビュー用モック END] ---

import { ArrowLeft, FileText, Share2, Calendar, User, Download, Clock } from 'lucide-react';

// バックエンドURL (PDF生成用)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://medical-backend-92rr.onrender.com";

export default function HistoryDetailPage() {
  const { id } = useParams(); // URLからIDを取得
  const [record, setRecord] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. 指定IDのサマリーを取得
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('id', id as string)
        .single();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setRecord(data);

      // 2. 作成者のプロフィールを取得
      if (data) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', data.user_id)
          .single();
        setProfile(profileData);
      }
      
      setLoading(false);
    };

    fetchDetail();
  }, [id]);

  const parseContent = (jsonString: string) => {
    try { return JSON.parse(jsonString); } catch (e) { return null; }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // PDF再発行機能
  const handleDownloadPDF = async () => {
    if (!record) return;
    setPdfLoading(true);
    try {
      const content = parseContent(record.content);
      // PDF生成に必要なテキストを再構築
      const fullText = `■ 主訴\n${content.chief_complaint}\n\n■ 現病歴\n${content.history}\n\n■ 随伴症状\n${content.symptoms}\n\n■ 既往歴・服薬\n${content.background}`;
      
      const response = await fetch(`${BACKEND_URL}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText, pdf_size: "A4" }), // サイズはA4固定または保存しておく必要があるが今回はA4
      });
      
      if (!response.ok) throw new Error("PDF Error");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medical_summary_${formatDate(record.created_at)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("PDFの作成に失敗しました");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">読み込み中...</div>;
  if (!record) return <div className="min-h-screen flex items-center justify-center text-slate-500">データが見つかりません</div>;

  const content = parseContent(record.content);
  const departments = parseContent(record.departments);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/history" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold tracking-tight">記録詳細</h1>
          </div>
          {/* PDFボタン (ヘッダーにも配置) */}
          <button onClick={handleDownloadPDF} disabled={pdfLoading} className="text-teal-600 p-2 hover:bg-teal-50 rounded-full transition">
            <Download size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {/* メタ情報カード */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
              {profile?.display_name ? profile.display_name[0] : <User size={20}/>}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">{profile?.display_name || "名無し"}</p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar size={12} /> {formatDate(record.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* サマリー本体 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="bg-teal-600 p-4 text-white flex items-center gap-2">
            <FileText size={18} />
            <h2 className="font-bold">医師提示用サマリー</h2>
          </div>
          
          <div className="p-6 space-y-6">
            {departments && (
              <div className="flex flex-wrap gap-2">
                {departments.map((dept: string, i: number) => (
                  <span key={i} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                    {dept}
                  </span>
                ))}
              </div>
            )}

            <div>
              <h3 className="text-xs font-bold text-teal-600 uppercase mb-1">主訴</h3>
              <p className="text-slate-800 leading-relaxed font-medium">{content.chief_complaint}</p>
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
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">{content.background}</p>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <button 
          onClick={handleDownloadPDF} 
          disabled={pdfLoading}
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-200 transition flex items-center justify-center gap-2"
        >
          {pdfLoading ? "作成中..." : <><Share2 size={18} /> PDFを再発行・共有</>}
        </button>

      </main>
    </div>
  );
}