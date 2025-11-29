"use client";

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // ログインか登録かの切り替え
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  // Googleログイン処理
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`, // ログイン後の戻り先
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  // メールログイン/登録処理
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // 新規登録
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ text: "確認メールを送信しました。メール内のリンクをクリックしてください。", type: 'success' });
      } else {
        // ログイン
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/'); // トップページへ移動
      }
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-lg border border-slate-200 p-8">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl text-white font-bold text-2xl mb-4">AI</div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isSignUp ? 'アカウント作成' : 'ログイン'}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Medical Summary Assistant へようこそ
          </p>
        </div>

        {/* メッセージ表示エリア */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* Googleログインボタン */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl transition mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Googleで{isSignUp ? '登録' : 'ログイン'}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">またはメールアドレスで</span>
          </div>
        </div>

        {/* メールログインフォーム */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">メールアドレス</label>
            <input
              type="email"
              required
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">パスワード</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="6文字以上"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-bold text-white transition
              ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700'}`}
          >
            {loading ? '処理中...' : (isSignUp ? 'アカウントを作成' : 'ログイン')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
            className="text-sm text-blue-600 hover:underline font-bold"
          >
            {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-800">
            ← トップページに戻る
          </a>
        </div>

      </div>
    </div>
  );
}