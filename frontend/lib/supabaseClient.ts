import { createClient } from '@supabase/supabase-js'

// 環境変数を取得
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// デバッグ用ログ（ビルドログに表示されます）
// ※セキュリティのためキーの中身は隠して表示します
console.log("---------------------------------------------------")
console.log("Supabase Client Setup:")
console.log("URL:", envUrl ? "Found" : "Not Found (Using dummy)")
console.log("Key:", envKey ? "Found" : "Not Found (Using dummy)")
console.log("---------------------------------------------------")

// URLがない場合（ビルド時など）は、絶対にエラーにならないダミーURLを入れる
const supabaseUrl = envUrl || "https://placeholder.supabase.co"
const supabaseAnonKey = envKey || "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)