import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ★追加: コンソールに中身を出力してみる（本番確認用）
console.log("Current URL:", supabaseUrl); // URLが表示されるか？
console.log("Current Key:", supabaseAnonKey ? "Key exists" : "Key missing"); // キーがあるか？

// もし値がなければエラーを投げる
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are missing!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)