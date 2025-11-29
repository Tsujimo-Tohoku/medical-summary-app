"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function Family() {
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  
  // 入力フォーム用
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchFamilyStatus();
  }, []);

  const fetchFamilyStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. 自分が所属している家族を探す
      // （RLSポリシーにより、所属している家族しか見えない）
      const { data: families, error } = await supabase
        .from('families')
        .select('*')
        .limit(1);

      if (families && families.length > 0) {
        const myFamily = families[0];
        setFamily(myFamily);
        
        // 2. メンバー一覧を取得
        const { data: memberData } = await supabase
          .from('family_members')
          .select('user_id, profiles(display_name)')
          .eq('family_id', myFamily.id);
        
        if (memberData) {
          setMembers(memberData.map((m: any) => ({
            id: m.user_id,
            name: m.profiles?.display_name || "名無し"
          })));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

// 家族グループ作成
  const createFamily = async () => {
    if (!familyName) return;
    setLoading(true);
    try {
      // SQLで作った関数「create_family_group」を呼び出すだけ！
      const { data, error } = await supabase
        .rpc('create_family_group', { name_input: familyName });

      if (error) throw error;

      await fetchFamilyStatus();
      setMessage({ text: "家族グループを作成しました！", type: 'success' });

    } catch (error) {
      console.error(error);
      setMessage({ text: "作成に失敗しました。", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 家族に参加
  const joinFamily = async () => {
    if (!joinCode) return;
    setLoading(true);
    try {
      // Step 1で作ったSQL関数を呼び出す
      const { data: success, error } = await supabase
        .rpc('join_family_by_code', { invite_code_input: joinCode });

      if (error) throw error;

      if (success) {
        await fetchFamilyStatus();
        setMessage({ text: "家族に参加しました！", type: 'success' });
      } else {
        setMessage({ text: "招待コードが間違っています。", type: 'error' });
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: "参加に失敗しました。", type: 'error' });
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-slate-800 hover:text-blue-600 transition flex items-center gap-2">
            <span className="text-xl">←</span> Back to Home
          </Link>
          <h1 className="font-bold text-slate-700">家族設定</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {!family ? (
          // --- 未所属の場合：作成 or 参加 ---
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-blue-800 mb-4">🏠 新しい家族グループを作る</h2>
              <input
                type="text"
                placeholder="家族の名前（例: 田中家）"
                className="w-full p-3 border border-slate-300 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
              />
              <button onClick={createFamily} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
                グループを作成
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px bg-slate-300 flex-1"></div>
              <span className="text-slate-400 text-sm">または</span>
              <div className="h-px bg-slate-300 flex-1"></div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-700 mb-4">🔗 招待コードで参加する</h2>
              <input
                type="text"
                placeholder="招待コード（例: X9Y2Z1）"
                className="w-full p-3 border border-slate-300 rounded-xl mb-4 focus:ring-2 focus:ring-slate-500 outline-none uppercase"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
              <button onClick={joinFamily} className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition">
                参加する
              </button>
            </div>
          </div>
        ) : (
          // --- 所属済みの場合：情報表示 ---
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">現在のグループ</span>
              <h2 className="text-2xl font-bold text-slate-800 mt-2 mb-6">{family.name}</h2>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block w-full">
                <p className="text-xs text-slate-500 mb-1">招待コード（家族に教えてあげてください）</p>
                <p className="text-3xl font-mono font-bold text-slate-800 tracking-widest select-all">
                  {family.invite_code}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <span>👨‍👩‍👧‍👦</span> メンバー ({members.length}人)
              </h3>
              <ul className="space-y-3">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-lg shadow-sm">
                      {m.name[0]}
                    </div>
                    <span className="font-bold text-slate-700">{m.name}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <p className="text-center text-xs text-slate-400">
              ※ 履歴ページで、家族全員の診断記録を確認できます。
            </p>
          </div>
        )}
      </main>
    </div>
  );
}