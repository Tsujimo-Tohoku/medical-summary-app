import { createClient } from '@supabase/supabase-js'

// ★ここに直接書き込みます（これで読み込みミスは100%起きません）
// 画像から読み取ったあなたのURLです
const supabaseUrl = "https://izowhygftofarmoenjxd.supabase.co"

// ★ここに「ey...」から始まる長いキー（Anon Key）を貼り付けてください
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6b3doeWdmdG9mYXJtb2VuanhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjYwODQsImV4cCI6MjA3OTk0MjA4NH0.poOPiTbLO3aUap2iimLFV6BYXfBOSjI0ffMuNceHcmo"

// ※もしキーを忘れたら、Supabase管理画面の [Settings] -> [API] で確認できます

export const supabase = createClient(supabaseUrl, supabaseAnonKey)