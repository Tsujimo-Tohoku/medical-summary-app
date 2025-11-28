"use client";

import { useState } from "react";

// 言語設定データ
const DICT = {
  ja: {
    label: "日本語",
    title: "医師に「正しく」伝わるメモを。",
    desc: "AIがあなたの症状を整理し、医師提示用のカルテを作成します。",
    placeholder: "（例）昨日の夜からお腹が痛い。熱が38度ある...",
    button: "医師に見せる画面を作成",
    loading: "AIがカルテを作成中...",
    resultTitle: "医師提示用サマリー",
    copy: "テキストをコピー",
    copied: "コピーしました！",
    share: "共有する",
    pdf: "PDFで保存",
    privacy: "個人情報は保存されません",
  },
  en: {
    label: "English",
    title: "Explain your symptoms correctly.",
    desc: "AI organizes your symptoms into a medical summary for Japanese doctors.",
    placeholder: "(Ex) I have had a stomach ache since last night...",
    button: "Create Medical Summary",
    loading: "AI is thinking...",
    resultTitle: "Medical Summary",
    copy: "Copy Text",
    copied: "Copied!",
    share: "Share",
    pdf: "Save as PDF",
    privacy: "No personal data is stored.",
  },
  zh: {
    label: "中文",
    title: "准确向医生传达您的症状。",
    desc: "AI将您的症状整理成日本医生可读的病历摘要。",
    placeholder: "（例）从昨天晚上开始肚子疼...",
    button: "生成病历摘要",
    loading: "AI正在思考...",
    resultTitle: "医生用摘要",
    copy: "复制文本",
    copied: "已复制！",
    share: "分享",
    pdf: "保存PDF",
    privacy: "不保存个人信息。",
  },
  vi: {
    label: "Tiếng Việt",
    title: "Truyền đạt triệu chứng chính xác.",
    desc: "AI sẽ tóm tắt triệu chứng của bạn cho bác sĩ Nhật Bản.",
    placeholder: "(Ví dụ) Tôi bị đau bụng từ tối qua...",
    button: "Tạo tóm tắt y tế",
    loading: "AI đang suy nghĩ...",
    resultTitle: "Tóm tắt cho bác sĩ",
    copy: "Sao chép",
    copied: "Đã sao chép!",
    share: "Chia sẻ",
    pdf: "Lưu PDF",
    privacy: "Không lưu trữ thông tin cá nhân.",
  },
};

type LangKey = keyof typeof DICT;

export default function Home() {
  const [lang, setLang] = useState<LangKey>("ja"); // 言語状態
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const t = DICT[lang]; // 現在の言語のテキストを取得

  // 分析ボタン
  const handleAnalyze = async () => {
    if (!inputText) return;
    setIsLoading(true);
    setResult("");

    try {
      const response = await fetch("https://medical-backend-92rr.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: inputText,
          language: t.label // 選択された言語名をバックエンドに送る
        }),
      });
      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error(error);
      alert("Error / エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // PDF保存
  const handleDownloadPDF = async () => {
    if (!result) return;
    try {
      const response = await fetch("https://medical-backend-92rr.onrender.com/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: result }),
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

  // テキストコピー機能
  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 共有機能（スマホのみ対応）
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Medical Summary',
          text: result,
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      alert("お使いのブラウザは共有機能に対応していません / Not supported");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-32">
      
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">AI</div>
            <h1 className="text-lg font-bold text-slate-800 hidden md:block">Medical Summary</h1>
          </div>
          
          {/* 言語切り替えボタン */}
          <select 
            className="bg-slate-100 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            value={lang}
            onChange={(e) => setLang(e.target.value as LangKey)}
          >
            <option value="ja">🇯🇵 日本語</option>
            <option value="en">🇺🇸 English</option>
            <option value="zh">🇨🇳 中文</option>
            <option value="vi">🇻🇳 Tiếng Việt</option>
          </select>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 text-slate-800">{t.title}</h2>
          <p className="text-slate-600">{t.desc}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <textarea
            className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-700 text-base"
            placeholder={t.placeholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !inputText}
            className={`mt-4 w-full py-4 px-6 rounded-xl font-bold text-white text-lg shadow-lg flex items-center justify-center gap-2 transition-all
              ${isLoading || !inputText ? "bg-slate-300" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {isLoading ? t.loading : `✨ ${t.button}`}
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">{t.privacy}</p>
        </div>

        {/* 結果表示 */}
        {result && (
          <div className="animate-fade-in-up bg-white rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
              <h3 className="font-bold text-blue-800">✅ {t.resultTitle}</h3>
              
              <div className="flex gap-2">
                {/* コピーボタン */}
                <button onClick={handleCopy} className="text-xs bg-white border border-blue-200 px-3 py-1.5 rounded-lg text-blue-600 font-bold hover:bg-blue-50 transition">
                  {isCopied ? t.copied : t.copy}
                </button>
                {/* 共有ボタン（モバイル用） */}
                <button onClick={handleShare} className="md:hidden text-xs bg-white border border-blue-200 px-3 py-1.5 rounded-lg text-blue-600 font-bold hover:bg-blue-50 transition">
                  {t.share}
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="prose prose-blue max-w-none whitespace-pre-wrap text-slate-800 leading-relaxed font-medium">
                {result}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
              <button
                onClick={handleDownloadPDF}
                className="w-full py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg shadow-sm hover:bg-slate-50 transition flex items-center justify-center gap-2"
              >
                📄 {t.pdf}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 広告スペース */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-sm border-t border-slate-200 p-2 z-50 flex justify-center">
        <div className="w-[320px] h-[50px] bg-slate-100 flex items-center justify-center text-xs text-slate-400 rounded border border-slate-200">
          Ads Area
        </div>
      </div>
    </div>
  );
}