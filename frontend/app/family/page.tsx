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
  ShieldCheck, Loader2, AlertCircle, RefreshCw, Share2, Clock
} from 'lucide-react';

interface Member {
  user_id: string;
  role: string;
}

interface Family {
  id: string;
  name: string;
  invite_code: string;
  invite_code_created_at?: string;
}

export default function FamilyPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  
  // UI States
  const [familyNameInput, setFamilyNameInput] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // 有効期限表示用
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [expiryTimeStr, setExpiryTimeStr] = useState<string>("");

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

    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      setCanShare(true);
    }
  }, []);

  // タイマー処理
  useEffect(() => {
    if (!family?.invite_code_created_at) return;

    // 有効期限の絶対時刻を計算
    const created = new Date(family.invite_code_created_at).getTime();
    const expireTime = created + (30 * 60 * 1000); // 30分後
    const expireDateObj = new Date(expireTime);
    
    // "14:30" のような形式で時刻を表示
    setExpiryTimeStr(expireDateObj.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = expireTime - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("期限切れ");
      } else {
        setIsExpired(false);
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`あと ${minutes}分${seconds}秒`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [family]);

  const fetchFamilyStatus = async (userId: string) => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select('family_id, role')
        .eq('user_id', userId)
        .single();

      if (memberError && memberError.code !== 'PGRST116') throw memberError;

      if (memberData) {
        const { data: familyData } = await supabase
          .from('families')
          .select('*')
          .eq('id', memberData.family_id)
          .single();
        
        if (familyData) {
          setFamily(familyData);
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

  const handleCreateFamily = async () => {
    if (!familyNameInput.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase
        .rpc('create_family_with_owner', { 
          family_name: familyNameInput 
        });

      if (error) throw error;
      await fetchFamilyStatus(user.id);

    } catch (e: any) {
      console.error(e);
      setErrorMsg("作成失敗: " + e.message);
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCodeInput.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .rpc('join_family_by_code', { 
          invite_code_input: inviteCodeInput.trim() 
        });

      if (error) throw error;
      await fetchFamilyStatus(user.id);

    } catch (e: any) {
      console.error(e);
      let msg = e.message || "Unknown error";
      if (msg.includes("Invalid invite code")) msg = "招待コードが見つかりません。";
      if (msg.includes("Invite code has expired")) msg = "招待コードの有効期限(30分)が切れています。再発行してもらってください。";
      if (msg.includes("Already a member")) msg = "既にこの家族に参加しています。";
      
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!family) return;
    setGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase
        .rpc('generate_invite_code', { 
          family_id_input: family.id 
        });

      if (error) throw error;

      const newFamily = { 
        ...family, 
        invite_code: data.code,
        invite_code_created_at: new Date().toISOString() 
      };
      setFamily(newFamily);
      setSuccessMsg("新しいコードを発行しました！");
      setTimeout(() => setSuccessMsg(null), 3000);

    } catch (e: any) {
      setErrorMsg("発行失敗: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

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

  const shareInviteCode = async () => {
    if (!family?.invite_code) return;
    try {
      await (navigator as any).share({
        title: '家族招待コード',
        text: `「KarteNo」の家族招待コードです。\nコード: ${family.invite_code}\n有効期限: ${expiryTimeStr} まで\n\nアプリを開いて入力してください。`,
        url: window.location.origin
      });
    } catch (err) {
      console.log('Share canceled');
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
          // 参加済み
          <div className="space-y-6 animate-fade-in">
            {successMsg && (
              <div className="bg-green-50 text-green-700 p-3 rounded-lg text-center text-sm font-bold animate-pulse">
                {successMsg}
              </div>
            )}

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-blue-500"></div>
              
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users size={32} />
              </div>
              <h2 className="text-xl font-bold mb-1 text-slate-800">{family.name}</h2>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Family Group</span>

              <div className={`mt-6 p-6 rounded-xl border-2 border-dashed transition-colors ${isExpired ? 'bg-slate-50 border-slate-300' : 'bg-blue-50/50 border-blue-200'}`}>
                {isExpired ? (
                  <div className="text-center">
                    <p className="text-slate-500 font-bold mb-3">招待コードの有効期限が切れました</p>
                    <button 
                      onClick={handleGenerateCode} 
                      disabled={generating}
                      className="bg-teal-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-teal-700 transition flex items-center justify-center gap-2 mx-auto"
                    >
                      {generating ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
                      新しいコードを発行
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center justify-center mb-4">
                      <p className="text-xs text-slate-500 mb-1 font-bold uppercase tracking-widest">招待コード</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">
                        <Clock size={12} /> {timeLeft} ({expiryTimeStr}まで)
                      </div>
                    </div>
                    
                    <div className="text-4xl font-mono font-bold tracking-widest text-slate-800 mb-6 select-all">
                      {family.invite_code}
                    </div>
                    
                    <div className="flex gap-3 justify-center">
                      <button 
                        onClick={copyInviteCode} 
                        className="flex-1 max-w-[120px] py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1"
                      >
                        {isCopied ? <Check size={14}/> : <Copy size={14}/>} {isCopied ? "コピー済" : "コピー"}
                      </button>
                      
                      {canShare && (
                        <button 
                          onClick={shareInviteCode} 
                          className="flex-1 max-w-[120px] py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-1 shadow-md shadow-blue-200"
                        >
                          <Share2 size={14}/> 送る
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3">家族にこのコードを伝えてください</p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-slate-50 flex items-center gap-2">
                <ShieldCheck size={18} className="text-teal-600"/>
                <h3 className="text-sm font-bold text-slate-600">参加メンバー ({members.length})</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {members.map((m) => (
                  <div key={m.user_id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                        {m.user_id.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          {m.user_id === user.id ? "あなた" : "家族メンバー"}
                        </p>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${m.role === 'owner' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                          {m.role}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 text-center">
              <button onClick={handleLeaveFamily} className="text-sm text-red-400 hover:text-red-600 hover:underline">
                グループから抜ける
              </button>
            </div>
          </div>
        ) : (
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
                <input type="text" placeholder="家族の名前 (例: 田中家)" className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 bg-slate-50 focus:bg-white" value={familyNameInput} onChange={(e) => setFamilyNameInput(e.target.value)} />
                <button onClick={handleCreateFamily} disabled={!familyNameInput} className={`px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all ${!familyNameInput ? 'bg-slate-300 shadow-none cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 hover:scale-105 active:scale-95'}`}>作成</button>
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
                <input type="text" placeholder="招待コード (例: A1B2...)" className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 bg-slate-50 focus:bg-white uppercase font-mono" value={inviteCodeInput} onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())} maxLength={8} />
                <button onClick={handleJoinFamily} disabled={inviteCodeInput.length < 4} className={`px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all ${inviteCodeInput.length < 4 ? 'bg-slate-300 shadow-none cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'}`}>参加</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}