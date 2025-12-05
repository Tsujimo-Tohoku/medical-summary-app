"use client";

import { useState, useEffect } from "react";
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, ShieldCheck, Users, Zap, Star } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://medical-backend-92rr.onrender.com";

// プラン定義
const PLANS = [
  {
    id: "free",
    name: "フリープラン",
    price: "0",
    period: "円 / 月",
    description: "まずはお試し。基本機能をご利用いただけます。",
    features: ["AIサマリー生成", "PDFダウンロード", "履歴の保存 (直近のみ)", "広告表示あり"],
    recommend: false,
    buttonText: "現在のプラン",
    active: true,
  },
  {
    // ここが重要！ Price IDではなく、バックエンドと合意した「プランのキー」を指定
    id: "pro_monthly", 
    name: "スタンダード",
    price: "500",
    period: "円 / 月",
    description: "通院が多い方に。制限なしで快適に。",
    features: ["サマリー生成 無制限", "履歴の無期限保存", "広告非表示", "優先サポート"],
    recommend: true,
    buttonText: "アップグレード",
  },
  {
    id: "family_monthly",
    name: "家族プラン",
    price: "980",
    period: "円 / 月",
    description: "離れて暮らす親御様の見守りに。",
    features: ["スタンダードの全機能", "家族グループ作成 (最大5名)", "通院データのリアルタイム共有", "家族の健康ログ管理"],
    recommend: false,
    buttonText: "家族ではじめる",
  },
];

export default function PlansPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkUser();
  }, []);

  const handleCheckout = async (planKey: string) => {
    if (!user) {
      alert("プランを購入するにはログインが必要です。");
      return;
    }

    setProcessingId(planKey);

    try {
      // APIに送るのは Price ID ではなく plan_key ("pro_monthly" 等)
      // これにより、フロントエンドのソースコードからStripe IDが消える
      const res = await fetch(`${BACKEND_URL}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_key: planKey,
          user_id: user.id,
          cancel_url: window.location.href, 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "セッション作成に失敗しました");
      }

      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("決済URLが取得できませんでした");
      }

    } catch (err: any) {
      alert(err.message);
      setProcessingId(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-2">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">プラン選択</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            あなたにぴったりのプランを
          </h2>
          <p className="text-slate-500">
            より便利に、より安心に。ライフスタイルに合わせてお選びください。
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div 
              key={plan.id} 
              className={`relative bg-white rounded-2xl p-8 border transition-all duration-300 flex flex-col
                ${plan.recommend 
                  ? 'border-teal-500 shadow-xl shadow-teal-500/10 scale-105 z-10' 
                  : 'border-slate-200 shadow-sm hover:shadow-md'}`}
            >
              {plan.recommend && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> おすすめ
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-500 font-bold">{plan.period}</span>
                </div>
                <p className="text-sm text-slate-500 mt-4 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <div className={`mt-0.5 p-0.5 rounded-full ${plan.recommend ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => plan.id !== 'free' && handleCheckout(plan.id)}
                disabled={plan.id === 'free' || !!processingId}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                  ${plan.id === 'free'
                    ? 'bg-slate-100 text-slate-400 cursor-default'
                    : plan.recommend
                      ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20'
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10'
                  }
                  ${processingId && processingId !== plan.id ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {processingId === plan.id ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    {plan.id === 'family_monthly' && <Users size={16} />}
                    {plan.id === 'pro_monthly' && <Zap size={16} />}
                    {plan.buttonText}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-12">
          ※ いつでも解約可能です。プランの変更や解約は設定画面から行えます。<br/>
          ※ 価格はすべて税込み表示です。
        </p>
      </main>
    </div>
  );
}