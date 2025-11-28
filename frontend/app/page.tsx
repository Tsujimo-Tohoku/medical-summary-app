"use client";

import { useState } from "react";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 分析ボタンの処理
  const handleAnalyze = async () => {
    if (!inputText) return;
    setIsLoading(true);
    setResult("");

    try {
      const response = await fetch("https://medical-backend-92rr.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました。時間を置いて再試行してください。");
    } finally {
      setIsLoading(false);
    }
  };

  // PDFダウンロードボタンの処理
  const handleDownloadPDF = async () => {
    if (!result) return;
    
    try {
      const response = await fetch("https://medical-backend-92rr.onrender.com/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: result }),
      });

      if (!response.ok) throw new Error("PDF作成失敗");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "medical_summary.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error(error);
      alert("PDFダウンロードに失敗しました");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* --- ヘッダー（信頼感の象徴） --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 簡易ロゴアイコン */}
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              AI
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Medical Summary <span className="text-blue-600">Assistant</span>
            </h1>
          </div>
          <nav className="hidden md:flex gap-4 text-sm text-slate-600">
            <a href="#" className="hover:text-blue-600 transition">使い方</a>
            <a href="/privacy" className="hover:text-blue-600 transition">プライバシー</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-32">
        
        {/* --- ヒーローセクション（説明） --- */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3 text-slate-800">
            医師に「正しく」伝わるメモを、10秒で。
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            体調が悪いとき、言葉にするのは難しいものです。<br className="hidden md:inline"/>
            あなたの言葉をAIが整理し、医師が見やすい「カルテ形式」のサマリーを作成します。
          </p>
        </div>

        <div className="grid md:grid-cols-1 gap-8">
          
          {/* --- 入力エリア --- */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md">
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <span>🗣️</span> 今の症状を自由に書いてください
            </label>
            <textarea
              className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-slate-700 text-base leading-relaxed placeholder-slate-400 transition-all"
              placeholder="（例）&#13;&#10;・昨日の夜から急にお腹が痛くなった&#13;&#10;・熱を測ったら38.2度あった&#13;&#10;・食欲がなくてゼリーしか食べていない&#13;&#10;・普段、高血圧の薬を飲んでいる"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            
            <div className="mt-4">
              <button
                onClick={handleAnalyze}
                disabled={isLoading || !inputText}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2
                  ${isLoading || !inputText 
                    ? "bg-slate-300 cursor-not-allowed shadow-none" 
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200"}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    AIがカルテを作成中...
                  </>
                ) : (
                  <>
                    📝 医師に見せる画面を作成する
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-400 mt-3">
                ※個人情報は保存されません。AIが内容を整理します。
              </p>
            </div>
          </section>

          {/* --- 結果表示エリア --- */}
          {result && (
            <section className="animate-fade-in-up">
              <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
                  <h3 className="font-bold text-blue-800 flex items-center gap-2">
                    ✅ 医師提示用サマリー
                  </h3>
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-bold">
                    AI作成
                  </span>
                </div>
                
                <div className="p-6 md:p-8">
                  <div className="prose prose-blue max-w-none whitespace-pre-wrap text-slate-800 leading-relaxed font-medium">
                    {result}
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
                  <p className="text-xs text-slate-500">
                    この画面をそのまま医師や看護師にお見せください。
                  </p>
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full md:w-auto px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    PDFで保存する
                  </button>
                </div>
              </div>
            </section>
          )}

        </div>

      </main>

      {/* --- フッター --- */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center gap-6 mb-4">
            <a href="/privacy" className="hover:text-blue-600 transition">プライバシーポリシー</a>
            <a href="#" className="hover:text-blue-600 transition">利用規約</a>
            <a href="#" className="hover:text-blue-600 transition">お問い合わせ</a>
          </div>
          <p>© 2025 Medical Summary Assistant. All rights reserved.</p>
        </div>
      </footer>

      {/* --- 広告スペース（固定） --- */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-sm border-t border-slate-200 p-2 z-50">
        <div className="max-w-4xl mx-auto flex justify-center">
          <div className="w-[320px] h-[50px] bg-slate-100 flex items-center justify-center text-xs text-slate-400 rounded border border-slate-200">
            広告バナー領域 (320x50)
          </div>
        </div>
      </div>

    </div>
  );
}