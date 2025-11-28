"use client";

import { useState, useEffect, useRef } from "react";

// ▼ 太字表示用コンポーネント
const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;
  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {text.split('\n').map((line, i) => (
        <p key={i} className="min-h-[1em]">
          {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              // ダークモード対応のためクラス指定を修正（色は親に依存させるか、明示的に指定）
              return <strong key={j} className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-1 rounded">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      ))}
    </div>
  );
};

// ▼ 言語データ
const DICT = {
  ja: { 
    label: "日本語", button: "医師に見せる画面を作成", loading: "AIがカルテを作成中...", copy: "コピー", copied: "完了", share: "LINE等で送る", pdf: "PDFで保存", explanationTitle: "患者様への確認メモ",
    guideTitle: "このツールの使い方は？",
    step1: "下の入力欄に、今の症状や辛いことを自由に書いてください。（箇条書きでも、話し言葉でもOKです）",
    step2: "「医師に見せる画面を作成」ボタンを押して、数秒待ちます。",
    step3: "整理された「医師提示用サマリー」が表示されます。そのまま医師に画面を見せるか、コピーしてWeb問診票に貼り付けてください。",
    settings: { title: "設定", lang: "言語", appearance: "表示設定", fontSize: "文字サイズ", theme: "テーマ", pdfSize: "PDFサイズ" }
  },
  en: { 
    label: "English", button: "Create Medical Summary", loading: "AI is thinking...", copy: "Copy", copied: "Copied", share: "Share", pdf: "Save as PDF", explanationTitle: "Note for you",
    guideTitle: "How to use this tool?",
    step1: "Describe your symptoms freely in the box below.",
    step2: "Tap 'Create Medical Summary' and wait a moment.",
    step3: "Show the summary to your doctor or copy it to a web form.",
    settings: { title: "Settings", lang: "Language", appearance: "Appearance", fontSize: "Font Size", theme: "Theme", pdfSize: "PDF Size" }
  },
  zh: { 
    label: "中文", button: "生成病历摘要", loading: "AI正在思考...", copy: "复制", copied: "已复制", share: "分享", pdf: "保存PDF", explanationTitle: "给您的确认",
    guideTitle: "如何使用？",
    step1: "在下方输入框中自由描述您的症状。",
    step2: "点击“生成病历摘要”按钮并稍候。",
    step3: "向医生展示摘要或复制内容。",
    settings: { title: "设置", lang: "语言", appearance: "外观", fontSize: "字体大小", theme: "主题", pdfSize: "PDF尺寸" }
  },
  vi: { 
    label: "Tiếng Việt", button: "Tạo tóm tắt", loading: "AI đang suy nghĩ...", copy: "Sao chép", copied: "Đã sao chép", share: "Chia sẻ", pdf: "Lưu PDF", explanationTitle: "Ghi chú cho bạn",
    guideTitle: "Cách sử dụng?",
    step1: "Mô tả triệu chứng của bạn vào ô bên dưới.",
    step2: "Nhấn nút 'Tạo tóm tắt' và đợi một chút.",
    step3: "Đưa bản tóm tắt cho bác sĩ hoặc sao chép.",
    settings: { title: "Cài đặt", lang: "Ngôn ngữ", appearance: "Giao diện", fontSize: "Cỡ chữ", theme: "Chủ đề", pdfSize: "Kích thước PDF" }
  },
};

type LangKey = keyof typeof DICT;
type Theme = 'light' | 'dark';
type FontSize = 'small' | 'medium' | 'large';
type PdfSize = 'A4' | 'B5' | 'Receipt';

// ▼ メインコンポーネント
export default function Home() {
  const [lang, setLang] = useState<LangKey>("ja");
  const [theme, setTheme] = useState<Theme>('light');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [pdfSize, setPdfSize] = useState<PdfSize>('A4');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<{summary: string, explanation: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  
  const settingsRef = useRef<HTMLDivElement>(null);
  const t = DICT[lang];

  useEffect(() => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      setCanShare(true);
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // フォントサイズのクラス計算
  const getTextSizeClass = () => {
    switch(fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const handleAnalyze = async () => {
    if (!inputText) return;
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("https://medical-backend-92rr.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, language: t.label }),
      });
      const data = await response.json();
      setResult(data); 
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました / Error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    try {
      const response = await fetch("https://medical-backend-92rr.onrender.com/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ★選択されたPDFサイズを送る
        body: JSON.stringify({ text: result.summary, pdf_size: pdfSize }), 
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
    } catch (error) {
      alert("PDF作成に失敗しました / PDF Error");
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      await (navigator as any).share({
        title: 'Medical Summary',
        text: result.summary,
      });
    } catch (err) {
      console.log(err);
    }
  };

  // ダークモード用のクラス制御
  const mainClass = `min-h-screen font-sans pb-32 transition-colors duration-300 
    ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`;
  
  const cardClass = `rounded-2xl shadow-sm border p-6 mb-8 transition-colors duration-300
    ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`;

  const inputClass = `w-full h-40 p-4 rounded-xl outline-none resize-none transition-all
    ${getTextSizeClass()}
    ${theme === 'dark' 
      ? 'bg-slate-900 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500' 
      : 'bg-slate-50 border border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500'}`;

  const headerClass = `border-b sticky top-0 z-10 shadow-sm transition-colors duration-300
    ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`;

  return (
    <div className={mainClass}>
      <header className={headerClass}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">AI</div>
            <h1 className="text-lg font-bold">Medical Summary</h1>
          </div>
          
          {/* ▼ 設定アイコン */}
          <div className="relative" ref={settingsRef}>
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
              aria-label="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>

            {/* ▼ 拡張された設定メニュー */}
            {isSettingsOpen && (
              <div className={`absolute right-0 mt-2 w-64 rounded-lg shadow-xl border py-2 z-50 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                
                {/* 1. 言語設定 */}
                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t.settings.lang}</div>
                <div className="grid grid-cols-2 gap-1 px-2">
                  {(['ja', 'en', 'zh', 'vi'] as LangKey[]).map((l) => (
                    <button key={l} onClick={() => setLang(l)} className={`text-sm px-2 py-1.5 rounded ${lang === l ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                      {l === 'ja' ? '🇯🇵' : l === 'en' ? '🇺🇸' : l === 'zh' ? '🇨🇳' : '🇻🇳'} {l.toUpperCase()}
                    </button>
                  ))}
                </div>
                
                <div className={`border-t my-2 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}></div>

                {/* 2. 表示設定（フォント・テーマ） */}
                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t.settings.appearance}</div>
                
                {/* 文字サイズ */}
                <div className="px-4 py-1 flex items-center justify-between">
                  <span className="text-sm">{t.settings.fontSize}</span>
                  <div className="flex bg-slate-100 dark:bg-slate-700 rounded p-1">
                    <button onClick={() => setFontSize('small')} className={`px-2 py-0.5 text-xs rounded ${fontSize === 'small' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>小</button>
                    <button onClick={() => setFontSize('medium')} className={`px-2 py-0.5 text-xs rounded ${fontSize === 'medium' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>中</button>
                    <button onClick={() => setFontSize('large')} className={`px-2 py-0.5 text-xs rounded ${fontSize === 'large' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>大</button>
                  </div>
                </div>

                {/* テーマ */}
                <div className="px-4 py-1 flex items-center justify-between">
                  <span className="text-sm">{t.settings.theme}</span>
                  <div className="flex bg-slate-100 dark:bg-slate-700 rounded p-1">
                    <button onClick={() => setTheme('light')} className={`px-2 py-0.5 text-xs rounded ${theme === 'light' ? 'bg-white shadow text-yellow-600' : ''}`}>☀️</button>
                    <button onClick={() => setTheme('dark')} className={`px-2 py-0.5 text-xs rounded ${theme === 'dark' ? 'bg-slate-600 shadow text-purple-300' : ''}`}>🌙</button>
                  </div>
                </div>

                <div className={`border-t my-2 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}></div>

                {/* 3. PDF設定 */}
                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t.settings.pdfSize}</div>
                <div className="px-4 pb-2 flex gap-2">
                  {(['A4', 'B5', 'Receipt'] as PdfSize[]).map((s) => (
                    <button key={s} onClick={() => setPdfSize(s)} className={`text-xs px-2 py-1 border rounded ${pdfSize === s ? 'border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-300 dark:border-slate-600'}`}>
                      {s}
                    </button>
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* 使い方ガイド */}
        <div className="mb-8">
          <details className={`group border rounded-xl shadow-sm open:shadow-md transition-all duration-200 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-blue-100'}`}>
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none font-bold select-none">
              <span className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">?</span>
                {t.guideTitle}
              </span>
              <span className="transition-transform group-open:rotate-180 opacity-50">▼</span>
            </summary>
            <div className={`px-4 pb-6 pt-2 border-t text-sm space-y-3 ${theme === 'dark' ? 'border-slate-700 text-slate-300' : 'border-slate-50 text-slate-600'}`}>
              <div className="flex items-start gap-3">
                <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded flex-shrink-0">STEP 1</span>
                <p>{t.step1}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded flex-shrink-0">STEP 2</span>
                <p>{t.step2}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded flex-shrink-0">STEP 3</span>
                <p>{t.step3}</p>
              </div>
            </div>
          </details>
        </div>

        {/* 入力エリア */}
        <div className={cardClass}>
          <textarea
            className={inputClass}
            placeholder={lang === 'ja' ? "（例）昨日の夜からお腹が痛い..." : "(Ex) I have a stomach ache..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            onClick={handleAnalyze} disabled={isLoading || !inputText}
            className={`mt-4 w-full py-4 px-6 rounded-xl font-bold text-white text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${isLoading || !inputText ? "bg-slate-300 dark:bg-slate-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {isLoading ? t.loading : `✨ ${t.button}`}
          </button>
        </div>

        {/* 結果表示エリア */}
        {result && (
          <div className="animate-fade-in-up space-y-6">
            
            <div className={`rounded-2xl shadow-lg border-2 overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-blue-100'}`}>
              <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-blue-50 border-blue-100'}`}>
                <h3 className={`font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>✅ {t.settings.lang === '言語' ? '医師提示用' : 'Summary'}</h3>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className={`text-xs border px-3 py-1.5 rounded-lg font-bold transition ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-blue-300 hover:bg-slate-700' : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'}`}>
                    {isCopied ? t.copied : t.copy}
                  </button>
                  {canShare && (
                    <button onClick={handleShare} className={`text-xs border px-3 py-1.5 rounded-lg font-bold transition ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-blue-300 hover:bg-slate-700' : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'}`}>
                      {t.share}
                    </button>
                  )}
                </div>
              </div>
              
              {/* 文字サイズ反映 */}
              <div className={`p-6 ${getTextSizeClass()}`}>
                <FormattedText text={result.summary} />
              </div>
              
              <div className={`px-6 py-4 border-t ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
                <button onClick={handleDownloadPDF} className={`w-full py-3 border font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                  📄 {t.pdf} ({pdfSize})
                </button>
              </div>
            </div>

            {/* 患者確認用メモ（表示条件は前回と同じ） */}
            {result.explanation && result.explanation.trim() !== "" && (
              <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'bg-amber-900/30 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'}`}>💡 {t.explanationTitle}</h3>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${theme === 'dark' ? 'text-amber-200' : 'text-amber-900'}`}>
                  {result.explanation}
                </p>
              </div>
            )}
            
          </div>
        )}
      </main>

      <footer className={`border-t py-8 text-center text-sm mt-12 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-500'}`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center gap-6 mb-4">
            <a href="/privacy" className="hover:text-blue-600 transition">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition">Terms</a>
            <a href="#" className="hover:text-blue-600 transition">Contact</a>
          </div>
          <p>© 2025 Medical Summary Assistant.</p>
        </div>
      </footer>
      
      {/* 広告スペース（ダークモード対応） */}
      <div className={`fixed bottom-0 left-0 w-full backdrop-blur-sm border-t p-2 z-50 flex justify-center ${theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className={`w-[320px] h-[50px] flex items-center justify-center text-xs rounded border ${theme === 'dark' ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
          Ads Area
        </div>
      </div>
      
      <div className="h-24"></div> 
    </div>
  );
}