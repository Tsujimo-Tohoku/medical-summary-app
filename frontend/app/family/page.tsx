"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import { 
  ArrowLeft, Users, UserPlus, LogOut, Copy, Check, 
  ShieldCheck, Loader2 
} from 'lucide-react';

// 型定義
interface Profile {
  id: string;
  email: string;
}

interface Family {
  id: string;
  name: string;
  invite_code: string;
}

interface Member {
  user_id: string;
  role: string;
  profiles?: {
    email: string; // 本来はnickname推奨だが、今はemailを表示
  };
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

  // 初期データ読み込み
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

  // 家族所属状況の取得
  const fetchFamilyStatus = async (userId: string) => {
    try {
      // 1. 所属している家族IDを取得
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select('family_id, role')
        .eq('user_id', userId)
        .single();

      if (memberError && memberError.code !== 'PGRST116') { // PGRST116は「データなし」
        throw memberError;
      }

      if (memberData) {
        // 2. 家族詳細を取得
        const { data: familyData } = await supabase
          .from('families')
          .select('*')
          .eq('id', memberData.family_id)
          .single();
        
        if (familyData) {
          setFamily(familyData);
          // 3. メンバー一覧を取得
          // ※ profilesテーブルとの結合は、Supabase側で外部キー設定が必要だが
          // 今回は簡易的にuser_idのみ、または別途profilesを取得する設計にする
          // (ここでは簡易化のためemail表示はauth情報に依存できないので、IDのみ表示か、別途取得)
          // 今回はRLSの範囲内で取得できる情報のみ表示
          const { data: membersData } = await supabase
            .from('family_members')
            .select('*')
            .eq('family_id', familyData.id);
            
          setMembers(membersData || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 家族を作成する
  const handleCreateFamily = async () => {
    if (!familyNameInput.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // ランダムな8桁の招待コード生成
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      // 1. Familiesテーブルに作成
      const { data: newFamily, error: createError } = await supabase
        .from('families')
        .insert({ name: familyNameInput, invite_code: inviteCode })
        .select()
        .single();

      if (createError) throw createError;

      // 2. FamilyMembersに自分を追加 (Owner)
      const { error: joinError } = await supabase
        .from('family_members')
        .insert({
          family_id: newFamily.id,
          user_id: user.id,
          role: 'owner'
        });

      if (joinError) throw joinError;

      await fetchFamilyStatus(user.id);

    } catch (e: any) {
      setErrorMsg("家族の作成に失敗しました: " + e.message);
      setLoading(false);
    }
  };

  // 招待コードで参加する
  const handleJoinFamily = async () => {
    if (!inviteCodeInput.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. コードから家族を検索
      const { data: targetFamily, error: searchError } = await supabase
        .from('families')
        .select('id')
        .eq('invite_code', inviteCodeInput.trim())
        .single();

      if (searchError || !targetFamily) {
        throw new Error("招待コードが見つかりません");
      }

      // 2. メンバーに追加
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

  // 家族から脱退する
  const handleLeaveFamily = async () => {
    if (!confirm("本当にこの家族グループから抜けますか？履歴の共有ができなくなります。")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('user_id', user.id); // RLSにより自分のレコードのみ削除可能

      if (error) throw error;
      
      setFamily(null);
      setMembers([]);
    } catch (e: any) {
      setErrorMsg("脱退に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 招待コードコピー
  const copyInviteCode = () => {
    if (family?.invite_code) {
      navigator.clipboard.writeText(family.invite_code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (!user && !loading) {
    return (
      <div className="min-h-screen p-8 text-center">
        <p className="mb-4">ログインが必要です</p>
        <Link href="/login" className="text-teal-600 font-bold">ログイン画面へ</Link>
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
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-teal-600" /></div>
        ) : errorMsg ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm font-bold">⚠️ {errorMsg}</div>
        ) : family ? (
          // --- 家族参加済みの場合 ---
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h2 className="text-xl font-bold mb-1">{family.name}</h2>
              <p className="text-xs text-slate-400">Family Group</p>

              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">招待コード</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-bold tracking-widest text-slate-800">{family.invite_code}</span>
                  <button onClick={copyInviteCode} className="p-2 hover:bg-white rounded-full transition text-teal-600">
                    {isCopied ? <Check size={20}/> : <Copy size={20}/>}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">このコードを家族に伝えて入力してもらってください</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-slate-50 flex items-center gap-2">
                <ShieldCheck size={16} className="text-teal-600"/>
                <h3 className="text-sm font-bold text-slate-600">参加メンバー ({members.length})</h3>
              </div>
              <div className="divide-y">
                {members.map((m) => (
                  <div key={m.user_id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                        {m.user_id.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        {/* 本来はProfilesテーブルから名前を引くべきだが今回はIDで代用 */}
                        <p className="text-sm font-bold text-slate-700">
                          {m.user_id === user.id ? "あなた" : `User ${m.user_id.substring(0, 4)}...`}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">{m.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t">
              <button 
                onClick={handleLeaveFamily}
                className="w-full py-3 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> この家族から抜ける
              </button>
            </div>
          </div>
        ) : (
          // --- 家族未所属の場合 ---
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-teal-100 p-2 rounded-lg text-teal-600"><Users size={20}/></div>
                <h3 className="font-bold">新しく家族グループを作る</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">あなたが代表者となって、新しい家族グループを作成します。</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="家族の名前 (例: 田中家)" 
                  className="flex-1 border rounded-lg px-4 py-2 text-sm outline-none focus:border-teal-500 transition"
                  value={familyNameInput}
                  onChange={(e) => setFamilyNameInput(e.target.value)}
                />
                <button 
                  onClick={handleCreateFamily}
                  disabled={!familyNameInput}
                  className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition ${!familyNameInput ? 'bg-slate-300' : 'bg-teal-600 hover:bg-teal-700'}`}
                >
                  作成
                </button>
              </div>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><UserPlus size={20}/></div>
                <h3 className="font-bold">招待コードで参加する</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">家族から教えてもらった8桁の招待コードを入力してください。</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="招待コード (例: A1B2C3D4)" 
                  className="flex-1 border rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 transition uppercase"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  maxLength={8}
                />
                <button 
                  onClick={handleJoinFamily}
                  disabled={inviteCodeInput.length < 4}
                  className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition ${inviteCodeInput.length < 4 ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700'}`}
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