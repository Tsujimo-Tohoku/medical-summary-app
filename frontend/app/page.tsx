"use client";

import { useState } from "react";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 分析ボタン
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
      alert("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // ★追加：PDFダウンロードボタン
  const handleDownloadPDF = async () => {
    if (!result) return;
    
    try {
      // APIに「この結果をPDFにして！」と依頼
      const response = await fetch("https://medical-backend-92rr.onrender.com/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: result }), // 診断結果を送る
      });

      if (!response.ok) throw new Error("PDF作成失敗");

      // バイナリデータ（ファイル）として受け取る
      const blob = await response.blob();
      
      // ダウンロードリンクを裏で作ってクリックさせる
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "medical_summary.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove(); // 後片付け

    } catch (error) {
      console.error(error);
      alert("PDFダウンロードに失敗しました");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-6">
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">🏥 症状伝え漏れ防止ツール</h1>
        
        {/* ★追加：正直な広告についての説明 */}
        <div className="text-xs text-gray-400 mb-4 bg-gray-100 p-2 rounded">
          ℹ️ 本ツールは無料提供継続のため、画面下部に広告を表示しています。
          皆様のプライバシーデータが広告業者に渡ることはありません。
        </div>

        <textarea
          className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-700"
          placeholder="（例）昨日の夜からお腹が痛い..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        <button
          onClick={handleAnalyze}
          disabled={isLoading || !inputText}
          className={`mt-4 w-full py-3 px-6 rounded-lg font-bold text-white transition-all
            ${isLoading || !inputText ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {isLoading ? "AIが思考中..." : "医師に見せる画面を作成"}
        </button>

        {result && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">✅ 医師提示用サマリー</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 whitespace-pre-wrap text-gray-800 font-medium">
              {result}
            </div>

            {/* ★追加：PDFダウンロードボタン */}
            <button
              onClick={handleDownloadPDF}
              className="mt-4 w-full py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors flex justify-center items-center gap-2"
            >
              📄 PDFとして保存（印刷用）
            </button>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              ※このPDFをコンビニ等で印刷、またはスマホ画面で提示してください
            </p>
          </div>
        )}
      </div>

      {/* ★追加：広告スペース（画面下部固定） */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-center items-center z-50">
        <div className="w-[320px] h-[50px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm border border-gray-300 rounded">
          ここにバナー広告が入ります
        </div>
      </div>
      {/* 広告の裏側が見えないように余白を確保 */}
      <div className="h-24"></div> 
    </main>
  );
}