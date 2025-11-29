import { createClient } from '@supabase/supabase-js'

// 環境変数が読み込めない場合（ビルド時など）のエラー回避用ダミー
// ※ 本番でこれが使われるとログインできませんが、ビルドは通ります
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)