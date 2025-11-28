# check_models.py
import google.generativeai as genai
import os
from dotenv import load_dotenv

# APIキーの読み込み
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("=== あなたが使えるモデル一覧 ===")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"エラーが発生しました: {e}")