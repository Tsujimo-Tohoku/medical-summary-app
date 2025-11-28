# backend/main.py
import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# 1. 設定の読み込み
load_dotenv() # .envファイルを探して読み込む
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# 2. FastAPIのアプリを作成
app = FastAPI()
# フロントエンド(http://localhost:3000)からのアクセスを許可する設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # 許可するURL
    allow_credentials=True,
    allow_methods=["*"], # 全ての操作(GET, POSTなど)を許可
    allow_headers=["*"],
)

# 3. モデルの設定（医療秘書モード）
system_instruction = """
あなたは、患者の体調不良の訴えを整理する「医療秘書AI」です。
医学的な診断（病名の断定）は行わず、医師への伝達事項として整理してください。
出力はMarkdown形式ではなく、プレーンテキストで構造化してください。
"""
model = genai.GenerativeModel(
    'gemini-2.5-flash',
    system_instruction=system_instruction
)

# 4. データ形式の定義（入力データのルールを決める）
class UserRequest(BaseModel):
    text: str # ユーザーは「text」という名前で文字を送ってくること

# 5. APIの機能（エンドポイント）を作成
@app.post("/analyze")
async def analyze_symptoms(request: UserRequest):
    """
    フロントエンドから送られてきた症状テキストを受け取り、
    Geminiで分析して結果を返す機能
    """
    try:
        print(f"受信したテキスト: {request.text}") # ログ用
        
        prompt = f"""
        以下の患者の訴えを医師提示用にサマリーしてください。
        
        対象テキスト:
        {request.text}
        """
        
        response = model.generate_content(prompt)
        
        # 結果をJSON形式で返す
        return {"result": response.text}
        
    except Exception as e:
        # エラーが起きたら500エラーを返す
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "AI Medical Server is Running!"}