"use client";

import { useState, useEffect } from 'react';
// ★本番環境ではコメントアウトを外す
import { supabase } from '../../lib/supabaseClient';
// import Link from 'next/link';

// --- [プレビュー用モック START] ---
const Link = ({ href, children, className, ...props }: any) => (
  <a href={href} className={className} {...props}>{children}</a>
);
// --- [プレビュー用モック END] ---

import { User, Save, ArrowLeft, Loader2, Check } from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setUser(session.user);

      // プロフィール取得
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || "");
      }
      setLoading(false);
    };

    getProfile();
  }, []);

  const updateProfile = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setMessage({ text: "プロフィールを更新しました", type: 'success' });
    } catch (error) {
      console.error(error);
      setMessage({ text: "更新に失敗しました", type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold tracking-tight">プロフィール設定</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-teal-600" /></div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border-4 border-white shadow-sm">
                <User size={48} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">表示名（ニックネーム）</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例: お父さん, 花子"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition"
                />
                <p className="text-xs text-slate-400 mt-2">この名前が家族グループ内で表示されます。</p>
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message.type === 'success' && <Check size={16} />}
                  {message.text}
                </div>
              )}

              <button
                onClick={updateProfile}
                disabled={saving}
                className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                保存する
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}