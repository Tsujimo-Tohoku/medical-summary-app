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
  LogOut, History, ShieldAlert, Activity, Stethoscope, Globe, Type, Users, FilePlus, User
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://medical-backend-92rr.onrender.com";

// --- 言語・UI辞書 ---
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
      family: "家族設定", 
      profile: "プロフィール設定", // 追加
      account: "アカウント",
      fontLabels: { s: "小", m: "標準", l: "大" },
      themeLabels: { light: "ライト", dark: "ダーク" }
    },
    placeholder: "（例）\n・昨日の夜から右のお腹がズキズキ痛い\n・熱は37.8度で、少し吐き気がある\n・歩くと響くような痛みがある\n・普段、高血圧の薬を飲んでいる",
    recommend: "関連する診療科の例（参考）",
    headers: { cc: "主訴", history: "現病歴", symptoms: "随伴症状", background: "既往歴・服薬" },
    disclaimer: "※本結果はAIによる自動生成であり、医師による診断ではありません。参考情報としてご利用いただき、必ず医療機関を受診してください。",
    login: "ログイン", logout: "ログアウト", history: "履歴",
    adTitle: "ご家族の安心のために"
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
      family: "Family Settings", 
      profile: "Profile Settings", // 追加
      account: "Account",
      fontLabels: { s: "Small", m: "Medium", l: "Large" },
      themeLabels: { light: "Light", dark: "Dark" }
    },
    placeholder: "(Ex) I have a throbbing pain in my right stomach since last night...",
    recommend: "Related Departments (Ref)",
    headers: { cc: "Chief Complaint", history: "History of Present Illness", symptoms: "Associated Symptoms", background: "Past History / Medication" },
    disclaimer: "* This is AI-generated text, not a medical diagnosis. Please consult a doctor.",
    login: "Login", logout: "Logout", history: "History",
    adTitle: "Recommended Services"
  },
  zh: { 
    label: "中文", button: "生成病历摘要", loading: "AI正在整理症状...", copy: "复制", copied: "已复制", share: "分享", pdf: "保存PDF", explanationTitle: "给您的确认",
    guideTitle: "如何使用？",
    step1: "在下方描述您的症状。也可以使用语音输入。",
    step2: "点击“生成病历摘要”。",
    step3: "向医生展示摘要。",
    settings: { 
      title: "设置", lang: "语言", appearance: "外观", 
      fontSize: "字体大小", theme: "主题", pdfSize: "PDF尺寸",
      family: "家庭设置", 
      profile: "个人资料设置", // 追加
      account: "帐户",
      fontLabels: { s: "小", m: "中", l: "大" },
      themeLabels: { light: "浅色", dark: "深色" }
    },
    placeholder: "（例）从昨天晚上开始右腹部疼痛...",
    recommend: "相关科室示例（参考）",
    headers: { cc: "主诉", history: "现病史", symptoms: "伴随症状", background: "既往史/服药" },
    disclaimer: "※此结果由AI生成，非医生诊断。仅供参考，请务必就医。",
    login: "登录", logout: "登出", history: "历史记录",
    adTitle: "推荐服务"
  },
  vi: { 
    label: "Tiếng Việt", button: "Tạo tóm tắt", loading: "AI đang sắp xếp triệu chứng...", copy: "Sao chép", copied: "Đã sao chép", share: "Chia sẻ", pdf: "Lưu PDF", explanationTitle: "Ghi chú cho bạn",
    guideTitle: "Cách sử dụng?",
    step1: "Mô tả triệu chứng bên dưới. Có thể dùng giọng nói.",
    step2: "Nhấn nút 'Tạo tóm tắt'.",
    step3: "Đưa bản tóm tắt cho bác sĩ.",
    settings: { 
      title: "Cài đặt", lang: "Ngôn ngữ", appearance: "Giao diện", 
      fontSize: "Cỡ chữ", theme: "Chủ đề", pdfSize: "Kích thước PDF",
      family: "Cài đặt gia đình", 
      profile: "Cài đặt hồ sơ", // 追加
      account: "Tài khoản",
      fontLabels: { s: "Nhỏ", m: "Vừa", l: "Lớn" },
      themeLabels: { light: "Sáng", dark: "Tối" }
    },
    placeholder: "(Ví dụ) Tôi bị đau bụng bên phải từ tối qua...",
    recommend: "Các khoa liên quan (Tham khảo)",
    headers: { cc: "Lý do đến khám", history: "Bệnh sử", symptoms: "Triệu chứng kèm theo", background: "Tiền sử bệnh / Thuốc" },
    disclaimer: "* Đây là văn bản do AI tạo ra, không phải chẩn đoán y tế. Vui lòng tham khảo ý kiến bác sĩ.",
    login: "Đăng nhập", logout: "Đăng xuất", history: "Lịch sử",
    adTitle: "Dịch vụ được đề xuất"
  },
};

type LangKey = keyof typeof DICT;
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

// 整形テキスト表示用コンポーネント
const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;
  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {text.split(/(\*\*.*?\*\*)/).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="text-teal-700 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-900/30 px-1 rounded">{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </p>
  );
};

// サマリー表示セクション
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

  useEffect(() => {
    // OS設定の反映
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    // ユーザー認証チェック
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // 設定メニュー外クリックで閉じる
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
    recognition.lang = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-CN' : 'vi-VN';
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

  const getTextSizeClass = () => {
    switch(fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-xl'; // 高齢者向けに大きく
      default: return 'text-base';
    }
  };

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
      alert("エラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    try {
      const h = DICT.ja.headers;
      const fullText = `■ ${h.cc}\n${result.summary.chief_complaint}\n\n■ ${h.history}\n${result.summary.history}\n\n■ ${h.symptoms}\n${result.summary.symptoms}\n\n■ ${h.background}\n${result.summary.background}`;
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

  const handleCopy = () => {
    if (!result) return;
    const h = DICT.ja.headers;
    const textToCopy = `【${h.cc}】${result.summary.chief_complaint}\n【${h.history}】${result.summary.history}\n【${h.symptoms}】${result.summary.symptoms}\n【${h.background}】${result.summary.background}`.replace(/\*\*/g, "");
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const containerClass = `min-h-screen font-sans transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`;
  const cardClass = `rounded-2xl shadow-sm border p-6 mb-8 transition-all duration-300 relative ${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200 shadow-slate-200/50'}`;
  
  // 医師用ヘッダーは日本語固定
  const docHeaders = DICT.ja.headers;

  return (
    <div className={containerClass}>
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
              <FilePlus size={18} />
            </div>
            {/* アプリ名をKarteNoに変更 */}
            <h1 className="text-lg font-bold tracking-tight font-mono">
              KarteNo <span className="text-teal-600 font-sans font-normal text-sm ml-2 hidden sm:inline tracking-normal">Smart Medical Summary</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/history" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500">
                <History size={20} />
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-bold text-teal-600 hover:text-teal-700">
                {t.login}
              </Link>
            )}

            <div className="relative" ref={settingsRef}>
              <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition">
                <Settings size={20} />
              </button>
              
              {isSettingsOpen && (
                <div className={`absolute right-0 mt-2 w-72 rounded-xl shadow-xl border py-2 z-50 animate-fade-in ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   {/* アカウント・家族設定 (翻訳適用) */}
                   <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">{t.settings.account}</div>
                   {user ? (
                      <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-red-500"><LogOut size={14}/> {t.logout}</button>
                   ) : (
                      <Link href="/login" className="block w-full px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-teal-600">{t.login}</Link>
                   )}
                   {/* プロフィール設定リンク (追加) */}
                   <Link href="/profile" className="block w-full px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                     <User size={14}/> {t.settings.profile}
                   </Link>
                   <Link href="/family" className="block w-full px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                     <Users size={14}/> {t.settings.family}
                   </Link>
                   
                   <div className="border-t my-2 border-slate-100 dark:border-slate-800"></div>
                   
                   {/* 言語設定 */}
                   <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Globe size={12}/> {t.settings.lang}</div>
                   <div className="grid grid-cols-2 gap-1 px-4 mb-2">
                      {(['ja', 'en', 'zh', 'vi'] as LangKey[]).map((l) => (
                        <button key={l} onClick={() => setLang(l)} className={`text-xs px-2 py-1.5 rounded ${lang === l ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}>
                          {l === 'ja' ? '🇯🇵 日本語' : l === 'en' ? '🇺🇸 English' : l === 'zh' ? '🇨🇳 中文' : '🇻🇳 Tiếng Việt'}
                        </button>
                      ))}
                   </div>

                   <div className="border-t my-2 border-slate-100 dark:border-slate-800"></div>

                   {/* 文字サイズ (翻訳適用) */}
                   <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Type size={12}/> {t.settings.fontSize}</div>
                   <div className="flex bg-slate-100 dark:bg-slate-800 rounded mx-4 p-1 mb-2">
                      <button onClick={() => setFontSize('small')} className={`flex-1 py-1 text-xs rounded ${fontSize === 'small' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>{t.settings.fontLabels.s}</button>
                      <button onClick={() => setFontSize('medium')} className={`flex-1 py-1 text-xs rounded ${fontSize === 'medium' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>{t.settings.fontLabels.m}</button>
                      <button onClick={() => setFontSize('large')} className={`flex-1 py-1 text-xs rounded ${fontSize === 'large' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>{t.settings.fontLabels.l}</button>
                   </div>
                   
                   {/* テーマ (翻訳適用) */}
                   <div className="flex gap-2 px-4 mt-3">
                     <button onClick={() => setTheme('light')} className={`flex-1 py-1 text-xs border rounded ${theme === 'light' ? 'bg-slate-100 border-slate-300' : 'border-slate-700'}`}>☀️ {t.settings.themeLabels.light}</button>
                     <button onClick={() => setTheme('dark')} className={`flex-1 py-1 text-xs border rounded ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'border-slate-200'}`}>🌙 {t.settings.themeLabels.dark}</button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {!result && (
          <div className="mb-8 text-center animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">医師への「伝え方」をサポート</h2>
            <p className="text-slate-500 text-sm">AIがあなたの症状を整理・言語化します。</p>
            
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

        <div className={`${cardClass} transition-all ${result ? 'border-teal-500/30 ring-1 ring-teal-500/30' : ''}`}>
          <textarea
            className={`w-full h-40 bg-transparent resize-none outline-none leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700 ${getTextSizeClass()}`}
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

        {result && (
          <div className="animate-fade-in space-y-6">
            
            {saveStatus && (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/20 py-2 rounded-lg">
                <Check size={14} /> {saveStatus}
              </div>
            )}

            <div className={`rounded-2xl overflow-hidden border shadow-lg ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-teal-900/5'}`}>
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-4 text-white flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2"><FileText size={18}/> 医師提示用メモ</h3>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="p-2 hover:bg-white/20 rounded-lg transition" title={t.copy}>
                    {isCopied ? <Check size={18}/> : <Copy size={18}/>}
                  </button>
                  <button onClick={handleDownloadPDF} className="p-2 hover:bg-white/20 rounded-lg transition" title={t.pdf}>
                    <Share2 size={18}/>
                  </button>
                </div>
              </div>

              <div className={`p-6 sm:p-8 ${getTextSizeClass()}`}>
                {result.departments && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {result.departments.map((dept, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {dept}
                      </span>
                    ))}
                  </div>
                )}

                {/* ここは日本語の docHeaders を固定で使用 */}
                <SummarySection title={docHeaders.cc} content={result.summary.chief_complaint} />
                <SummarySection title={docHeaders.history} content={result.summary.history} />
                <SummarySection title={docHeaders.symptoms} content={result.summary.symptoms} />
                <SummarySection title={docHeaders.background} content={result.summary.background} />

                <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-lg flex gap-3 text-xs text-amber-800 dark:text-amber-400">
                  <ShieldAlert size={24} className="flex-shrink-0" />
                  <p>{t.disclaimer}</p>
                </div>
              </div>
            </div>

            {result.explanation && (
              <div className="p-6 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-500 mb-3 flex items-center gap-2">
                  💡 {t.explanationTitle}
                </h3>
                <p className={`leading-relaxed text-slate-600 dark:text-slate-400 ${getTextSizeClass()}`}>
                  {result.explanation}
                </p>
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                {t.adTitle}
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <a href="#" className="block p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-colors group">
                  <div className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-1 group-hover:text-teal-600">見守りサービス</div>
                  <p className="text-xs text-slate-500">離れて暮らすご家族の通院状況を共有。安心を届けます。</p>
                </a>
                <a href="#" className="block p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-colors group">
                  <div className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-1 group-hover:text-teal-600">宅食サービス</div>
                  <p className="text-xs text-slate-500">健康的な食事をご自宅へお届け。塩分控えめメニューも。</p>
                </a>
              </div>
            </div>

          </div>
        )}
      </main>

      <footer className="py-8 text-center text-xs text-slate-400">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/privacy" className="hover:text-teal-600 transition">Privacy</Link>
          <Link href="/terms" className="hover:text-teal-600 transition">Terms</Link>
        </div>
        <p>© 2025 KarteNo.</p>
      </footer>
    </div>
  );
}