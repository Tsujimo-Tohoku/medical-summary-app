import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// デバッグ用: 本番環境で値が取れているか確認（キーの中身は隠す）
if (typeof window !== 'undefined') {
  console.log("Supabase Config Check:", {
    url: supabaseUrl ? "Set" : "Missing",
    key: supabaseAnonKey ? "Set" : "Missing"
  });
}

// 安全策: 環境変数がない場合（ビルド時など）はダミーを入れてクラッシュを防ぐ
const url = supabaseUrl || "https://placeholder.supabase.co"
const key = supabaseAnonKey || "placeholder-key"

export const supabase = createClient(url, key)