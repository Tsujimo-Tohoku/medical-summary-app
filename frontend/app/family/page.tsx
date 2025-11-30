"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function Family() {
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const [familyName, setFamilyName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchFamilyStatus();
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      setCanShare(true);
    }
  }, []);

  const fetchFamilyStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: families } = await supabase.from('families').select('*').limit(1);

      if (families && families.length > 0) {
        const myFamily = families[0];
        setFamily(myFamily);
        
        if (myFamily.invite_code && myFamily.invite_code_expires_at) {
          const expireDate = new Date(myFamily.invite_code_expires_at);
          if (expireDate > new Date()) {
            setInviteCode(myFamily.invite_code);
            setExpiresAt(myFamily.invite_code_expires_at);
          } else {
            setInviteCode(null);
          }
        }

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
      } else {
        // 所属していない場合
        setFamily(null);
        setMembers([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async () => {
    if (!familyName) return;
    setLoading(true);
    try {
      const { error } = await supabase.rpc('create_family_group', { name_input: familyName });
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

  const joinFamily = async () => {
    if (!joinCode) return;
    setLoading(true);
    try {
      const { data: success, error } = await supabase.rpc('join_family_by_code', { invite_code_input: joinCode });
      if (error) throw error;

      if (success) {
        await fetchFamilyStatus();
        setMessage({ text: "家族に参加しました！", type: 'success' });
      } else {
        setMessage({ text: "コードが無効か、期限切れです。", type: 'error' });
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: "参加に失敗しました。", type: 'error' });
      setLoading(false);
    }
  };

  const generateCode = async () => {
    if (!family) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc('generate_invite_code', { family_id_input: family.id });
      if (error) throw error;
      
      setInviteCode(data.code);
      setExpiresAt(data.expires_at);
      setMessage({ text: "新しい招待コードを発行しました（30分間有効）", type: 'success' });
    } catch (error) {
      console.error(error);
      setMessage({ text: "発行に失敗しました。", type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  // ★追加: グループから抜ける処理
  const leaveFamily = async () => {
    if (!confirm("本当にこの家族グループから抜けますか？\n（あなたの履歴データは消えませんが、グループから見えなくなります）")) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !family) return;

      // family_membersテーブルから自分の行を削除
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', family.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // 状態リセット
      setFamily(null);
      setMembers([]);
      setMessage({ text: "グループから抜けました。", type: 'success' });
      await fetchFamilyStatus(); // 最新状態（未所属）を取得

    } catch (error) {
      console.error(error);
      setMessage({ text: "脱退に失敗しました。", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareCode = async () => {
    if (!inviteCode) return;
    const shareText = `Medical Summary Assistantの家族招待コードが届いています。\n\n招待コード: ${inviteCode}\n有効期限: ${expiresAt ? formatExpiry(expiresAt) : ''}まで\n\nこちらのURLからアプリを開いて入力してください:\n${window.location.origin}/family`;
    
    try {
      await (navigator as any).share({
        title: '家族招待コード',
        text: shareText,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const formatExpiry = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
              <p className="text-xs text-slate-500 mb-4">家族から教えてもらった8桁のコードを入力してください。</p>
              <input
                type="text"
                placeholder="招待コード（例: A1B2C3D4）"
                className="w-full p-3 border border-slate-300 rounded-xl mb-4 focus:ring-2 focus:ring-slate-500 outline-none uppercase font-mono tracking-widest"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
              <button onClick={joinFamily} className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition">
                参加する
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">現在のグループ</span>
              <h2 className="text-2xl font-bold text-slate-800 mt-2 mb-6">{family.name}</h2>
              
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 inline-block w-full">
                {inviteCode ? (
                  <>
                    <p className="text-xs text-slate-500 mb-2">家族招待用コード（8桁）</p>
                    <div className="text-3xl font-mono font-bold text-slate-800 tracking-widest select-all mb-4 bg-white border border-slate-200 py-2 rounded-lg">
                      {inviteCode}
                    </div>
                    
                    <div className="flex gap-3 justify-center mb-4">
                      <button 
                        onClick={handleCopyCode}
                        className={`flex-1 max-w-[140px] text-sm font-bold py-2 rounded-lg border transition flex items-center justify-center gap-2
                          ${isCopied ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                      >
                        {isCopied ? 'コピー完了' : '📋 コピー'}
                      </button>
                      {canShare && (
                        <button onClick={handleShareCode} className="flex-1 max-w-[140px] text-sm font-bold py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center justify-center gap-2">
                          📤 送る
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-red-500 font-bold mb-4">
                      有効期限: {expiresAt && formatExpiry(expiresAt)} まで
                    </p>
                    <button onClick={generateCode} disabled={generating} className="text-xs text-slate-400 hover:text-slate-600 underline">
                      コードを再発行
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 mb-3">現在有効な招待コードはありません。</p>
                    <button onClick={generateCode} disabled={generating} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition">
                      {generating ? "発行中..." : "招待コードを発行する"}
                    </button>
                    <p className="text-xs text-slate-400 mt-2">※発行から30分間のみ有効です</p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <span>👨‍👩‍👧‍👦</span> メンバー ({members.length}人)
              </h3>
              <ul className="space-y-3 mb-6">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-lg shadow-sm font-bold text-slate-400">
                      {m.name ? m.name[0] : "?"}
                    </div>
                    <span className="font-bold text-slate-700">{m.name}</span>
                  </li>
                ))}
              </ul>

              {/* ★追加: グループ脱退ボタン */}
              <div className="pt-6 border-t border-slate-100 text-center">
                <button 
                  onClick={leaveFamily}
                  className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition font-bold"
                >
                  🚪 グループから抜ける
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}