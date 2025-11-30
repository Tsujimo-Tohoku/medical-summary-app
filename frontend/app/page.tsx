"use client";

import { useState, useEffect, useRef, useCallback } from "react";
// パスを修正: ../../lib... -> ../lib...
import { supabase } from '../lib/supabaseClient'; 

// --- Next.js Link Component Mock for Preview ---
// 本番環境（Next.js）では以下のコメントアウトを解除し、下のconst Link定義を削除してください
// import Link from 'next/link';
const Link = ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>;
// -----------------------------------------------

// アイコンライブラリ: npm install lucide-react が必要です
import { 
  Mic, MicOff, Settings, FileText, Share2, Copy, Check, 
  LogOut, History, ShieldAlert, Activity, Stethoscope 
} from 'lucide-react';

// 環境変数からバックエンドURLを取得（設定がない場合はデフォルト値）
// .env.local に NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com を設定推奨
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://medical-backend-92rr.onrender.com";

// --- 言語・設定データ ---
const DICT = {
  ja: { 
    label: "日本語", button: "カルテ用サマリーを作成", loading: "AIが専門用語に変換中...", 
    copy: "コピー", copied: "完了", share: "共有", pdf: "PDF保存", explanationTitle: "AIからの補足メモ",
    guideTitle: "ご利用ガイド",
    step1: "症状を具体的にお話しください",
    step2: "AIが医学用語に変換・整理します",
    step3: "医師にスマホ画面を見せてください",
    settings: { title: "設定", lang: "言語", appearance: "表示", fontSize: "文字サイズ", theme: "テーマ", pdfSize: "PDF用紙" },
    placeholder: "（例）\n・昨日の夜から右のお腹がズキズキ痛い\n・熱は37.8度で、少し吐き気がある\n・歩くと響くような痛みがある\n・普段、高血圧の薬を飲んでいる",
    recommend: "関連する診療科（参考）",
    headers: { cc: "主訴", history: "現病歴", symptoms: "随伴症状", background: "既往歴・服薬" },
    disclaimer: "本結果はAIによる生成です。診断ではありません。必ず医師の診察を受けてください。",
    login: "ログイン", logout: "ログアウト", history: "履歴",
    adTitle: "ご家族の安心のために"
  },
  en: { 
    label: "English", button: "Create Summary", loading: "Processing...", 
    copy: "Copy", copied: "Copied", share: "Share", pdf: "Save PDF", explanationTitle: "AI Note",
    guideTitle: "How to use", step1: "Describe symptoms", step2: "AI processes text", step3: "Show to doctor",
    settings: { title: "Settings", lang: "Language", appearance: "Appearance", fontSize: "Font Size", theme: "Theme", pdfSize: "PDF Size" },
    placeholder: "(Ex) I have a throbbing pain in my right stomach...",
    recommend: "Related Depts",
    headers: { cc: "Chief Complaint", history: "HPI", symptoms: "Symptoms", background: "History/Meds" },
    disclaimer: "AI generated. Not a diagnosis. Consult a doctor.",
    login: "Login", logout: "Logout", history: "History",
    adTitle: "Recommended Services"
  }
};

type LangKey = 'ja' | 'en';
type Theme = 'light' | 'dark';
type FontSize = 'small' | 'medium' | 'large';
type PdfSize = 'A4' | 'B5' | 'Receipt';

interface AnalysisResult {
  summary: {
    chief_complaint: string;
    history: string;
    symptoms: string;
    background: string;
  }; 
  departments?: string[];
  explanation?: string;
}

// --- サブコンポーネント: 整形テキスト表示 ---
const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;
  return (
    <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
      {text.split(/(\*\*.*?\*\*)/).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // 太字部分をTeal色で強調
          return <strong key={j} className="text-teal-700 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-900/30 px-1 rounded">{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </p>
  );
};

// --- サブコンポーネント: サマリーセクション ---
const SummarySection = ({ title, content }: { title: string, content: string }) => (
  <div className="mb-6 last:mb-0 group">
    <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-2">
      <span className="w-1 h-4 bg-teal-500 rounded-full"></span>
      {title}
    </h4>
    <div className="pl-3 border-l-2 border-slate-100 dark:border-slate-800 group-hover:border-teal-100 transition-colors">
      <FormattedText text={content} />
    </div>
  </div>
);

// --- メインコンポーネント ---
export default function MedicalSummaryApp() {
  const [lang, setLang] = useState<LangKey>("ja");
  const [theme, setTheme] = useState<Theme>('light');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [pdfSize, setPdfSize] = useState<PdfSize>('A4');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const t = DICT[lang] || DICT.ja;

  // 初期化処理: Auth監視 & テーマ設定
  useEffect(() => {
    // OSのダークモード設定を反映
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      subscription.unsubscribe();
    };
  }, []);

  // 音声入力処理 (Web Speech API)
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("このブラウザは音声入力に対応していません。");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'ja' ? 'ja-JP' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) setInputText(prev => prev + (prev ? '\n' : '') + finalTranscript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording, lang]);

  // AI解析リクエスト
  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setResult(null);
    setSaveStatus(null);
    if (isRecording) toggleRecording();

    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, language: t.label }),
      });
      if (!response.ok) throw new Error("API Error");
      
      const data: AnalysisResult = await response.json();
      setResult(data);

      // ログイン済みなら履歴保存
      if (user) {
        const { error } = await supabase.from('summaries').insert({
          user_id: user.id,
          content: JSON.stringify(data.summary),
          departments: JSON.stringify(data.departments || [])
        });
        setSaveStatus(error ? "保存失敗" : "履歴に保存済");
      }
    } catch (error) {
      console.error(error);
      alert("解析に失敗しました。しばらく待ってから再試行してください。");
    } finally {
      setIsLoading(false);
    }
  };

  // PDFダウンロード
  const handleDownloadPDF = async () => {
    if (!result) return;
    try {
      const fullText = `■ ${t.headers.cc}\n${result.summary.chief_complaint}\n\n■ ${t.headers.history}\n${result.summary.history}\n\n■ ${t.headers.symptoms}\n${result.summary.symptoms}\n\n■ ${t.headers.background}\n${result.summary.background}`;
      const response = await fetch(`${BACKEND_URL}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText, pdf_size: pdfSize }),
      });
      if (!response.ok) throw new Error("PDF Error");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medical_summary_${pdfSize}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) { alert("PDF作成エラー"); }
  };

  // テキストコピー
  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `【主訴】${result.summary.chief_complaint}\n【現病歴】${result.summary.history}\n【随伴症状】${result.summary.symptoms}\n【既往歴】${result.summary.background}`.replace(/\*\*/g, "");
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // UIスタイル定義
  const containerClass = `min-h-screen font-sans transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`;
  const cardClass = `rounded-2xl shadow-sm border p-6 mb-8 transition-all duration-300 relative ${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200 shadow-slate-200/50'}`;
  
  return (
    <div className={containerClass}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
              <Activity size={18} />
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              Medical <span className="text-teal-600">Note</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/history" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500">
                  <History size={20} />
                </Link>
              </>
            ) : (
              <Link href="/login" className="text-sm font-bold text-teal-600 hover:text-teal-700">
                {t.login}
              </Link>
            )}

            <div className="relative" ref={settingsRef}>
              <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition">
                <Settings size={20} />
              </button>
              
              {/* Settings Dropdown */}
              {isSettingsOpen && (
                <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-xl border py-2 z-50 animate-fade-in ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">Account</div>
                   {user && <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-red-500"><LogOut size={14}/> {t.logout}</button>}
                   
                   <div className="border-t my-2 border-slate-100 dark:border-slate-800"></div>
                   <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">Theme</div>
                   <div className="flex gap-2 px-4">
                     <button onClick={() => setTheme('light')} className={`flex-1 py-1 text-xs border rounded ${theme === 'light' ? 'bg-slate-100 border-slate-300' : 'border-slate-700'}`}>Light</button>
                     <button onClick={() => setTheme('dark')} className={`flex-1 py-1 text-xs border rounded ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'border-slate-200'}`}>Dark</button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Intro / Guide */}
        {!result && (
          <div className="mb-8 text-center animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">医師への「伝え方」をサポート</h2>
            <p className="text-slate-500 text-sm">AIがあなたの症状を医学的な要約（サマリー）に変換します。</p>
            
            <div className="grid grid-cols-3 gap-4 mt-6 text-xs text-slate-500">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-teal-600"><Mic size={18} /></div>
                <p>{t.step1}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-teal-600"><Activity size={18} /></div>
                <p>{t.step2}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-teal-600"><FileText size={18} /></div>
                <p>{t.step3}</p>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className={`${cardClass} transition-all ${result ? 'border-teal-500/30 ring-1 ring-teal-500/30' : ''}`}>
          <textarea
            className={`w-full h-40 bg-transparent resize-none outline-none text-lg leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700 ${fontSize === 'large' ? 'text-xl' : 'text-base'}`}
            placeholder={t.placeholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          
          <div className="flex items-center justify-between mt-4">
            <button 
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${isRecording ? 'bg-red-50 text-red-600 ring-2 ring-red-500 ring-offset-2' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'}`}
            >
              {isRecording ? <><MicOff size={16} className="animate-pulse" /> 録音中...</> : <><Mic size={16} /> 音声入力</>}
            </button>

            <button
              onClick={handleAnalyze} disabled={isLoading || !inputText}
              className={`px-6 py-2 rounded-full font-bold text-white shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2 ${isLoading || !inputText ? "bg-slate-300 cursor-not-allowed shadow-none" : "bg-teal-600 hover:bg-teal-700 hover:scale-105 active:scale-95"}`}
            >
              {isLoading ? t.loading : <>{t.button} <Stethoscope size={18} /></>}
            </button>
          </div>
        </div>

        {/* Result Area */}
        {result && (
          <div className="animate-fade-in space-y-6">
            
            {/* Status Bar */}
            {saveStatus && (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/20 py-2 rounded-lg">
                <Check size={14} /> {saveStatus}
              </div>
            )}

            <div className={`rounded-2xl overflow-hidden border shadow-lg ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-teal-900/5'}`}>
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-4 text-white flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2"><FileText size={18}/> 医師提示用サマリー</h3>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="p-2 hover:bg-white/20 rounded-lg transition" title={t.copy}>
                    {isCopied ? <Check size={18}/> : <Copy size={18}/>}
                  </button>
                  <button onClick={handleDownloadPDF} className="p-2 hover:bg-white/20 rounded-lg transition" title={t.pdf}>
                    <Share2 size={18}/>
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {/* 診療科タグ */}
                {result.departments && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {result.departments.map((dept, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {dept}
                      </span>
                    ))}
                  </div>
                )}

                <SummarySection title={t.headers.cc} content={result.summary.chief_complaint} />
                <SummarySection title={t.headers.history} content={result.summary.history} />
                <SummarySection title={t.headers.symptoms} content={result.summary.symptoms} />
                <SummarySection title={t.headers.background} content={result.summary.background} />

                <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-lg flex gap-3 text-xs text-amber-800 dark:text-amber-400">
                  <ShieldAlert size={24} className="flex-shrink-0" />
                  <p>{t.disclaimer}</p>
                </div>
              </div>
            </div>

            {/* AI Explanation */}
            {result.explanation && (
              <div className="p-6 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-500 mb-3 flex items-center gap-2">
                  💡 {t.explanationTitle}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {result.explanation}
                </p>
              </div>
            )}

            {/* Native Ads Area: 結果表示後に自然に配置 */}
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                {t.adTitle}
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* 広告スロット1: ここにアフィリエイトリンク等を設置 */}
                <a href="#" className="block p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-colors group">
                  <div className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-1 group-hover:text-teal-600">見守りサービス</div>
                  <p className="text-xs text-slate-500">離れて暮らすご家族の通院状況を共有。安心を届けます。</p>
                </a>
                {/* 広告スロット2 */}
                <a href="#" className="block p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-colors group">
                  <div className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-1 group-hover:text-teal-600">宅食サービス</div>
                  <p className="text-xs text-slate-500">健康的な食事をご自宅へお届け。塩分控えめメニューも。</p>
                </a>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer: リンクのみシンプルに */}
      <footer className="py-8 text-center text-xs text-slate-400">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/privacy" className="hover:text-teal-600 transition">Privacy</Link>
          <Link href="/terms" className="hover:text-teal-600 transition">Terms</Link>
        </div>
        <p>© 2025 Medical Note.</p>
      </footer>
    </div>
  );
}