import React from 'react';
import { ShieldAlert, Utensils, HeartPulse, ExternalLink } from 'lucide-react';

// 広告データの型定義
interface AdItem {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  url: string;
  badge?: string;
}

// 広告データ
const AD_ITEMS: AdItem[] = [
  {
    id: 1,
    title: "高齢者見守りサービス",
    description: "離れて暮らす親御様の安全を24時間ガードマンがサポート。緊急時の駆けつけも。",
    icon: <ShieldAlert className="w-6 h-6 text-teal-600" />,
    url: "https://www.alsok.co.jp/person/silver/", 
    badge: "人気"
  },
  {
    id: 2,
    title: "糖尿病・腎臓病対応の宅食",
    description: "管理栄養士監修の制限食をご自宅へ。レンジで温めるだけで健康的な食事を。",
    icon: <Utensils className="w-6 h-6 text-orange-500" />,
    url: "#",
    badge: "便利"
  },
  {
    id: 3,
    title: "訪問医療マッサージ",
    description: "健康保険適用で、国家資格者がご自宅まで訪問リハビリ・マッサージを行います。",
    icon: <HeartPulse className="w-6 h-6 text-rose-500" />,
    url: "#"
  }
];

export const NativeAds = () => {
  return (
    <div className="w-full mt-8 mb-12">
      {/* セクション見出し */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Support & Care
        </span>
        <div className="h-px bg-slate-200 flex-grow"></div>
        <span className="text-xs font-bold text-slate-400">ご家族へのサポート情報</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AD_ITEMS.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-400 hover:shadow-md transition-all duration-300 no-underline"
          >
            {/* PR表記 */}
            <div className="absolute top-2 right-2 text-[10px] text-slate-300 font-medium px-1 border border-slate-100 rounded">
              PR
            </div>

            <div className="flex items-start gap-4">
              {/* アイコン部分 */}
              <div className="shrink-0 p-3 bg-slate-50 rounded-lg group-hover:bg-teal-50 transition-colors">
                {item.icon}
              </div>

              {/* テキスト部分 */}
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-slate-700 text-sm group-hover:text-teal-700 transition-colors">
                    {item.title}
                  </h4>
                  {item.badge && (
                    <span className="text-[10px] font-bold text-white bg-slate-400 px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.description}
                </p>
                <div className="mt-2 flex items-center text-[11px] text-teal-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  詳細を見る <ExternalLink size={10} className="ml-1" />
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};