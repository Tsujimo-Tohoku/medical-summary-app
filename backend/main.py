import os
import io
import re
import json
import html
# html-sanitizer推奨だが、なければ標準ライブラリで代用するロジック
try:
    from html_sanitizer import Sanitizer
    sanitizer = Sanitizer()
except ImportError:
    sanitizer = None

import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# --- PDF Generation Libraries ---
from reportlab.lib.pagesizes import A4, B5
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import mm

load_dotenv()

# --- Config & Security ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set.")

genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

# CORS: フロントエンドのURLを許可
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
allow_origins = [FRONTEND_URL, "https://medical-summary-app.vercel.app"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# フォント読み込み (IPAexGothic)
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    font_path = os.path.join(current_dir, "ipaexg.ttf")
    if os.path.exists(font_path):
        pdfmetrics.registerFont(TTFont('IPAexGothic', font_path))
    else:
        print("Warning: ipaexg.ttf not found. Fallback to Helvetica.")
except Exception as e:
    print(f"Font Load Error: {e}")

# --- AI Settings (君のチューニングを復元) ---
# 医師視点でのカルテ作成＆法的リスク回避のシステム指示
system_instruction = """
あなたは救急・総合診療の経験豊富な「医療秘書AI」です。
患者（ユーザー）の入力した症状から、医師が診断に必要な情報（OPQRST、既往歴、リスク因子）を抽出し、
電子カルテにそのまま貼り付けられる「医学的サマリー」を作成してください。

【重要：法的制約】
1. あなたは医師ではありません。「診断（病名の断定）」は絶対に行わないでください。
2. 「○○病の疑いがあります」といった病名の示唆も避けてください。
3. 診療科の提案を行う場合は、あくまで「一般的に考えられる可能性」として提示し、断定的な表現を避けてください。
"""
model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

# --- Helper Functions ---

def mask_pii(text: str) -> str:
    """個人情報（電話番号、メアド）の簡易マスキング"""
    text = re.sub(r'\d{2,4}[-\s]?\d{2,4}[-\s]?\d{3,4}', '[PHONE_HIDDEN]', text)
    text = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[EMAIL_HIDDEN]', text)
    return text

def sanitize_input(text: str) -> str:
    """PDF生成用サニタイズ"""
    if sanitizer:
        return sanitizer.sanitize(text)
    return html.escape(text)

# --- API Models ---

class UserRequest(BaseModel):
    text: str = Field(..., max_length=4000, description="Patient symptoms")
    language: str = "Japanese"
    pdf_size: str = "A4"

# --- Endpoints ---

@app.post("/analyze")
async def analyze_symptoms(request: UserRequest):
    try:
        # 1. PII Masking
        safe_text = mask_pii(request.text)

        # 2. Prompt Construction (君のこだわりプロンプトを使用)
        explanation_instruction = ""
        if request.language not in ["Japanese", "日本語", "ja"]:
             explanation_instruction = f"- `explanation`: ユーザーへの説明を{request.language}で記述（AIの理解を伝えるため）。"
        else:
             explanation_instruction = "- `explanation`: 空文字（\"\"）にしてください。"

        prompt = f"""
        以下の患者の訴えを分析し、以下のJSONフォーマットのみを出力してください。Markdown記号（###など）は不要です。

        対象テキスト:
        {safe_text}
        
        ユーザーの使用言語: {request.language}

        【出力JSONフォーマット】
        {{
            "summary": {{
                "chief_complaint": "主訴（一番の症状を一言で）",
                "history": "現病歴（いつから、どうなったか、OPQRST情報を含めて時系列で記述）",
                "symptoms": "随伴症状（主訴に伴うその他の症状）",
                "background": "既往歴・服薬・アレルギー（入力になければ「特記なし」）"
            }},
            "departments": ["診療科1", "診療科2"], 
            "explanation": "ユーザーへの説明（日本語以外の場合のみ）"
        }}

        重要: 
        - 医師が読むための専門的かつ簡潔な表現に変換すること。
        - 重要なキーワード（数値、期間、部位）は強調のため **太字** で囲むこと（例: **38.5度**の発熱）。
        - `departments` は「推奨」ではなく「関連する診療科の例」として抽出すること。迷う場合は「一般内科」を含める。
        """
        
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)

    except Exception as e:
        print(f"Analyze Error: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed.")

@app.post("/pdf")
async def create_pdf(request: UserRequest):
    try:
        buffer = io.BytesIO()
        
        # サイズ設定
        pagesize = A4
        margin = 20*mm
        if request.pdf_size == "B5": pagesize = B5
        elif request.pdf_size == "Receipt": 
            pagesize = (80*mm, 300*mm); margin = 5*mm

        doc = SimpleDocTemplate(
            buffer, pagesize=pagesize, 
            rightMargin=margin, leftMargin=margin, topMargin=margin, bottomMargin=margin
        )

        styles = getSampleStyleSheet()
        registered_fonts = pdfmetrics.getRegisteredFontNames()
        font_name = 'IPAexGothic' if 'IPAexGothic' in registered_fonts else 'Helvetica'
        
        base_font_size = 9 if request.pdf_size == "Receipt" else 10
        title_font_size = 14 if request.pdf_size == "Receipt" else 18

        jp_style = ParagraphStyle(
            name='JP', parent=styles['Normal'], fontName=font_name, 
            fontSize=base_font_size, leading=base_font_size * 1.6
        )
        title_style = ParagraphStyle(
            name='Title', parent=styles['Heading1'], fontName=font_name, 
            fontSize=title_font_size, leading=title_font_size * 1.4, 
            alignment=1, spaceAfter=5*mm
        )

        story = []
        title_text = "Medical Summary" if request.pdf_size == "Receipt" else "Medical Summary / 医師提示用サマリー"
        story.append(Paragraph(title_text, title_style))
        story.append(Spacer(1, 5*mm))
        
        # テキスト処理
        lines = request.text.split('\n')
        for line in lines:
            if not line.strip(): continue
            
            # HTMLエスケープ & 太字復元
            safe_line = html.escape(line)
            formatted_line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', safe_line)
            
            # 見出し装飾
            if line.strip().startswith("■"):
                clean_text = formatted_line.replace("■", "").strip()
                story.append(Spacer(1, 2*mm))
                header_size = base_font_size + 2
                story.append(Paragraph(f"<font size={header_size}><b>■ {clean_text}</b></font>", jp_style))
            elif line.strip().startswith("- ") or line.strip().startswith("・"):
                # リスト表示
                clean_text = formatted_line.replace("- ", "").replace("・", "").strip()
                story.append(Paragraph(f"• {clean_text}", jp_style))
            else:
                story.append(Paragraph(formatted_line, jp_style))
            
            story.append(Spacer(1, 1*mm))

        doc.build(story)
        buffer.seek(0)
        return StreamingResponse(
            buffer, media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=summary.pdf"}
        )
    except Exception as e:
        print(f"PDF Error: {e}")
        raise HTTPException(status_code=500, detail="PDF generation failed.")