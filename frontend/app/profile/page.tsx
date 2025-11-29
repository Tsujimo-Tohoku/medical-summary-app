"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        // 1. ログインユーザーを取得
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');
        setUser(user);

        // 2. プロフィール情報を取得
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setDisplayName(data.display_name || "");
        }
      } catch (error) {
        console.error('Error loading user data!', error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, []);

  const updateProfile = async () => {
    try {
      setUpdating(true);
      setMessage(null);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setMessage({ text: "プロフィールを更新しました！", type: 'success' });
    } catch (error) {
      console.error('Error updating the data!', error);
      setMessage({ text: "更新に失敗しました。", type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-slate-800 hover:text-blue-600 transition flex items-center gap-2">
            <span className="text-xl">←</span> Back to Home
          </Link>
          <h1 className="font-bold text-slate-700">プロフィール設定</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          
          <div className="mb-8 text-center">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
              {displayName ? displayName[0] : user?.email?.[0]?.toUpperCase()}
            </div>
            <p className="text-slate-500 text-sm">{user?.email}</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                表示名（ニックネーム）
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例: たろう、ママ"
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
              />
              <p className="text-xs text-slate-400 mt-2">
                ※ 家族共有機能などで使用される名前です。
              </p>
            </div>

            {message && (
              <div className={`p-4 rounded-lg text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}

            <button
              onClick={updateProfile}
              disabled={updating}
              className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all
                ${updating ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md"}`}
            >
              {updating ? "保存中..." : "保存する"}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}