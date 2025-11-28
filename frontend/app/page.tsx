"use client";

import { useState, useEffect } from "react";

// ▼ 太字(**文字**)をHTMLの太字に変換する表示用パーツ
const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;
  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {text.split('\n').map((line, i) => (
        <p key={i} className="min-h-[1em]">
          {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-blue-900 font-bold bg-blue-50 px-1 rounded">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      ))}
    </div>
  );
};

const DICT = {
  ja: { label: "日本語", button: "医師に見せる画面を作成", loading: "AIがカルテを作成中...", copy: "コピー", copied: "完了", share: "LINE等で送る", pdf: "PDFで保存", explanationTitle: "患者様への確認メモ" },
  en: { label: "English", button: "Create Medical Summary", loading: "AI is thinking...", copy: "Copy", copied: "Copied", share: "Share", pdf: "Save as PDF", explanationTitle: "Note for you" },
  zh: { label: "中文", button: "生成病历摘要", loading: "AI正在思考...", copy: "复制", copied: "已复制", share: "分享", pdf: "保存PDF", explanationTitle: "给您的确认" },
  vi: { label: "Tiếng Việt", button: "Tạo tóm tắt", loading: "AI đang suy nghĩ...", copy: "Sao chép", copied: "Đã sao chép", share: "Chia sẻ", pdf: "Lưu PDF", explanationTitle: "Ghi chú cho bạn" },
};

type LangKey = keyof typeof DICT;

export default function Home() {
  const [lang, setLang] = useState<LangKey>("ja");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<{summary: string, explanation: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const t = DICT[lang];

  // 起動時に「共有機能」が使えるかチェック
useEffect(() => {
    // (navigator as any) をつけて、「型チェックを無視」させます
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      setCanShare(true);
    }
  }, []);

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
      alert("Error / エラーが発生しました");
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
        body: JSON.stringify({ text: result.summary }), 
      });
      if (!response.ok) throw new Error("PDF Error");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "medical_summary.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert("PDF Error");
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
      await navigator.share({
        title: 'Medical Summary',
        text: result.summary,
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-32">
      {/* --- ヘッダー --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">AI</div>
            {/* ★修正: サイト名を常に表示 */}
            <h1 className="text-lg font-bold text-slate-800">Medical Summary</h1>
          </div>
          <select 
            className="bg-slate-100 border border-slate-300 text-slate-700 text-sm rounded-lg p-2"
            value={lang} onChange={(e) => setLang(e.target.value as LangKey)}
          >
            <option value="ja">🇯🇵 日本語</option>
            <option value="en">🇺🇸 English</option>
            <option value="zh">🇨🇳 中文</option>
            <option value="vi">🇻🇳 Tiếng Việt</option>
          </select>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ▼▼▼ 追加：使い方ガイド（ここから） ▼▼▼ */}
        <div className="mb-8">
          <details className="group bg-white border border-blue-100 rounded-xl shadow-sm open:shadow-md transition-all duration-200">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none text-slate-700 font-bold select-none">
              <span className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">?</span>
                このツールの使い方は？
              </span>
              <span className="transition-transform group-open:rotate-180 text-slate-400">▼</span>
            </summary>
            <div className="px-4 pb-6 pt-2 border-t border-slate-50 text-sm text-slate-600 space-y-3">
              <div className="flex items-start gap-3">
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">STEP 1</span>
                <p>下の入力欄に、今の症状や辛いことを自由に書いてください。（箇条書きでも、話し言葉でもOKです）</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">STEP 2</span>
                <p>「医師に見せる画面を作成」ボタンを押して、数秒待ちます。</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">STEP 3</span>
                <p>整理された「医師提示用サマリー」が表示されます。そのまま医師に画面を見せるか、コピーしてWeb問診票に貼り付けてください。</p>
              </div>
            </div>
          </details>
        </div>
        {/* ▲▲▲ 追加：使い方ガイド（ここまで） ▲▲▲ */}
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <textarea
            className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-700 text-base"
            placeholder={lang === 'ja' ? "（例）昨日の夜からお腹が痛い..." : "(Ex) I have a stomach ache..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            onClick={handleAnalyze} disabled={isLoading || !inputText}
            className={`mt-4 w-full py-4 px-6 rounded-xl font-bold text-white text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${isLoading || !inputText ? "bg-slate-300" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {isLoading ? t.loading : `✨ ${t.button}`}
          </button>
        </div>

        {/* 結果表示エリア */}
        {result && (
          <div className="animate-fade-in-up space-y-6">
            
            {/* 1. 医師提示用サマリー */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden">
              <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
                <h3 className="font-bold text-blue-800">✅ 医師提示用 / Medical Summary</h3>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="text-xs bg-white border border-blue-200 px-3 py-1.5 rounded-lg text-blue-600 font-bold hover:bg-blue-50 transition">
                    {isCopied ? t.copied : t.copy}
                  </button>
                  {/* ★復活: 共有ボタン (対応ブラウザのみ表示) */}
                  {canShare && (
                    <button onClick={handleShare} className="text-xs bg-white border border-blue-200 px-3 py-1.5 rounded-lg text-blue-600 font-bold hover:bg-blue-50 transition">
                      {t.share}
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6 text-slate-800">
                <FormattedText text={result.summary} />
              </div>
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                <button onClick={handleDownloadPDF} className="w-full py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg shadow-sm hover:bg-slate-50 transition flex items-center justify-center gap-2">
                  📄 {t.pdf}
                </button>
              </div>
            </div>

            {/* 2. 患者確認用メモ */}
            {result.explanation && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                <h3 className="font-bold text-amber-800 mb-2">💡 {t.explanationTitle}</h3>
                <p className="text-amber-900 text-sm leading-relaxed whitespace-pre-wrap">
                  {result.explanation}
                </p>
              </div>
            )}
            
          </div>
        )}
      </main>

      {/* --- ★復活: フッター --- */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-sm text-slate-500 mt-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center gap-6 mb-4">
            <a href="/privacy" className="hover:text-blue-600 transition">プライバシーポリシー</a>
            <a href="#" className="hover:text-blue-600 transition">利用規約</a>
            <a href="#" className="hover:text-blue-600 transition">お問い合わせ</a>
          </div>
          <p>© 2025 Medical Summary Assistant. All rights reserved.</p>
        </div>
      </footer>
      
      {/* 広告スペース */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-sm border-t border-slate-200 p-2 z-50 flex justify-center">
        <div className="w-[320px] h-[50px] bg-slate-100 flex items-center justify-center text-xs text-slate-400 rounded border border-slate-200">
          Ads Area
        </div>
      </div>
      
      {/* 広告の裏側が見えないように余白を確保 */}
      <div className="h-24"></div> 
    </div>
  );
}