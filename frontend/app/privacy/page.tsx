export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-3xl mx-auto text-gray-800 leading-relaxed">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">プライバシーポリシー</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-l-4 border-blue-500 pl-3">1. はじめに</h2>
          <p>
            当ツール「症状伝え漏れ防止ツール」（以下、「本サービス」）は、ユーザーの入力した症状情報をAI（Google Gemini API）を用いて要約・整理するサービスです。
            本サービスは医師による診断を行うものではなく、あくまで情報の整理を目的としています。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-l-4 border-blue-500 pl-3">2. データの取り扱いについて</h2>
          <p className="mb-2">
            ユーザーが入力したテキストデータは、要約の生成目的でのみGoogle Gemini APIに送信されます。
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1 text-sm text-gray-600">
            <li>運営者がユーザーの個人を特定できる形で入力データを保存・閲覧することはありません。</li>
            <li>生成されたPDFデータは、ユーザーのデバイスにダウンロードされた後、サーバー上には残りません。</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-l-4 border-blue-500 pl-3">3. 広告配信について</h2>
          <p>
            本サービスでは、第三者配信の広告サービス（Google AdSense等）を利用する予定です。
            広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、当サイトや他サイトへのアクセスに関する情報「Cookie」を使用することがあります。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-l-4 border-blue-500 pl-3">4. 免責事項</h2>
          <p>
            本サービスの利用により生じた損害（医療上の不利益を含む）について、運営者は一切の責任を負いません。
            緊急を要する症状の場合は、本サービスを利用せず、直ちに救急車（119番）を呼ぶか医療機関を受診してください。
          </p>
        </section>

        <div className="mt-12 pt-8 border-t text-center">
          <a href="/" className="text-blue-600 hover:underline">
            ← トップページに戻る
          </a>
        </div>
      </div>
    </main>
  );
}