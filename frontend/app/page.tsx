"use client"; // ★重要：これを書かないと画面が動きません

import { useState } from "react";

export default function Home() {
  // 画面の状態を管理する箱（変数）
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ボタンが押された時の処理
  const handleAnalyze = async () => {
    if (!inputText) return;
    
    setIsLoading(true); // くるくる開始
    setResult("");      // 前の結果を消す

    try {
      // 1. PythonのAPI（脳みそ）にデータを送る
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText }), // 送るデータ
      });

      // 2. 返ってきたデータを受け取る
      const data = await response.json();
      setResult(data.result); // 結果を表示用の箱に入れる

    } catch (error) {
      console.error("エラー:", error);
      setResult("エラーが発生しました。バックエンドが起動しているか確認してください。");
    } finally {
      setIsLoading(false); // くるくる終了
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-6">
        
        {/* ヘッダー部分 */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🏥 症状伝え漏れ防止ツール
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          医師に伝えたい症状をそのまま入力してください。AIが医療用サマリーを作成します。
        </p>

        {/* 入力エリア */}
        <textarea
          className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-700"
          placeholder="（例）昨日の夜からお腹が痛い。熱が38度ある..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        {/* 実行ボタン */}
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !inputText}
          className={`mt-4 w-full py-3 px-6 rounded-lg font-bold text-white transition-all
            ${isLoading || !inputText 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700 shadow-md"}`}
        >
          {isLoading ? "AIが思考中..." : "医師に見せる画面を作成"}
        </button>

        {/* 結果表示エリア（結果がある時だけ表示） */}
        {result && (
          <div className="mt-8 border-t pt-6 animation-fade-in">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              ✅ 医師提示用画面
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 whitespace-pre-wrap text-gray-800 leading-relaxed font-medium">
              {result}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              ※この画面を医師に見せてください
            </p>
          </div>
        )}
        
      </div>
    </main>
  );
}