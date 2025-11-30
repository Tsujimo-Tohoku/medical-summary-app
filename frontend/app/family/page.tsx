"use client";

import { useEffect, useState } from 'react';

// ==========================================
// ★STEP 1: 本番環境（VS Code）では、以下の3行のコメントアウト( // )を外してください
// ==========================================
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
type LinkProps = any; // エラー回避用

// ==========================================
// ★STEP 2: 本番環境（VS Code）では、以下の「プレビュー用モック」ブロックをすべて削除またはコメントアウトしてください
// ==========================================
// --- [プレビュー用モック START] ---

// --- [プレビュー用モック END] ---


import { 
  ArrowLeft, Users, UserPlus, LogOut, Copy, Check, 
  ShieldCheck, Loader2, AlertCircle
} from 'lucide-react';

// 型定義
interface Member {
  user_id: string;
  role: string;
}

interface Family {
  id: string;
  name: string;
  invite_code: string;
}

export default function FamilyPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  
  const [familyNameInput, setFamilyNameInput] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setUser(session.user);
      await fetchFamilyStatus(session.user.id);
    };
    init();
  }, []);

  // 家族の所属状況を確認する関数
  const fetchFamilyStatus = async (userId: string) => {
    try {
      // 1. 自分が所属している家族IDを探す
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select('family_id, role')
        .eq('user_id', userId)
        .single();

      // データがない(PGRST116)＝まだ家族に入っていない（正常）
      if (memberError && memberError.code !== 'PGRST116') throw memberError;

      if (memberData) {
        // 2. 家族の詳細情報を取得
        const { data: familyData } = await supabase
          .from('families')
          .select('*')
          .eq('id', memberData.family_id)
          .single();
        
        if (familyData) {
          setFamily(familyData);
          // 3. 同じ家族のメンバー一覧を取得
          const { data: membersData } = await supabase
            .from('family_members')
            .select('*')
            .eq('family_id', familyData.id);
          // @ts-ignore
          setMembers(membersData || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ★重要: RPC関数を使って安全に家族を作成する
  // これにより「作成者本人」も自動的にオーナーとして登録される
  const handleCreateFamily = async () => {
    if (!familyNameInput.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // Supabase側で定義した create_family_with_owner 関数を呼び出す
      const { data, error } = await supabase
        .rpc('create_family_with_owner', { 
          family_name: familyNameInput 
        });

      if (error) throw error;

      // 成功したら画面を再読み込みして最新状態にする
      await fetchFamilyStatus(user.id);

    } catch (e: any) {
      console.error(e);
      setErrorMsg("家族の作成に失敗しました: " + (e.message || "Unknown error"));
      setLoading(false);
    }
  };

  // 招待コードを使って既存の家族に参加する
  const handleJoinFamily = async () => {
    if (!inviteCodeInput.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. 招待コードから家族IDを特定
      const { data: targetFamily, error: searchError } = await supabase
        .from('families')
        .select('id')
        .eq('invite_code', inviteCodeInput.trim())
        .single();

      if (searchError || !targetFamily) {
        throw new Error("招待コードが見つかりません。コードを確認してください。");
      }

      // 2. 自分をメンバーに追加
      const { error: joinError } = await supabase
        .from('family_members')
        .insert({
          family_id: targetFamily.id,
          user_id: user.id,
          role: 'member'
        });

      if (joinError) throw joinError;

      await fetchFamilyStatus(user.id);

    } catch (e: any) {
      setErrorMsg(e.message);
      setLoading(false);
    }
  };

  // 家族から抜ける処理
  const handleLeaveFamily = async () => {
    if (!confirm("本当にこの家族グループから抜けますか？")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      setFamily(null);
      setMembers([]);
    } catch (e: any) {
      setErrorMsg("脱退に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (family?.invite_code) {
      navigator.clipboard.writeText(family.invite_code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (!user && !loading) {
    return (
      <div className="min-h-screen p-8 text-center bg-slate-50">
        <p className="mb-4 text-slate-600">ログインが必要です</p>
        <Link href="/login" className="text-teal-600 font-bold hover:underline">ログイン画面へ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold tracking-tight">家族設定</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-teal-600 w-8 h-8" /></div>
        ) : errorMsg ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2">
            <AlertCircle size={20} />
            {errorMsg}
            <button onClick={() => setErrorMsg(null)} className="ml-auto text-xs underline">閉じる</button>
          </div>
        ) : family ? (
          // --- 家族参加済みの場合 ---
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <Users size={36} />
              </div>
              <h2 className="text-2xl font-bold mb-1 text-slate-800">{family.name}</h2>
              <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">Family Group</span>

              <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200 dashed-border">
                <p className="text-xs text-slate-500 mb-3 font-bold uppercase tracking-widest">招待コード</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-3xl font-mono font-bold tracking-widest text-slate-800">{family.invite_code}</span>
                  <button onClick={copyInviteCode} className="p-2 bg-white border hover:bg-slate-50 rounded-lg transition text-teal-600 shadow-sm active:scale-95">
                    {isCopied ? <Check size={20}/> : <Copy size={20}/>}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-3">このコードを家族に伝えて入力してもらってください</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-slate-50 flex items-center gap-2">
                <ShieldCheck size={18} className="text-teal-600"/>
                <h3 className="text-sm font-bold text-slate-600">参加メンバー ({members.length})</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {members.map((m) => (
                  <div key={m.user_id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold shadow-inner">
                        {m.user_id.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          {m.user_id === user.id ? "あなた (Me)" : `User ${m.user_id.substring(0, 4)}...`}
                        </p>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{m.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={handleLeaveFamily}
                className="w-full py-4 text-slate-400 text-sm font-bold hover:text-red-600 transition flex items-center justify-center gap-2 hover:bg-red-50 rounded-xl"
              >
                <LogOut size={16} /> この家族グループから抜ける
              </button>
            </div>
          </div>
        ) : (
          // --- 家族未所属の場合 ---
          <div className="space-y-8 animate-fade-in">
            {/* Create Block */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-teal-100 p-2.5 rounded-xl text-teal-600 shadow-sm"><Users size={24}/></div>
                <div>
                  <h3 className="font-bold text-lg">新しく家族グループを作る</h3>
                  <p className="text-xs text-slate-400">あなたが代表者になります</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="家族の名前 (例: 田中家)" 
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition bg-slate-50 focus:bg-white"
                  value={familyNameInput}
                  onChange={(e) => setFamilyNameInput(e.target.value)}
                />
                <button 
                  onClick={handleCreateFamily}
                  disabled={!familyNameInput}
                  className={`px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all ${!familyNameInput ? 'bg-slate-300 shadow-none cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 hover:scale-105 active:scale-95'}`}
                >
                  作成
                </button>
              </div>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Join Block */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600 shadow-sm"><UserPlus size={24}/></div>
                <div>
                  <h3 className="font-bold text-lg">招待コードで参加する</h3>
                  <p className="text-xs text-slate-400">家族のグループに参加します</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="招待コード (例: A1B2...)" 
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition bg-slate-50 focus:bg-white uppercase tracking-widest font-mono"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  maxLength={8}
                />
                <button 
                  onClick={handleJoinFamily}
                  disabled={inviteCodeInput.length < 4}
                  className={`px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all ${inviteCodeInput.length < 4 ? 'bg-slate-300 shadow-none cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'}`}
                >
                  参加
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}