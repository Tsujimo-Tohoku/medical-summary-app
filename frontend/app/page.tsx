"use client";

import { useState, useEffect, useRef } from "react";
// ディレクトリ構成: frontend/app/page.tsx -> frontend/lib/supabaseClient.ts
import { supabase } from '../lib/supabaseClient'; 
import Link from 'next/link';
import { 
  Mic, MicOff, Settings, FileText, Share2, Copy, Check, 
  LogOut, History, ShieldAlert, Activity, Stethoscope, Globe, Type, Users, User,
  Eye, Lock, ChevronRight, ArrowRight, ShieldCheck, Heart, Loader2
} from 'lucide-react';
// ディレクトリ構成: frontend/app/page.tsx -> frontend/components/NativeAds.tsx
import { NativeAds } from '../components/NativeAds';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://medical-backend-92rr.onrender.com";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApp, setShowApp] = useState(false);
  
  // App Logic States
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [textInput, setTextInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false); // デフォルトは家族に公開

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Auth Check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setRecording(true);
      setError(null);
    } catch (err) {
      setError("マイクへのアクセスが許可されていません。設定をご確認ください。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Submit to AI
  const handleSubmit = async () => {
    if (!audioBlob && !textInput.trim()) {
      setError("音声またはテキストを入力してください");
      return;
    }

    setProcessing(true);
    setError(null);

    const formData = new FormData();
    if (user) {
      formData.append('user_id', user.id);
      formData.append('is_private', isPrivate.toString()); // プライバシー設定送信
    }
    
    if (mode === 'voice' && audioBlob) {
      formData.append('file', audioBlob, 'recording.webm');
    } else {
      formData.append('text_input', textInput);
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/process`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('処理に失敗しました');
      
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "予期せぬエラーが発生しました");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setAudioBlob(null);
    setTextInput("");
    setRecording(false);
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    try {
      // 簡易的なPDFダウンロードロジック (Backend依存)
      window.open(`${BACKEND_URL}/api/pdf/${result.id}`, '_blank');
    } catch (e) {
      alert("ダウンロードに失敗しました");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );

  // ---------------------------------------------------------
  // LP (Landing Page) View - 未ログイン or アプリ未起動
  // ---------------------------------------------------------
  if (!user && !showApp) {
    return (
      <div className="min-h-screen bg-white font-sans text-slate-900">
        {/* Header */}
        <header className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
              <span className="font-bold text-xl tracking-tight text-slate-800">Karutto</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-teal-600 transition">ログイン</Link>
              <button 
                onClick={() => setShowApp(true)}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
              >
                無料で始める
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-teal-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              AIが医療用語をわかりやすく整理
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
              医師に<span className="text-teal-600">正しく伝わる</span>。<br/>
              家族で<span className="text-teal-600">見守れる</span>。
            </h1>
            <p className="text-slate-500 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
              高齢のご家族の通院、症状をうまく説明できていますか？<br/>
              Karutto（カルット）は、話すだけで症状を医療サマリーに変換。<br/>
              「伝え忘れ」を防ぎ、医師とのコミュニケーションを円滑にします。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => setShowApp(true)} className="w-full sm:w-auto px-8 py-4 bg-teal-600 text-white rounded-xl font-bold text-lg hover:bg-teal-700 transition shadow-xl shadow-teal-600/20 flex items-center justify-center gap-2">
                <Mic size={20} /> 今すぐ試す (登録不要)
              </button>
              <Link href="/about" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition flex items-center justify-center gap-2">
                <FileText size={20} /> 詳しく見る
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <Mic className="text-teal-600" />, title: "話すだけで記録", desc: "難しい操作は不要。症状を話すだけで、AIが医学的な文章に整理します。" },
                { icon: <FileText className="text-blue-600" />, title: "医師への提示用画面", desc: "スマホを見せるだけでOK。医師が一目で理解できるフォーマットで表示。" },
                { icon: <Users className="text-rose-600" />, title: "家族で共有", desc: "離れて暮らす家族ともリアルタイムで通院記録を共有。見守りに最適です。" }
              ].map((f, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6">{f.icon}</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{f.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-12 px-4">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm">© 2025 Karutto. All rights reserved.</div>
            <div className="flex gap-6 text-sm font-bold">
              <Link href="/terms" className="hover:text-white transition">利用規約</Link>
              <Link href="/privacy" className="hover:text-white transition">プライバシーポリシー</Link>
              <Link href="/contact" className="hover:text-white transition">お問い合わせ</Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ---------------------------------------------------------
  // App View - ツール本体
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2" onClick={() => { handleReset(); setShowApp(false); }}>
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold cursor-pointer">K</div>
            <span className="font-bold text-lg tracking-tight text-slate-800 hidden sm:block">Karutto</span>
          </div>
          
          <div className="flex items-center gap-2">
            {!user ? (
              <Link href="/login" className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 transition">
                ログイン / 保存
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link href="/history" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition relative group">
                  <History size={22} />
                  <span className="absolute top-10 right-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">履歴</span>
                </Link>
                <Link href="/family" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition relative group">
                  <Users size={22} />
                  <span className="absolute top-10 right-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">家族</span>
                </Link>
                <Link href="/profile" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition relative group">
                  <User size={22} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        
        {/* Result View */}
        {result ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
              <div className="bg-teal-600 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Stethoscope size={20} />
                  <span className="font-bold">生成結果</span>
                </div>
                <div className="text-xs bg-teal-700 px-2 py-1 rounded border border-teal-500">
                  医師提示用
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase">受信診療科（推定）</span>
                  <div className="font-bold text-teal-700 text-lg mt-1">{result.departments || "一般内科"}</div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-teal-600 uppercase mb-1 flex items-center gap-1">
                    <Activity size={14} /> 主訴
                  </h3>
                  <p className="text-slate-800 font-bold text-lg leading-relaxed">{result.chief_complaint}</p>
                </div>
                
                <div className="border-t border-slate-100"></div>

                <div>
                  <h3 className="text-xs font-bold text-teal-600 uppercase mb-1">現病歴</h3>
                  <p className="text-slate-600 leading-relaxed">{result.history}</p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-teal-600 uppercase mb-1">随伴症状</h3>
                  <p className="text-slate-600 leading-relaxed">{result.symptoms}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex gap-3">
                <button 
                   onClick={handleDownloadPDF}
                   className="flex-1 bg-teal-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-teal-700 transition shadow-lg shadow-teal-600/20"
                >
                  <FileText size={18} /> PDF保存
                </button>
                <button onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                  alert("コピーしました");
                }} className="p-3 bg-white border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 transition">
                  <Copy size={20} />
                </button>
              </div>
            </div>

            {/* ★ ここにネイティブ広告を配置 ★ */}
            <NativeAds />

            <button onClick={handleReset} className="w-full py-4 text-slate-500 font-bold hover:text-slate-800 transition">
              ← 新しく作成する
            </button>
          </div>
        ) : (
          /* Input View */
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">今日はどうされましたか？</h2>
              <p className="text-slate-500 text-sm">症状を詳しく話すか、入力してください。<br/>AIが医師に伝わる言葉に整理します。</p>
            </div>

            {/* Mode Toggle */}
            <div className="bg-slate-200 p-1 rounded-xl flex mb-6">
              <button 
                onClick={() => setMode('voice')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${mode === 'voice' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
              >
                <Mic size={16} /> 音声入力
              </button>
              <button 
                onClick={() => setMode('text')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${mode === 'text' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
              >
                <Type size={16} /> テキスト
              </button>
            </div>

            {mode === 'voice' ? (
              <div className="flex flex-col items-center justify-center py-8">
                <button 
                  onClick={recording ? stopRecording : startRecording}
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${recording ? 'bg-rose-500 shadow-rose-500/50 shadow-2xl scale-110' : 'bg-teal-600 shadow-teal-600/30 shadow-xl hover:scale-105'}`}
                >
                  {recording ? (
                    <div className="w-8 h-8 bg-white rounded-sm animate-pulse" />
                  ) : (
                    <Mic className="w-10 h-10 text-white" />
                  )}
                  {/* Recording Ring Animation */}
                  {recording && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping"></span>
                  )}
                </button>
                <p className={`mt-6 font-bold ${recording ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
                  {recording ? "録音中... もう一度タップして終了" : "タップして録音開始"}
                </p>
                {audioBlob && !recording && (
                  <div className="mt-4 flex items-center gap-2 text-teal-600 bg-teal-50 px-4 py-2 rounded-full text-sm font-bold">
                    <Check size={16} /> 録音完了
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="例：昨日の夜から38度の熱があり、喉が痛いです。食欲もありません..."
                className="w-full h-48 p-4 bg-white border border-slate-300 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none resize-none shadow-sm text-base leading-relaxed"
              ></textarea>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2 border border-rose-100">
                <ShieldAlert size={18} /> {error}
              </div>
            )}

            {/* Privacy Settings (Toggle) */}
            {user && (
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <button 
                  onClick={() => setShowPrivacySettings(!showPrivacySettings)}
                  className="w-full flex justify-between items-center text-sm font-bold text-slate-600"
                >
                  <span className="flex items-center gap-2">
                    {isPrivate ? <Lock size={16} className="text-rose-500"/> : <Users size={16} className="text-teal-500"/>}
                    公開設定: <span className={isPrivate ? "text-rose-500" : "text-teal-600"}>{isPrivate ? "自分のみ" : "家族と共有"}</span>
                  </span>
                  <Settings size={16} className="text-slate-400" />
                </button>
                
                {showPrivacySettings && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <button 
                      onClick={() => setIsPrivate(false)}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 text-sm font-bold border ${!isPrivate ? 'bg-teal-50 border-teal-200 text-teal-700' : 'border-transparent hover:bg-slate-50 text-slate-500'}`}
                    >
                      <Users size={18} />
                      <div className="text-left">
                        <div>家族と共有</div>
                        <div className="text-[10px] font-normal opacity-80">家族グループのメンバーが閲覧できます</div>
                      </div>
                      {!isPrivate && <Check size={16} className="ml-auto" />}
                    </button>
                    <button 
                      onClick={() => setIsPrivate(true)}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 text-sm font-bold border ${isPrivate ? 'bg-rose-50 border-rose-200 text-rose-700' : 'border-transparent hover:bg-slate-50 text-slate-500'}`}
                    >
                      <Lock size={18} />
                      <div className="text-left">
                        <div>自分のみ（非公開）</div>
                        <div className="text-[10px] font-normal opacity-80">自分以外のメンバーには表示されません</div>
                      </div>
                      {isPrivate && <Check size={16} className="ml-auto" />}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={processing || (!audioBlob && !textInput.trim())}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2
                ${processing || (!audioBlob && !textInput.trim()) 
                  ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                  : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'}`}
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin" />
                  AIが分析中...
                </>
              ) : (
                <>
                  サマリーを作成する <ArrowRight size={20} />
                </>
              )}
            </button>

            {!user && (
              <p className="text-center text-xs text-slate-400 mt-4">
                ※ログインしていない場合、履歴は保存されません。<br/>
                <Link href="/login" className="text-teal-600 underline">ログインはこちら</Link>
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}