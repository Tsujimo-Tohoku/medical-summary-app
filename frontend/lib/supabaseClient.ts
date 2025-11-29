import { createClient } from '@supabase/supabase-js'

// 環境変数から設定を読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// アプリ全体で使う「supabase」という道具を作る
export const supabase = createClient(supabaseUrl, supabaseAnonKey)