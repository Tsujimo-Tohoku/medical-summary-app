"use client";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/" className="text-lg font-bold text-slate-800 hover:text-blue-600 transition flex items-center gap-2">
              <span className="text-xl">←</span> Back to Home
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
          
          {/* 開発ストーリー */}
          <section className="mb-12">
            <h1 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-4">開発者について</h1>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
              <p className="mb-4">
                はじめまして。この「Medical Summary Assistant」を開発した、東北大学 電気情報物理工学科の学生です。
              </p>
              <p className="mb-4">
                このアプリを作ったきっかけは、私自身のコンプレックスにあります。
                私は昔から、とっさのコミュニケーションが得意ではなく、自分の状況を素早く正確に相手に伝えることに苦手意識がありました。
              </p>
              <p className="mb-4">
                特に体調が悪い時は、頭が回らず、医師や看護師の質問に焦ってしまい、後になって「あれも言えばよかった」と後悔することが何度もありました。
                「病院に行くのが億劫だ」と感じてしまうその気持ちを、技術の力で少しでも取り除きたい——そんな想いで、このアプリを個人で開発しました。
              </p>
              <p>
                AIがあなたの代わりに言葉を整理することで、安心して受診できる手助けになれば幸いです。
              </p>
            </div>
          </section>

          {/* 運営・支援のお願いエリア（追加） */}
          <section className="mb-12 bg-blue-50 border border-blue-100 rounded-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-600 text-white p-2 rounded-lg text-xl">☕</span>
              <h2 className="text-xl font-bold text-blue-900">運営へのご支援について</h2>
            </div>
            
            <p className="text-slate-700 mb-4 text-sm leading-relaxed">
              本アプリは、<strong>「必要な時に誰でも使えるように」</strong>という想いから、学生個人が開発し、<strong>完全無料</strong>で公開しています。
            </p>
            <p className="text-slate-700 mb-6 text-sm leading-relaxed">
              しかし、AIの利用料やサーバー維持費などの運営コストが発生しております。
              現在は広告収入等で賄っておりますが、もし「役に立った」「応援したい」と思っていただけましたら、温かいご支援をいただけますと幸いです。
              いただいたご支援は、全額をアプリの維持・機能開発に充てさせていただきます。
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* 寄付ボタン例: Buy Me a Coffee や Amazonほしい物リストなど */}
              <a 
                href="https://www.buymeacoffee.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-sm"
              >
                <span>☕</span> 開発者を支援する
              </a>
              {/* <a 
                href="https://www.amazon.jp/..." 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-xl transition shadow-sm"
              >
                🎁 ほしい物リスト
              </a>
               */}
            </div>
          </section>

          <hr className="border-slate-100 my-8" />

          {/* プロフィール & リンク */}
          <section className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span>👨‍💻</span> Profile
              </h2>
              <ul className="space-y-3 text-slate-600 text-sm">
                <li className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="font-bold min-w-[4rem] text-slate-800">所属:</span>
                  <span>東北大学 工学部</span>
                </li>
                <li className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="font-bold min-w-[4rem] text-slate-800">専攻:</span>
                  <span>電気情報物理工学科</span>
                </li>
                <li className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="font-bold min-w-[4rem] text-slate-800">関心:</span>
                  <span>AI応用, Web・アプリ開発, ガジェット</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span>📮</span> Contact
              </h2>
              <p className="text-slate-500 mb-4 text-xs">
                バグ報告、機能要望、その他お問い合わせは以下のリンクよりお願いいたします。
              </p>
              <div className="flex flex-col gap-3">
                <a 
                  href="https://forms.google.com/example" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-blue-200 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition shadow-sm text-sm"
                >
                  📝 お問い合わせフォーム
                </a>
                <a 
                  href="https://twitter.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition shadow-sm text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                  X (Twitter)
                </a>
              </div>
            </div>
          </section>

        </div>
      </main>

      <footer className="py-8 text-center text-sm text-slate-400">
        <p>© 2025 Medical Summary Assistant.</p>
      </footer>
    </div>
  );
}