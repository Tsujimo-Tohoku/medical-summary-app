/** @type {import('next').NextConfig} */
const nextConfig = {
  // 画像のドメイン設定（今回は関係ないですが念のため）
  images: {
    domains: ['placehold.co'],
  },
};

// --- 🕵️‍♀️ ここから盗聴コード ---
console.log("==========================================");
console.log("   VERCEL BUILD ENVIRONMENT DEBUGGER");
console.log("==========================================");

// URLが届いているか確認（セキュリティのため最初の8文字だけ表示）
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (url) {
  console.log(`✅ NEXT_PUBLIC_SUPABASE_URL found: ${url.substring(0, 8)}...`);
} else {
  console.log("❌ NEXT_PUBLIC_SUPABASE_URL is MISSING or UNDEFINED");
}

// キーが届いているか確認
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (key) {
  console.log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY found: (Hidden for security)`);
} else {
  console.log("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is MISSING or UNDEFINED");
}
console.log("==========================================");
// --- 🕵️‍♀️ ここまで ---

export default nextConfig;
```

#### Step 2: GitHubにプッシュ

```powershell
git add .
git commit -m "Add build debug logs"
git push