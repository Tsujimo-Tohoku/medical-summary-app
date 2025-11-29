import { createClient } from '@supabase/supabase-js'

// 1. 環境変数を取得
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 2. 読み込めたかどうかをコンソールに出力（デバッグ用）
// ※このログはブラウザのF12コンソールで見れます
if (typeof window !== 'undefined') {
  console.log("🚀 Supabase Client Debug:");
  console.log("- URL:", envUrl ? `Starts with ${envUrl.substring(0, 8)}...` : "UNDEFINED (Missing!)");
  console.log("- Key:", envKey ? "Loaded (Hidden)" : "UNDEFINED (Missing!)");
}

// 3. 安全策：環境変数がない場合はダミーを入れて、ビルド落ちを防ぐ
// （ただし、ダミーだとログインはできません）
const supabaseUrl = envUrl || "https://placeholder.supabase.co"
const supabaseAnonKey = envKey || "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)