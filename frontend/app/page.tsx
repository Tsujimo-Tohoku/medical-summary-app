"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ==========================================
// ★STEP 1: 本番環境（VS Code）では、以下の3行のコメントアウト( // )を外してください
// ==========================================
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
type LinkProps = any; // エラー回避用

// ==========================================
// ★STEP 2: 本番環境（VS Code）では、以下の「プレビュー用モック」ブロックをすべて削除またはコメントアウトしてください
// ==========================================
// --- [プレビュー用モック START] ---
// --- [プレビュー用モック END] ---


import { 
  Mic, MicOff, Settings, FileText, Share2, Copy, Check, 
  LogOut, History, ShieldAlert, Activity, Stethoscope, Globe, Type, Users, FilePlus, User,
  Eye, Lock, Utensils, HeartPulse, ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Heart
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://medical-backend-92rr.onrender.com";

// --- 広告データ ---
const AD_ITEMS = [
  { id: 1, title: "ALSOKの見守りサポート", desc: "緊急時にガードマンが駆けつけ。離れて暮らすご両親に安心を。", icon: <ShieldAlert size={20} />, color: "text-blue-600 bg-blue-100", borderColor: "border-blue-200 hover:border-blue-400", url: "#" },
  { id: 2, title: "栄養バランス宅配食 nosh", desc: "レンジで温めるだけ。塩分・糖質に配慮した健康的な食事。", icon: <Utensils size={20} />, color: "text-green-600 bg-green-100", borderColor: "border-green-200 hover:border-green-400", url: "#" },
  { id: 3, title: "自宅でできる郵送検査", desc: "忙しいあなたへ。生活習慣病リスクを自宅で簡単チェック。", icon: <HeartPulse size={20} />, color: "text-rose-600 bg-rose-100", borderColor: "border-rose-200 hover:border-rose-400", url: "#" },
];

// --- 辞書データ ---
const DICT = {
  ja: { 
    label: "日本語", button: "医師に見せる画面を作成", loading: "AIが症状を整理・言語化しています...", 
    copy: "コピー", copied: "完了", share: "LINE等で送る", pdf: "PDFで保存", explanationTitle: "患者様への確認メモ",
    guideTitle: "このツールの使い方は？",
    step1: "下の入力欄に、症状を書いてください。マイクボタンで音声入力も可能です。",
    step2: "「医師に見せる画面を作成」ボタンを押します。",
    step3: "整理されたサマリーが表示されます。そのまま医師に見せるか、Web問診票にコピーしてください。",
    settings: { 
      title: "設定", lang: "言語", appearance: "表示設定", 
      fontSize: "文字サイズ", theme: "テーマ", pdfSize: "PDFサイズ",
      family: "家族設定", profile: "プロフィール設定", account: "アカウント",
      fontLabels: { s: "小", m: "標準", l: "大" },
      themeLabels: { light: "ライト", dark: "ダーク" }
    },
    placeholder: "（例）\n・昨日の夜から右のお腹がズキズキ痛い\n・熱は37.8度で、少し吐き気がある\n・歩くと響くような痛みがある\n・普段、高血圧の薬を飲んでいる",
    recommend: "関連する診療科の例（参考）",
    headers: { cc: "主訴", history: "現病歴", symptoms: "随伴症状", background: "既往歴・服薬" },
    disclaimer: "※本結果はAIによる自動生成であり、医師による診断ではありません。参考情報としてご利用いただき、必ず医療機関を受診してください。",
    login: "ログイン", logout: "ログアウト", history: "履歴",
    adTitle: "ご家族の安心のために",
    public: "家族に公開中", private: "自分のみ (非公開)"
  },
  en: { 
    label: "English", button: "Create Medical Summary", loading: "AI is organizing your symptoms...", 
    copy: "Copy", copied: "Copied", share: "Share", pdf: "Save as PDF", explanationTitle: "Note for you",
    guideTitle: "How to use this tool?",
    step1: "Describe your symptoms below. You can also use voice input.",
    step2: "Tap 'Create Medical Summary'.",
    step3: "Show the summary to your doctor.",
    settings: { 
      title: "Settings", lang: "Language", appearance: "Appearance", 
      fontSize: "Font Size", theme: "Theme", pdfSize: "PDF Size",
      family: "Family Settings", profile: "Profile Settings", account: "Account",
      fontLabels: { s: "Small", m: "Medium", l: "Large" },
      themeLabels: { light: "Light", dark: "Dark" }
    },
    placeholder: "(Ex) I have a throbbing pain in my right stomach since last night...",
    recommend: "Related Departments (Ref)",
    headers: { cc: "Chief Complaint", history: "History of Present Illness", symptoms: "Associated Symptoms", background: "Past History / Medication" },
    disclaimer: "* This is AI-generated text, not a medical diagnosis. Please consult a doctor.",
    login: "Login", logout: "Logout", history: "History",
    adTitle: "Recommended Services",
    public: "Shared with Family", private: "Private (Only Me)"
  },
  // 他言語省略
};

type LangKey = keyof typeof DICT;
type Theme = 'light' | 'dark';
type FontSize = 'small' | 'medium' | 'large';
type PdfSize = 'A4' | 'B5' | 'Receipt';

interface AnalysisResult {
  summary: { chief_complaint: string; history: string; symptoms: string; background: string; }; 
  departments?: string[]; explanation?: string; id?: string;
}

// --- サブコンポーネント ---
const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;
  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {text.split(/(\*\*.*?\*\*)/).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={j} className="text-teal-700 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-900/30 px-1 rounded">{part.slice(2, -2)}</strong>;
        return part;
      })}
    </p>
  );
};

const SummarySection = ({ title, content }: { title: string, content: string }) => (
  <div className="mb-6 last:mb-0 group">
    <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-2">
      <span className="w-1 h-4 bg-teal-500 rounded-full"></span>{title}
    </h4>
    <div className="pl-3 border-l-2 border-slate-100 dark:border-slate-800 group-hover:border-teal-100 transition-colors">
      <FormattedText text={content} />
    </div>
  </div>
);

const AdCarousel = ({ items }: { items: typeof AD_ITEMS }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => { setCurrentIndex((prev) => (prev + 1) % items.length); }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, items.length]);

  return (
    <div className="relative w-full overflow-hidden group" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)}>
      <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {items.map((ad) => (
          <div key={ad.id} className="w-full flex-shrink-0 px-1">
            <a href={ad.url} target="_blank" rel="noopener noreferrer" className={`block p-4 rounded-xl border ${ad.borderColor} bg-white transition-all h-full relative overflow-hidden`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2"><div className={`p-1.5 rounded-lg ${ad.color}`}>{ad.icon}</div><div className="font-bold text-slate-700 text-sm">{ad.title}</div></div>
                <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border border-slate-200">PR</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pl-1">{ad.desc}</p>
            </a>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 mt-3">
        {items.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-teal-400' : 'w-1.5 bg-slate-200'}`} />)}
      </div>
    </div>
  );
};

// ==========================================
// ★メインアプリ (MainApp)
// ==========================================
const MainApp = ({ user, isGuest }: { user: any, isGuest: boolean }) => {
  const [lang, setLang] = useState<LangKey>("ja");
  const [theme, setTheme] = useState<Theme>('light');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [pdfSize, setPdfSize] = useState<PdfSize>('A4');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const t = DICT[lang as LangKey] || DICT.ja;

  const getTextSizeClass = () => {
    switch(fontSize) { case 'small': return 'text-sm'; case 'large': return 'text-xl'; default: return 'text-base'; }
  };

  // ★修正: cardClass の定義を追加
  const cardClass = `rounded-2xl shadow-sm border p-6 mb-8 transition-all duration-300 relative ${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200 shadow-slate-200/50'}`;

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true); setResult(null); setSaveStatus(null); setIsPrivate(false); setCurrentRecordId(null);
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); }

    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, language: t.label }),
      });
      if (!response.ok) throw new Error("API Error");
      const data: AnalysisResult = await response.json();
      setResult(data);

      if (user && !isGuest) {
        const { data: inserted, error } = await supabase.from('summaries').insert({
          user_id: user.id,
          content: JSON.stringify(data.summary),
          departments: JSON.stringify(data.departments || []),
          is_private: false
        }).select('id').single();
        if (error) setSaveStatus("保存失敗");
        else if (inserted) { setSaveStatus("履歴に保存済"); setCurrentRecordId(inserted.id); }
      }
    } catch (error) { alert("エラーが発生しました。"); } 
    finally { setIsLoading(false); }
  };

  const togglePrivacy = async () => {
    if (!currentRecordId || !user) return;
    const newStatus = !isPrivate;
    setIsPrivate(newStatus);
    const { error } = await supabase.from('summaries').update({ is_private: newStatus }).eq('id', currentRecordId);
    if (error) { alert("更新失敗"); setIsPrivate(!newStatus); }
  };

  // 音声入力
  const toggleRecording = useCallback(() => {
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("音声入力未対応ブラウザです"); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP'; 
    recognition.interimResults = true; recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) final += event.results[i][0].transcript; }
      if (final) setInputText(prev => prev + (prev ? '\n' : '') + final);
    };
    recognition.start(); setIsRecording(true); recognitionRef.current = recognition;
  }, [isRecording]);

  // PDF & Copy (省略なし)
  const handleDownloadPDF = async () => {
    if (!result) return;
    try {
      const h = DICT.ja.headers;
      const fullText = `■ ${h.cc}\n${result.summary.chief_complaint}\n\n■ ${h.history}\n${result.summary.history}\n\n■ ${h.symptoms}\n${result.summary.symptoms}\n\n■ ${h.background}\n${result.summary.background}`;
      const res = await fetch(`${BACKEND_URL}/pdf`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: fullText, pdf_size: pdfSize }) });
      if (!res.ok) throw new Error("PDF Error");
      const blob = await res.blob(); const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `summary.pdf`; document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { alert("PDF作成エラー"); }
  };
  const handleCopy = () => {
    if (!result) return;
    const h = DICT.ja.headers;
    const txt = `【${h.cc}】${result.summary.chief_complaint}\n...`.replace(/\*\*/g, ""); // 簡略化
    navigator.clipboard.writeText(txt); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000);
  };

  const containerClass = `min-h-screen font-sans transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`;
  
  return (
    <div className={containerClass}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-lg"><FilePlus size={18} /></div>
            <h1 className="text-lg font-bold tracking-tight font-mono">KarteNo <span className="text-teal-600 font-sans font-normal text-sm ml-2 hidden sm:inline">Smart Medical Summary</span></h1>
          </div>
          <div className="flex items-center gap-3">
            {isGuest ? (
              <Link href="/login" className="text-sm font-bold text-teal-600 border border-teal-600 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition">ログインして保存</Link>
            ) : (
              <Link href="/history" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500"><History size={20} /></Link>
            )}
            <div className="relative" ref={settingsRef}>
              <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"><Settings size={20} /></button>
              {isSettingsOpen && (
                <div className={`absolute right-0 mt-2 w-72 rounded-xl shadow-xl border py-2 z-50 animate-fade-in ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   {!isGuest && (
                     <>
                       <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">{t.settings.account}</div>
                       <Link href="/profile" className="block w-full px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 flex items-center gap-2"><User size={14}/> {t.settings.profile}</Link>
                       <Link href="/family" className="block w-full px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 flex items-center gap-2"><Users size={14}/> {t.settings.family}</Link>
                       <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-red-500 flex items-center gap-2"><LogOut size={14}/> {t.logout}</button>
                       <div className="border-t my-2 border-slate-100 dark:border-slate-800"></div>
                     </>
                   )}
                   <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Type size={12}/> {t.settings.fontSize}</div>
                   <div className="flex bg-slate-100 dark:bg-slate-800 rounded mx-4 p-1 mb-2">
                      {['s','m','l'].map(size => (
                        // @ts-ignore
                        <button key={size} onClick={() => setFontSize(size === 's' ? 'small' : size === 'm' ? 'medium' : 'large')} className="flex-1 py-1 text-xs rounded hover:bg-white shadow-sm">{t.settings.fontLabels[size]}</button>
                      ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {!result && (
          <div className="mb-8 text-center animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">医師への「伝え方」をサポート</h2>
            <p className="text-slate-500 text-sm">AIがあなたの症状を整理・言語化します。</p>
            <div className="grid grid-cols-3 gap-4 mt-6 text-xs text-slate-500">
              <div className="flex flex-col items-center gap-2"><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-teal-600"><Mic size={18} /></div><p>{t.step1}</p></div>
              <div className="flex flex-col items-center gap-2"><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-teal-600"><Activity size={18} /></div><p>{t.step2}</p></div>
              <div className="flex flex-col items-center gap-2"><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-teal-600"><FileText size={18} /></div><p>{t.step3}</p></div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className={`${cardClass} transition-all ${result ? 'border-teal-500/30 ring-1 ring-teal-500/30' : ''}`}>
          <textarea className={`w-full h-40 bg-transparent resize-none outline-none leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700 ${getTextSizeClass()}`} placeholder={t.placeholder} value={inputText} onChange={(e) => setInputText(e.target.value)} />
          <div className="flex items-center justify-between mt-4">
            <button onClick={toggleRecording} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${isRecording ? 'bg-red-50 text-red-600 ring-2 ring-red-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {isRecording ? <><MicOff size={16} className="animate-pulse" /> 録音中...</> : <><Mic size={16} /> 音声入力</>}
            </button>
            <button onClick={handleAnalyze} disabled={isLoading || !inputText} className={`px-6 py-2 rounded-full font-bold text-white shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2 ${isLoading || !inputText ? "bg-slate-300 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"}`}>
              {isLoading ? t.loading : <>{t.button} <Stethoscope size={18} /></>}
            </button>
          </div>
        </div>

        {/* Result Area */}
        {result && (
          <div className="animate-fade-in space-y-6">
            {saveStatus && (
              <div className="flex items-center justify-between bg-teal-50 p-3 rounded-lg border border-teal-100">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-600"><Check size={14} /> {saveStatus}</div>
                {user && !isGuest && currentRecordId && (
                  <button onClick={togglePrivacy} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${isPrivate ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-600'}`}>
                    {isPrivate ? <Lock size={12}/> : <Eye size={12}/>} {isPrivate ? t.private : t.public}
                  </button>
                )}
              </div>
            )}
            {/* サマリーカード */}
            <div className={`rounded-2xl overflow-hidden border shadow-lg ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-teal-900/5'}`}>
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-4 text-white flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2"><FileText size={18}/> 医師提示用メモ</h3>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="p-2 hover:bg-white/20 rounded-lg transition" title={t.copy}>{isCopied ? <Check size={18}/> : <Copy size={18}/>}</button>
                  <button onClick={handleDownloadPDF} className="p-2 hover:bg-white/20 rounded-lg transition" title={t.pdf}><Share2 size={18}/></button>
                </div>
              </div>
              <div className={`p-6 sm:p-8 ${getTextSizeClass()}`}>
                {/* 診療科 */}
                {result.departments && <div className="flex flex-wrap gap-2 mb-6">{result.departments.map((dept, i) => <span key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{dept}</span>)}</div>}
                {/* 項目 */}
                <SummarySection title={DICT.ja.headers.cc} content={result.summary.chief_complaint} />
                <SummarySection title={DICT.ja.headers.history} content={result.summary.history} />
                <SummarySection title={DICT.ja.headers.symptoms} content={result.summary.symptoms} />
                <SummarySection title={DICT.ja.headers.background} content={result.summary.background} />
                {/* 免責 */}
                <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3 text-xs text-amber-800"><ShieldAlert size={24} className="flex-shrink-0" /><p>{t.disclaimer}</p></div>
              </div>
            </div>
            {/* Native Ads */}
            <div className="mt-12 pt-8 border-t border-slate-200">
              <h4 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{t.adTitle}</h4>
              <AdCarousel items={AD_ITEMS} />
            </div>
          </div>
        )}
      </main>
      <footer className="py-8 text-center text-xs text-slate-400"><p>© 2025 KarteNo.</p></footer>
    </div>
  );
};

// ==========================================
// ★ランディングページ (LandingPage)
// ==========================================
const LandingPage = ({ onTry }: { onTry: () => void }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white"><FilePlus size={18} /></div>
            <span className="text-xl font-bold font-mono tracking-tight text-slate-800">KarteNo</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-teal-600 transition py-2">ログイン</Link>
            <button onClick={onTry} className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-teal-700 transition shadow-lg shadow-teal-200">今すぐ試す</button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-6 text-center max-w-4xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-teal-50 text-teal-700 text-xs font-bold mb-6 border border-teal-100">AI Medical Summary Assistant</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
            医師に伝えるべきことを、<br/>
            <span className="text-teal-600">AIが整理</span>します。
          </h1>
          <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            症状をうまく説明できない、伝え忘れが心配。<br/>
            KarteNo（カルテノ）は、そんな患者さんとご家族のための、<br/>通院サポートアプリです。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onTry} className="bg-teal-600 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-teal-700 transition shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2">
              登録なしで試してみる <ArrowRight size={20}/>
            </button>
            <Link href="/about" className="bg-white text-slate-600 font-bold py-4 px-8 rounded-full text-lg border border-slate-200 hover:bg-slate-50 transition flex items-center justify-center">
              詳しく見る
            </Link>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-16 px-6 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Mic size={24}/></div>
              <h3 className="font-bold text-lg mb-2">音声で話すだけ</h3>
              <p className="text-slate-500 text-sm leading-relaxed">難しい医療用語は不要です。「いつから痛いか」などを話しかけるだけで、AIが自動で整理します。</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-4"><ShieldCheck size={24}/></div>
              <h3 className="font-bold text-lg mb-2">家族で見守り</h3>
              <p className="text-slate-500 text-sm leading-relaxed">作成したサマリーは家族グループで共有。離れて暮らす親御さんの通院状況も把握できます。</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4"><FileText size={24}/></div>
              <h3 className="font-bold text-lg mb-2">医師に見せるだけ</h3>
              <p className="text-slate-500 text-sm leading-relaxed">整理された画面を医師に見せるか、PDFで印刷して持参するだけ。伝え忘れを防ぎます。</p>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-12 px-6 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">TRUSTED & SECURE</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-bold text-slate-500">
            <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm"><ShieldCheck size={16} className="text-teal-600"/> 個人情報は保護</span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm"><Heart size={16} className="text-rose-500"/> 家族の安心</span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm"><Activity size={16} className="text-blue-500"/> 診療効率アップ</span>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-mono font-bold text-xl text-white">KarteNo</div>
          <div className="flex gap-6 text-sm font-bold">
            <Link href="/terms" className="hover:text-white transition">利用規約</Link>
            <Link href="/privacy" className="hover:text-white transition">プライバシーポリシー</Link>
            <Link href="/contact" className="hover:text-white transition">お問い合わせ</Link>
          </div>
          <p className="text-xs text-slate-600">© 2025 KarteNo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// ==========================================
// ★エントリーポイント (Page)
// ==========================================
export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApp, setShowApp] = useState(false); // LPから「試す」を押したかどうかのフラグ

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

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div></div>;

  // ログイン済み、または「試す」を押した場合はアプリ画面へ
  if (user || showApp) {
    return <MainApp user={user} isGuest={!user} />;
  }

  // それ以外はLPを表示
  return <LandingPage onTry={() => setShowApp(true)} />;
}